#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
# How to run: python3 scripts/quality/generated_drift.py --repo . --revision HEAD --json

from __future__ import annotations

import json
import os
import shutil
import signal
import stat
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from types import FrameType
from typing import Final, Literal, override

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
if __package__ is None:
    __package__ = "scripts.quality"

from .contracts.json_boundary import JsonObject, JsonValue, load_json_object_path
from scripts.quality.generated_manifest import Manifest, compare, exclude_roots, manifest, manifest_hash
from scripts.quality.generated_process import ProcessCleanupError, ProcessInterrupted, run_owned

type Classification = Literal[
    "CLEAN", "GENERATED_DRIFT", "CONTENT_DRIFT", "MODE_DRIFT", "MISSING_OUTPUT", "UNEXPECTED_OUTPUT", "SOURCE_MUTATION", "GENERATOR_FAILURE", "GENERATOR_TIMEOUT", "NON_REPRODUCIBLE_PAIR", "MALFORMED_INPUT", "STALE_STATE", "INTERRUPTED", "CLEANUP_FAILURE"]

SCHEMA_VERSION: Final = 1
CLONE_TIMEOUT_SECONDS: Final = 30.0


@dataclass(frozen=True, slots=True)
class MatrixError(ValueError):
    field: str

    @override
    def __str__(self) -> str:
        return f"invalid generated-drift matrix field: {self.field}"


@dataclass(frozen=True, slots=True)
class Pair:
    name: str
    blocking: bool
    reason: str | None
    cwd: PurePosixPath
    command: tuple[str, ...]
    output_roots: tuple[PurePosixPath, ...]
    expected_outputs: tuple[PurePosixPath, ...]
    timeout_seconds: float


PRODUCTION_PAIRS: Final = (
    Pair("api-openapi", True, None, PurePosixPath("."), ("mise", "//apps/api:gen:openapi"), (PurePosixPath("apps/api/openapi.json"),), (PurePosixPath("apps/api/openapi.json"),), 600.0),
    Pair("package-i18n", False, "MIXED_MANUAL_OUTPUT", PurePosixPath("."), ("mise", "//packages/i18n:build"), (), (), 0.0),
    Pair("design-tokens", False, "UNTRACKED_OUTPUT", PurePosixPath("."), ("mise", "//packages/design-tokens:build"), (), (), 0.0),
    Pair("extension-zip", False, "METADATA_BEARING_OUTPUT", PurePosixPath("apps/extension"), ("bun", "run", "package:prod"), (), (), 0.0))


def _strings(value: JsonValue, field: str) -> tuple[str, ...]:
    if not isinstance(value, list):
        raise MatrixError(field)
    parsed: list[str] = []
    for item in value:
        if not isinstance(item, str) or not item:
            raise MatrixError(field)
        parsed.append(item)
    return tuple(parsed)


def _safe_path(value: str, field: str) -> PurePosixPath:
    path = PurePosixPath(value)
    if path.is_absolute() or ".." in path.parts or not path.parts:
        raise MatrixError(field)
    return path


def _parse_pair(value: JsonValue, index: int) -> Pair:
    if not isinstance(value, dict):
        raise MatrixError(f"pairs[{index}]")
    required = {"name", "blocking", "reason", "cwd", "command", "output_roots", "expected_outputs", "timeout_seconds"}
    if set(value) != required:
        raise MatrixError(f"pairs[{index}]")
    name = value["name"]
    blocking = value["blocking"]
    reason = value["reason"]
    cwd = value["cwd"]
    timeout = value["timeout_seconds"]
    if not isinstance(name, str) or not name or not isinstance(blocking, bool):
        raise MatrixError(f"pairs[{index}]")
    if reason is not None and not isinstance(reason, str):
        raise MatrixError(f"pairs[{index}]")
    if not isinstance(cwd, str) or not isinstance(timeout, int | float) or isinstance(timeout, bool):
        raise MatrixError(f"pairs[{index}]")
    cwd_path = PurePosixPath(cwd)
    if cwd_path.is_absolute() or ".." in cwd_path.parts or float(timeout) <= 0:
        raise MatrixError(f"pairs[{index}]")
    if (blocking and reason is not None) or (not blocking and not reason):
        raise MatrixError(f"pairs[{index}]")
    command = _strings(value["command"], f"pairs[{index}].command")
    roots = tuple(_safe_path(item, "output_roots") for item in _strings(value["output_roots"], "output_roots"))
    outputs = tuple(_safe_path(item, "expected_outputs") for item in _strings(value["expected_outputs"], "expected_outputs"))
    if not command or not roots or not outputs or not all(any(output == root or output.is_relative_to(root) for root in roots) for output in outputs):
        raise MatrixError(f"pairs[{index}]")
    return Pair(name, blocking, reason, cwd_path, command, roots, outputs, float(timeout))


def load_pairs(path: Path | None) -> tuple[Pair, ...]:
    if path is None:
        return PRODUCTION_PAIRS
    value = load_json_object_path(path)
    if set(value) != {"pairs"} or not isinstance(value["pairs"], list):
        raise MatrixError("root")
    pairs = tuple(_parse_pair(item, index) for index, item in enumerate(value["pairs"]))
    if not pairs or len({pair.name for pair in pairs}) != len(pairs):
        raise MatrixError("pairs")
    return pairs


def _pair_json(pair: Pair, classification: Classification, exit_code: int | None, timed_out: bool,
               before: Manifest, after: Manifest, changes: JsonObject, source_mutations: list[str]) -> JsonObject:
    command: list[JsonValue] = list(pair.command)
    mutations: list[JsonValue] = list(source_mutations)
    return {
        "name": pair.name, "blocking": pair.blocking, "reason": pair.reason, "classification": classification,
        "command": command, "exit_code": exit_code, "timed_out": timed_out,
        "before_manifest_hash": manifest_hash(before), "after_manifest_hash": manifest_hash(after),
        "changes": changes, "source_mutations": mutations,
    }


def _check_pair(tree: Path, pair: Pair, environment: dict[str, str]) -> JsonObject:
    if not pair.blocking:
        return _pair_json(pair, "NON_REPRODUCIBLE_PAIR", None, False, {}, {},
                          {"content": [], "missing": [], "mode": [], "type": [], "unexpected": []}, [])
    before_outputs = manifest(tree, pair.output_roots)
    before_all = exclude_roots(manifest(tree), pair.output_roots)
    exit_code, timed_out = run_owned(pair.command, tree / pair.cwd, pair.timeout_seconds, environment)
    after_outputs = manifest(tree, pair.output_roots)
    after_all = exclude_roots(manifest(tree), pair.output_roots)
    source_mutations = sorted(path for path in set(before_all) | set(after_all) if before_all.get(path) != after_all.get(path))
    changes = compare(before_outputs, after_outputs, pair.expected_outputs)
    drift = any(changes[key] for key in ("content", "missing", "mode", "type", "unexpected"))
    classification: Classification = (
        "SOURCE_MUTATION" if source_mutations else "GENERATOR_TIMEOUT" if timed_out else
        "GENERATOR_FAILURE" if exit_code else "UNEXPECTED_OUTPUT" if changes["unexpected"] else
        "MISSING_OUTPUT" if changes["missing"] else "MODE_DRIFT" if changes["mode"] else
        "CONTENT_DRIFT" if drift else "CLEAN"
    )
    return _pair_json(pair, classification, exit_code, timed_out, before_outputs, after_outputs, changes, source_mutations)


def _remove_tree(path: Path) -> bool:
    try:
        shutil.rmtree(path)
    except OSError:
        for root, directories, _files in os.walk(path):
            for entry in (Path(root), *(Path(root) / name for name in directories)):
                try:
                    entry.chmod(stat.S_IMODE(entry.lstat().st_mode) | stat.S_IRUSR | stat.S_IWUSR | stat.S_IXUSR)
                except OSError:
                    continue
        try:
            shutil.rmtree(path)
        except OSError:
            return False
    return not path.exists()


def check(repo: Path, revision: str, pairs: tuple[Pair, ...]) -> tuple[JsonObject, int]:
    resolved = subprocess.run(
        ("git", "-C", os.fspath(repo), "rev-parse", "--verify", f"{revision}^{{commit}}"), check=False, capture_output=True, text=True, timeout=CLONE_TIMEOUT_SECONDS)
    if resolved.returncode != 0:
        return {"schema_version": SCHEMA_VERSION, "revision": None, "classification": "STALE_STATE",
                "blocking": True, "pairs": [], "temporary_tree_removed": True}, 2
    temporary = Path(tempfile.mkdtemp(prefix="nod-generated-drift-"))
    result: JsonObject = {"schema_version": SCHEMA_VERSION, "revision": resolved.stdout.strip(), "classification": "CLEANUP_FAILURE",
                          "blocking": True, "pairs": [], "temporary_tree_removed": False}
    exit_code = 1
    interrupted: ProcessInterrupted | None = None
    try:
        tree = temporary / "tree"
        clone = subprocess.run(
            ("git", "clone", "--quiet", "--no-checkout", "--no-hardlinks", os.fspath(repo), os.fspath(tree)), check=False,
            stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=CLONE_TIMEOUT_SECONDS)
        checkout = subprocess.run(
            ("git", "-C", os.fspath(tree), "checkout", "--quiet", "--detach", resolved.stdout.strip()), check=False,
            stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=CLONE_TIMEOUT_SECONDS) if clone.returncode == 0 else clone
        if clone.returncode != 0 or checkout.returncode != 0:
            result["classification"] = "STALE_STATE"
            exit_code = 2
        else:
            environment = os.environ | {
                "HOME": os.fspath(temporary / "home"), "XDG_CACHE_HOME": os.fspath(temporary / "cache"), "PYTHONDONTWRITEBYTECODE": "1"}
            outcomes: list[JsonValue] = [_check_pair(tree, pair, environment) for pair in pairs]
            blocking_classes = [outcome["classification"] for outcome in outcomes if isinstance(outcome, dict) and outcome["blocking"] is True]
            classification = next((name for name in ("SOURCE_MUTATION", "GENERATOR_TIMEOUT", "GENERATOR_FAILURE")
                                   if name in blocking_classes), "GENERATED_DRIFT" if any(
                                       name in blocking_classes for name in ("UNEXPECTED_OUTPUT", "MISSING_OUTPUT", "MODE_DRIFT", "CONTENT_DRIFT")
                                   ) else "CLEAN")
            result = {"schema_version": SCHEMA_VERSION, "revision": resolved.stdout.strip(), "classification": classification,
                      "blocking": classification != "CLEAN", "pairs": outcomes, "temporary_tree_removed": False}
            exit_code = 1 if result["blocking"] is True else 0
    except ProcessInterrupted as error:
        interrupted = error
    except ProcessCleanupError:
        result["classification"] = "CLEANUP_FAILURE"
    finally:
        removed = _remove_tree(temporary)
    if not removed:
        return {"schema_version": SCHEMA_VERSION, "revision": resolved.stdout.strip(), "classification": "CLEANUP_FAILURE",
                "blocking": True, "pairs": result["pairs"], "temporary_tree_removed": False}, 1
    if interrupted is not None:
        raise interrupted
    result["temporary_tree_removed"] = True
    return result, exit_code


def _signal_handler(signum: int, _frame: FrameType | None) -> None:
    raise ProcessInterrupted(signum)


def main() -> int:
    arguments = sys.argv[1:]
    try:
        matrix = Path(arguments[arguments.index("--matrix") + 1]) if "--matrix" in arguments else None
        pairs = load_pairs(matrix)
        if "--list-pairs" in arguments:
            listed = [{"name": pair.name, "blocking": pair.blocking, "reason": pair.reason, "classification": "CLEAN" if pair.blocking else "NON_REPRODUCIBLE_PAIR", "command": list(pair.command)} for pair in pairs]
            print(json.dumps({"schema_version": SCHEMA_VERSION, "pairs": listed}, sort_keys=True, separators=(",", ":")))
            return 0
        repo = Path(arguments[arguments.index("--repo") + 1])
        revision = arguments[arguments.index("--revision") + 1]
    except (IndexError, MatrixError, OSError, ValueError, json.JSONDecodeError):
        print(json.dumps({"schema_version": SCHEMA_VERSION, "revision": None, "classification": "MALFORMED_INPUT",
                          "blocking": True, "pairs": [], "temporary_tree_removed": True}, sort_keys=True, separators=(",", ":")))
        return 2
    previous_term = signal.signal(signal.SIGTERM, _signal_handler)
    previous_interrupt = signal.signal(signal.SIGINT, _signal_handler)
    try:
        result, exit_code = check(repo, revision, pairs)
    except ProcessInterrupted as error:
        result: JsonObject = {"schema_version": SCHEMA_VERSION, "revision": None, "classification": "INTERRUPTED", "blocking": True, "pairs": [], "temporary_tree_removed": True}
        exit_code = 128 + error.signal_number
    finally:
        _ = signal.signal(signal.SIGTERM, previous_term)
        _ = signal.signal(signal.SIGINT, previous_interrupt)
    print(json.dumps(result, sort_keys=True, separators=(",", ":")))
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
