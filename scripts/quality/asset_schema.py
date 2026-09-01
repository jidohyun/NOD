#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
# How to run: python3 scripts/quality/asset_schema.py [--json] [vault-dir]
#
# Validates every vault asset against schema v1 (templates/asset.md, approved
# 2026-08-09) and the claim-guidelines contract that each claim is anchored by
# a (cN) Evidence quotation. The frontmatter is a deliberately small YAML
# subset (scalar url/captured_at, claims/relations as lists of flat objects),
# so it is parsed here directly; the harness is stdlib-only by policy.
#
# v1.1 note: five schema decisions are pending (docs/a0-retrospective.md).
# This validator encodes v1 as it stands; unknown top-level frontmatter keys
# are reported as errors so a future `structures` field arrives through a
# deliberate change here, not silently.

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Final

RELATION_TYPES: Final = frozenset({"new", "supports", "conflicts", "qualifies"})
TOP_LEVEL_KEYS: Final = frozenset({"url", "captured_at", "claims", "relations"})
CLAIM_KEYS: Final = frozenset({"id", "text"})
RELATION_KEYS: Final = frozenset({"claim", "type", "target", "note"})
SLUG_PATTERN: Final = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
CLAIM_ID_PATTERN: Final = re.compile(r"^c[1-9][0-9]*$")
DATE_PATTERN: Final = re.compile(r"^\d{4}-\d{2}-\d{2}$")
TARGET_PATTERN: Final = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*#c[1-9][0-9]*$")
ANCHOR_PATTERN: Final = re.compile(r"\((c[1-9][0-9]*)\)")
URL_PATTERN: Final = re.compile(r"^https://[^\s]+$")
MAX_CLAIMS: Final = 3


@dataclass
class Asset:
    path: Path
    errors: list[str] = field(default_factory=list)
    url: str | None = None
    claim_ids: list[str] = field(default_factory=list)

    def error(self, message: str) -> None:
        self.errors.append(message)


def _strip_comment(line: str) -> str:
    # As in YAML, '#' starts a comment only outside quotes AND when preceded
    # by whitespace (or at line start) — 'slug#c1' keeps its fragment.
    in_double = False
    for index, char in enumerate(line):
        if char == '"':
            in_double = not in_double
        elif (
            char == "#"
            and not in_double
            and (index == 0 or line[index - 1] in " \t")
        ):
            return line[:index]
    return line


def _parse_scalar(raw: str) -> str | None:
    value = raw.strip()
    if value in ("", "null", "~"):
        return None
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        return value[1:-1]
    return value


def parse_frontmatter(asset: Asset, text: str) -> dict[str, object] | None:
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        asset.error("frontmatter: must start with '---' on line 1")
        return None
    try:
        end = next(i for i in range(1, len(lines)) if lines[i].strip() == "---")
    except StopIteration:
        asset.error("frontmatter: closing '---' not found")
        return None

    data: dict[str, object] = {}
    current_list: list[dict[str, str | None]] | None = None
    current_item: dict[str, str | None] | None = None
    for number, raw in enumerate(lines[1:end], start=2):
        line = _strip_comment(raw).rstrip()
        if not line.strip():
            continue
        indent = len(line) - len(line.lstrip())
        stripped = line.strip()
        if indent == 0:
            key, _, rest = stripped.partition(":")
            key = key.strip()
            if not _:
                asset.error(f"frontmatter line {number}: expected 'key:' at top level")
                return None
            if rest.strip():
                data[key] = _parse_scalar(rest)
                current_list = None
            else:
                current_list = []
                data[key] = current_list
            current_item = None
        elif stripped.startswith("- "):
            if current_list is None:
                asset.error(f"frontmatter line {number}: list item outside a list key")
                return None
            current_item = {}
            current_list.append(current_item)
            key, sep, rest = stripped[2:].partition(":")
            if sep:
                current_item[key.strip()] = _parse_scalar(rest)
        else:
            if current_item is None:
                asset.error(f"frontmatter line {number}: field outside a list item")
                return None
            key, sep, rest = stripped.partition(":")
            if not sep:
                asset.error(f"frontmatter line {number}: expected 'key: value'")
                return None
            current_item[key.strip()] = _parse_scalar(rest)
    data["__body__"] = "\n".join(lines[end + 1 :])
    return data


def validate_asset(path: Path) -> Asset:
    asset = Asset(path=path)
    if not SLUG_PATTERN.match(path.stem):
        asset.error(f"filename: '{path.stem}' is not a lowercase slug ([a-z0-9-])")
    data = parse_frontmatter(asset, path.read_text(encoding="utf-8"))
    if data is None:
        return asset
    body = str(data.pop("__body__"))

    unknown = set(data) - TOP_LEVEL_KEYS
    for key in sorted(unknown):
        asset.error(f"frontmatter: unknown key '{key}' (schema v1; see docs/a0-retrospective.md before adding fields)")
    for key in ("url", "captured_at", "claims", "relations"):
        if key not in data:
            asset.error(f"frontmatter: missing required key '{key}'")

    url = data.get("url")
    if isinstance(url, str):
        asset.url = url
        if not URL_PATTERN.match(url):
            asset.error(f"url: '{url}' is not an https URL")
        if "?" in url or "#" in url:
            asset.error("url: must be normalized (no query string or fragment)")
        if url.endswith("/") and url.rstrip("/").count("/") > 2:
            asset.error("url: must be normalized (no trailing slash)")

    captured = data.get("captured_at")
    if isinstance(captured, str) and not DATE_PATTERN.match(captured):
        asset.error(f"captured_at: '{captured}' is not YYYY-MM-DD")

    claims = data.get("claims")
    claim_ids: list[str] = []
    if isinstance(claims, list):
        if not 1 <= len(claims) <= MAX_CLAIMS:
            asset.error(f"claims: {len(claims)} claims; schema allows 1..{MAX_CLAIMS}")
        for position, claim in enumerate(claims, start=1):
            unknown_keys = set(claim) - CLAIM_KEYS
            for key in sorted(unknown_keys):
                asset.error(f"claims[{position}]: unknown key '{key}'")
            claim_id = claim.get("id")
            if not isinstance(claim_id, str) or not CLAIM_ID_PATTERN.match(claim_id):
                asset.error(f"claims[{position}]: id '{claim_id}' must match c1, c2, ...")
                continue
            if claim_id != f"c{position}":
                asset.error(f"claims[{position}]: id '{claim_id}' out of order (expected c{position})")
            if claim_id in claim_ids:
                asset.error(f"claims[{position}]: duplicate id '{claim_id}'")
            claim_ids.append(claim_id)
            text_value = claim.get("text")
            if not text_value or not str(text_value).strip():
                asset.error(f"claims[{position}] ({claim_id}): empty text")
    asset.claim_ids = claim_ids

    relations = data.get("relations")
    if isinstance(relations, list):
        for position, relation in enumerate(relations, start=1):
            unknown_keys = set(relation) - RELATION_KEYS
            for key in sorted(unknown_keys):
                asset.error(f"relations[{position}]: unknown key '{key}'")
            claim_ref = relation.get("claim")
            if claim_ref not in claim_ids:
                asset.error(f"relations[{position}]: claim '{claim_ref}' does not reference a declared claim id")
            relation_type = relation.get("type")
            if relation_type not in RELATION_TYPES:
                asset.error(f"relations[{position}]: type '{relation_type}' not in {sorted(RELATION_TYPES)}")
            target = relation.get("target")
            if target is not None and not TARGET_PATTERN.match(str(target)):
                asset.error(f"relations[{position}]: target '{target}' must be null or '<asset-slug>#cN'")

    if "## Evidence" not in body:
        asset.error("body: missing '## Evidence' section")
    evidence = body.split("## Evidence", 1)[-1]
    anchored = set(ANCHOR_PATTERN.findall(evidence))
    for claim_id in claim_ids:
        if claim_id not in anchored:
            asset.error(f"evidence: claim {claim_id} has no (cN) anchored quotation — entailment check impossible")
    for anchor in sorted(anchored - set(claim_ids)):
        asset.error(f"evidence: anchor ({anchor}) references no declared claim")
    return asset


def validate_vault(vault: Path) -> list[Asset]:
    assets = [validate_asset(path) for path in sorted(vault.glob("*.md"))]
    by_url: dict[str, list[Asset]] = {}
    for asset in assets:
        if asset.url:
            by_url.setdefault(asset.url, []).append(asset)
    for url, holders in by_url.items():
        if len(holders) > 1:
            names = ", ".join(holder.path.name for holder in holders)
            for holder in holders:
                holder.error(f"url: '{url}' captured in multiple files ({names}); re-capture must append to the existing file")
    return assets


def main() -> int:
    arguments = sys.argv[1:]
    as_json = "--json" in arguments
    positional = [argument for argument in arguments if not argument.startswith("--")]
    vault = Path(positional[0]) if positional else Path("vault")
    if not vault.is_dir():
        print(f"no such vault directory: {vault}", file=sys.stderr)
        return 2
    assets = validate_vault(vault)
    failed = [asset for asset in assets if asset.errors]
    if as_json:
        print(json.dumps({
            "schema_version": 1,
            "classification": "SCHEMA_VIOLATION" if failed else "CLEAN",
            "assets": len(assets),
            "findings": [
                {"path": str(asset.path), "errors": asset.errors} for asset in failed
            ],
        }, ensure_ascii=False))
    else:
        for asset in failed:
            for message in asset.errors:
                print(f"{asset.path}: {message}")
        print(f"{len(assets)} assets, {len(failed)} with violations")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
