#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
# How to run: python3 scripts/quality/plan.py --phase pre-push --remote origin --json

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Final, Literal, Required, TypedDict, assert_never

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
if __package__ is None:
    __package__ = "scripts.quality"

from .git_reader import dirty_paths, git, parse_name_status, unstaged_paths

type Phase = Literal["pre-commit", "pre-push"]
type Surface = Literal["api", "worker", "web", "mobile", "extension", "packages", "quality", "root"]
type UpdateType = Literal["create", "update", "force_update", "delete"]

SCHEMA_VERSION: Final = 1
LABELS: Final = (
    "contract_validation", "api_lint", "api_test", "worker_lint", "worker_test", "web_lint", "web_test",
    "mobile_lint", "mobile_test", "dockerfile_lint", "secret_scan", "handoff", "generated_drift", "mutation_check",
)
ROOT_DIRECTORIES: Final = {
    ".agents", ".gemini", ".github", ".gstack", ".opencode", ".serena", ".sisyphus", ".vendor", ".vscode",
    "docs", "scripts", "templates", "vault", "video",
}
PROOF_PATHS: Final = {"mise.toml", "commitlint.config.cjs", "AGENTS.md", "docs/agent-north-star.md", "docs/static-harness.md"}


class RefJson(TypedDict):
    local_ref: str
    local_oid: str
    remote_ref: str
    remote_oid: str
    update_type: UpdateType


class BlockerJson(TypedDict, total=False):
    code: Required[str]
    ref: str


class PlanJson(TypedDict):
    schema_version: int
    phase: Phase
    classification: str
    refs: list[RefJson]
    affected_paths: list[str]
    surfaces: list[Surface]
    selected: list[str]
    skipped: list[str]
    blockers: list[BlockerJson]


@dataclass(frozen=True, slots=True)
class RefUpdate:
    local_ref: str
    local_oid: str
    remote_ref: str
    remote_oid: str
    update_type: UpdateType

    def json(self) -> RefJson:
        return {
            "local_ref": self.local_ref, "local_oid": self.local_oid, "remote_ref": self.remote_ref,
            "remote_oid": self.remote_oid, "update_type": self.update_type,
        }


def empty_plan(phase: Phase, classification: str, blockers: list[BlockerJson] | None = None) -> PlanJson:
    return {
        "schema_version": SCHEMA_VERSION, "phase": phase, "classification": classification, "refs": [],
        "affected_paths": [], "surfaces": [], "selected": [], "skipped": [], "blockers": blockers or [],
    }


def classify_path(path: str) -> Surface | None:
    first = PurePosixPath(path).parts[0]
    app_prefixes: tuple[tuple[str, Surface], ...] = (
        ("apps/api/", "api"), ("apps/worker/", "worker"), ("apps/web/", "web"),
        ("apps/mobile/", "mobile"), ("apps/extension/", "extension"),
    )
    for prefix, surface in app_prefixes:
        if path.startswith(prefix):
            return surface
    if path.startswith("packages/"):
        return "packages"
    if path.startswith("scripts/quality/") or path in PROOF_PATHS:
        return "quality"
    if path.startswith("apps/infra/") or "/" not in path or first in ROOT_DIRECTORIES:
        return "root"
    return None


def parse_ref_stream(raw: str) -> tuple[list[RefUpdate], BlockerJson | None]:
    if raw == "":
        return [], None
    width_result = git("hash-object", "--stdin")
    width = len(width_result.stdout.strip())
    oid_pattern = re.compile(rf"^[0-9a-f]{{{width}}}$")
    updates: list[RefUpdate] = []
    for number, line in enumerate(raw.splitlines(), start=1):
        fields = line.split()
        if len(fields) != 4 or not oid_pattern.fullmatch(fields[1]) or not oid_pattern.fullmatch(fields[3]):
            return [], {"code": "MALFORMED_INPUT", "ref": f"line:{number}"}
        local_ref, local_oid, remote_ref, remote_oid = fields
        local_zero = set(local_oid) == {"0"}
        remote_zero = set(remote_oid) == {"0"}
        local_ref_is_valid = local_ref == "(delete)" if local_zero else (
            local_ref.startswith("refs/") and git("check-ref-format", local_ref).returncode == 0
        )
        ref_contract_is_valid = (
            local_ref_is_valid
            and remote_ref.startswith("refs/")
            and git("check-ref-format", remote_ref).returncode == 0
            and not (local_zero and remote_zero)
        )
        if not ref_contract_is_valid:
            return [], {"code": "MALFORMED_INPUT", "ref": f"line:{number}"}
        update_type: UpdateType = "delete" if local_zero else "create" if remote_zero else "update"
        updates.append(RefUpdate(local_ref, local_oid, remote_ref, remote_oid, update_type))
    return updates, None


def remote_ancestry_is_provable(local_oid: str) -> bool:
    outgoing = git("rev-list", local_oid, "--not", "--remotes")
    if outgoing.returncode != 0:
        return False
    if not outgoing.stdout.strip():
        return True
    tips = git("for-each-ref", "--format=%(objectname)", "refs/remotes")
    if tips.returncode != 0:
        return False
    return any(git("merge-base", local_oid, tip).returncode == 0 for tip in tips.stdout.splitlines())


def paths_for_ref(update: RefUpdate) -> tuple[set[str] | None, UpdateType]:
    if update.update_type == "delete":
        return set(), "delete"
    if git("cat-file", "-e", f"{update.local_oid}^{{commit}}").returncode != 0:
        return None, update.update_type
    if update.update_type == "create":
        if not remote_ancestry_is_provable(update.local_oid):
            return None, "create"
        outgoing = git("rev-list", update.local_oid, "--not", "--remotes")
        paths: set[str] = set()
        for commit in outgoing.stdout.splitlines():
            changed = git("diff-tree", "--root", "--no-commit-id", "--name-status", "-r", "-z", "--find-renames", commit)
            if changed.returncode != 0:
                return None, "create"
            paths.update(parse_name_status(changed.stdout))
        return paths, "create"
    if git("cat-file", "-e", f"{update.remote_oid}^{{commit}}").returncode != 0:
        return None, update.update_type
    ancestry = git("merge-base", "--is-ancestor", update.remote_oid, update.local_oid)
    if ancestry.returncode not in (0, 1):
        return None, update.update_type
    changed = git("diff", "--name-status", "-z", "--find-renames", update.remote_oid, update.local_oid)
    if changed.returncode != 0:
        return None, update.update_type
    return parse_name_status(changed.stdout), "update" if ancestry.returncode == 0 else "force_update"


def labels_for(phase: Phase, surfaces: set[Surface], paths: set[str], refs: list[RefUpdate]) -> list[str]:
    selected: set[str] = set()
    match phase:
        case "pre-commit":
            for surface, label in (("api", "api_lint"), ("worker", "worker_lint"), ("web", "web_lint"), ("mobile", "mobile_lint")):
                if surface in surfaces:
                    selected.add(label)
            if any(PurePosixPath(path).name == "Dockerfile" for path in paths):
                selected.add("dockerfile_lint")
            if surfaces & {"quality", "root", "extension", "packages"}:
                selected.add("contract_validation")
        case "pre-push":
            selected.update(("secret_scan", "mutation_check"))
            for surface, label in (("api", "api_test"), ("worker", "worker_test"), ("web", "web_test"), ("mobile", "mobile_test")):
                if surface in surfaces:
                    selected.add(label)
            if surfaces & {"api", "web", "mobile", "extension", "packages"}:
                selected.add("generated_drift")
            if surfaces & {"quality", "root", "extension", "packages"}:
                selected.add("contract_validation")
            if any(ref.remote_ref == "refs/heads/main" for ref in refs):
                selected.add("handoff")
        case unreachable:
            assert_never(unreachable)
    return [label for label in LABELS if label in selected]


def build_plan(phase: Phase, raw: str) -> PlanJson:
    paths: set[str]
    if phase == "pre-commit":
        changed = git("diff", "--cached", "--name-status", "-z", "--find-renames")
        if changed.returncode != 0:
            return empty_plan(phase, "stale_state", [{"code": "STALE_STATE"}])
        refs: list[RefUpdate] = []
        paths = parse_name_status(changed.stdout)
    else:
        refs, malformed = parse_ref_stream(raw)
        if malformed is not None:
            return empty_plan(phase, "malformed_input", [malformed])
        if not refs:
            return empty_plan(phase, "no_ref_updates")
        paths = set()
        resolved_refs: list[RefUpdate] = []
        for update in refs:
            if update.local_ref.startswith("refs/") and git("cat-file", "-e", f"{update.local_oid}^{{commit}}").returncode == 0:
                current = git("rev-parse", "--verify", update.local_ref)
                if current.returncode == 0 and current.stdout.strip() != update.local_oid:
                    return empty_plan(phase, "stale_state", [{"code": "STALE_STATE", "ref": update.local_ref}])
            changed_paths, update_type = paths_for_ref(update)
            if changed_paths is None:
                return empty_plan(phase, "history_base_unavailable", [{"code": "HISTORY_BASE_UNAVAILABLE", "ref": update.remote_ref}])
            paths.update(changed_paths)
            resolved_refs.append(RefUpdate(update.local_ref, update.local_oid, update.remote_ref, update.remote_oid, update_type))
        refs = resolved_refs
    surfaces: set[Surface] = {surface for path in paths if (surface := classify_path(path)) is not None}
    unmapped = sorted(path for path in paths if classify_path(path) is None)
    selected = labels_for(phase, surfaces, paths, refs)
    has_semantic_ref_change = any(ref.update_type == "delete" or ref.remote_ref.startswith("refs/tags/extension-v") for ref in refs)
    classification = "tree_noop" if not paths and not has_semantic_ref_change else "planned"
    for ref in refs:
        if ref.remote_ref.startswith("refs/tags/extension-v"):
            surfaces.add("extension")
            selected = labels_for(phase, surfaces, paths, refs)
    blockers: list[BlockerJson] = []
    if unmapped:
        classification = "unmapped_path"
        blockers = [{"code": "UNMAPPED_PATH", "ref": path} for path in unmapped]
    dirty = dirty_paths() if phase == "pre-push" else unstaged_paths()
    if dirty is None:
        classification = "stale_state"
        blockers = [{"code": "STALE_STATE"}]
    elif classification not in {"unmapped_path", "tree_noop"}:
        dirty_surfaces = {surface for path in dirty if (surface := classify_path(path)) is not None}
        affected_dirty = sorted(surfaces & dirty_surfaces)
        if affected_dirty:
            classification = "dirty_worktree"
            blockers = [{"code": "DIRTY_WORKTREE", "ref": surface} for surface in affected_dirty]
    return {
        "schema_version": SCHEMA_VERSION, "phase": phase, "classification": classification,
        "refs": [ref.json() for ref in refs], "affected_paths": sorted(paths), "surfaces": sorted(surfaces),
        "selected": selected, "skipped": [label for label in LABELS if label not in selected], "blockers": blockers,
    }


def render_text(plan: PlanJson) -> str:
    lines = [f"classification={json.dumps(plan['classification'])}"]
    lines.extend(f"selected={json.dumps(label)}" for label in plan["selected"])
    lines.extend(f"skipped={json.dumps(label)}" for label in plan["skipped"])
    lines.extend(f"affected_path={json.dumps(path)}" for path in plan["affected_paths"])
    lines.extend(f"surface={json.dumps(surface)}" for surface in plan["surfaces"])
    lines.extend(f"blocker={json.dumps(blocker, sort_keys=True, separators=(',', ':'))}" for blocker in plan["blockers"])
    return "\n".join(lines) + "\n"


def main() -> int:
    arguments = sys.argv[1:]
    if "--phase" not in arguments:
        print("usage: plan.py --phase {pre-commit,pre-push} [--remote NAME] [--json]", file=sys.stderr)
        return 2
    phase_index = arguments.index("--phase") + 1
    if phase_index >= len(arguments) or arguments[phase_index] not in {"pre-commit", "pre-push"}:
        print("invalid phase", file=sys.stderr)
        return 2
    phase: Phase = "pre-commit" if arguments[phase_index] == "pre-commit" else "pre-push"
    plan = build_plan(phase, sys.stdin.read() if phase == "pre-push" else "")
    if "--json" in arguments:
        _ = print(json.dumps(plan, sort_keys=True, separators=(",", ":")))
    else:
        _ = sys.stdout.write(render_text(plan))
    return 0 if plan["classification"] in {"planned", "no_ref_updates", "tree_noop"} else 2


if __name__ == "__main__":
    raise SystemExit(main())
