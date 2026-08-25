#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
# How to run: python3 scripts/quality/receipt.py --help

from __future__ import annotations

import json
import os
import re
import signal
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from types import FrameType
from typing import Final, Literal, override

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
if __package__ is None:
    __package__ = "scripts.quality"

from .contracts.json_boundary import DuplicateJsonMemberError, JsonObject, JsonValue, load_json_object_path
from .mutation import fingerprint

type Phase = Literal["pre-commit", "pre-push"]

LABELS: Final = frozenset(
    "contract_validation api_lint api_test worker_lint worker_test web_lint web_test mobile_lint mobile_test dockerfile_lint secret_scan handoff generated_drift mutation_check".split())
CLASSIFICATIONS: Final = frozenset(
    "planned no_ref_updates malformed_input dirty_worktree stale_state history_base_unavailable unmapped_path tree_noop interrupted".split())
STATUSES: Final = frozenset(("pass", "failed", "skipped", "not_run"))
FAILURE_CODES: Final = frozenset(
    "COMMAND_FAILED MUTATION_DETECTED RECEIPT_WRITE_FAILED INTERRUPTED MALFORMED_INPUT DIRTY_WORKTREE STALE_STATE".split())
ROOT_FIELDS: Final = frozenset(
    "schema_version phase classification refs plan outcomes failures mutation result complete".split())
OID_PATTERN: Final = re.compile(r"^[0-9a-f]{40}(?:[0-9a-f]{24})?$")
HASH_PATTERN: Final = re.compile(r"^[0-9a-f]{64}$")
COMMAND_TIMEOUT_SECONDS: Final = 600


@dataclass(frozen=True, slots=True)
class ReceiptValidationError(ValueError):
    field: str

    @override
    def __str__(self) -> str:
        return f"invalid receipt field: {self.field}"


@dataclass(frozen=True, slots=True)
class RunInterrupted(BaseException):
    signal_number: int


@dataclass(frozen=True, slots=True)
class GateRun:
    repo: Path
    output: Path
    phase: Phase
    classification: str
    refs: tuple[JsonObject, ...]
    selected: tuple[str, ...]
    skipped: tuple[str, ...]
    gate: str
    command: tuple[str, ...]
    timeout_seconds: float = COMMAND_TIMEOUT_SECONDS


def _require(condition: bool, field: str) -> None:
    if not condition:
        raise ReceiptValidationError(field)


def _json_list(value: JsonValue, field: str) -> list[JsonValue]:
    if not isinstance(value, list):
        raise ReceiptValidationError(field)
    return value


def _json_object(value: JsonValue, field: str) -> JsonObject:
    if not isinstance(value, dict):
        raise ReceiptValidationError(field)
    return value


def _string_list(value: JsonValue, field: str) -> list[str]:
    parsed: list[str] = []
    for item in _json_list(value, field):
        if not isinstance(item, str):
            raise ReceiptValidationError(field)
        parsed.append(item)
    return parsed


def validate_receipt(receipt: JsonObject) -> None:
    """Validate the strict, machine-consumed receipt v1 contract."""
    _require(set(receipt) == set(ROOT_FIELDS), "root")
    _require(receipt["schema_version"] == 1, "schema_version")
    _require(receipt["phase"] in ("pre-commit", "pre-push"), "phase")
    _require(receipt["classification"] in CLASSIFICATIONS, "classification")
    _require(receipt["result"] in ("pass", "failed", "not_run"), "result")
    _require(isinstance(receipt["complete"], bool), "complete")

    refs = _json_list(receipt["refs"], "refs")
    for value in refs:
        ref = _json_object(value, "refs[]")
        _require(set(ref) == {"remote_ref", "remote_oid", "status"}, "refs[]")
        _require(isinstance(ref["remote_ref"], str) and bool(ref["remote_ref"]), "refs[].remote_ref")
        _require(isinstance(ref["remote_oid"], str) and OID_PATTERN.fullmatch(ref["remote_oid"]) is not None, "refs[].remote_oid")
        _require(ref["status"] in STATUSES, "refs[].status")

    plan = _json_object(receipt["plan"], "plan")
    _require(set(plan) == {"selected", "skipped"}, "plan")
    selected = _string_list(plan["selected"], "plan.selected")
    skipped = _string_list(plan["skipped"], "plan.skipped")
    _require(set(selected).issubset(LABELS) and len(selected) == len(set(selected)), "plan.selected")
    _require(set(skipped).issubset(LABELS) and len(skipped) == len(set(skipped)), "plan.skipped")
    _require(set(selected).isdisjoint(skipped), "plan overlap")

    outcomes = _json_object(receipt["outcomes"], "outcomes")
    _require(set(outcomes) == set(selected) | set(skipped), "outcomes")
    failed_outcome = False
    for label, value in outcomes.items():
        outcome = _json_object(value, f"outcomes.{label}")
        _require(label in LABELS and set(outcome) == {"status", "exit_code"}, f"outcomes.{label}")
        status = outcome["status"]
        exit_code = outcome["exit_code"]
        _require(status in STATUSES, f"outcomes.{label}.status")
        _require(isinstance(exit_code, int) and not isinstance(exit_code, bool) and exit_code >= 0, f"outcomes.{label}.exit_code")
        _require(not (status == "pass" and exit_code != 0), f"outcomes.{label}")
        _require(not (status == "failed" and exit_code == 0), f"outcomes.{label}")
        _require(not (label in selected and status == "skipped"), f"outcomes.{label}")
        _require(not (label in skipped and (status != "skipped" or exit_code != 0)), f"outcomes.{label}")
        failed_outcome = failed_outcome or status == "failed"

    failures = _json_list(receipt["failures"], "failures")
    for value in failures:
        failure = _json_object(value, "failures[]")
        _require(set(failure).issubset({"code", "gate"}) and "code" in failure, "failures[]")
        _require(failure["code"] in FAILURE_CODES, "failures[].code")
        _require("gate" not in failure or failure["gate"] in LABELS, "failures[].gate")

    mutation = _json_object(receipt["mutation"], "mutation")
    _require(set(mutation) == {"before", "after"}, "mutation")
    _require(isinstance(mutation["before"], str) and HASH_PATTERN.fullmatch(mutation["before"]) is not None, "mutation.before")
    _require(isinstance(mutation["after"], str) and HASH_PATTERN.fullmatch(mutation["after"]) is not None, "mutation.after")
    result = receipt["result"]
    _require(not (result == "pass" and (failures or failed_outcome or receipt["complete"] is not True)), "result=pass")
    _require(not (result == "failed" and (not failures or not failed_outcome)), "result=failed")
    _require(not (receipt["classification"] in {"malformed_input", "dirty_worktree", "stale_state"} and result != "failed"), "classification")


def load_receipt(path: Path) -> JsonObject:
    try:
        receipt = load_json_object_path(path)
    except DuplicateJsonMemberError as error:
        raise ReceiptValidationError(error.name) from error
    validate_receipt(receipt)
    return receipt


def write_receipt(path: Path, receipt: JsonObject) -> None:
    """Validate and atomically replace a receipt without leaving temp files."""
    validate_receipt(receipt)
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    temporary = Path(temporary_name)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as stream:
            json.dump(receipt, stream, sort_keys=True, separators=(",", ":"))
            _ = stream.write("\n")
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, path)
        directory_descriptor = os.open(path.parent, os.O_RDONLY)
        try:
            os.fsync(directory_descriptor)
        finally:
            os.close(directory_descriptor)
    except BaseException:
        temporary.unlink(missing_ok=True)
        raise


def _runtime_root(repo: Path) -> Path:
    runtime_root = repo.resolve() / ".omo"
    _require(not runtime_root.is_symlink(), "gate run runtime root")
    _require(not runtime_root.exists() or runtime_root.is_dir(), "gate run runtime root")
    return runtime_root


def _validate_run(run: GateRun) -> None:
    selected = set(run.selected)
    skipped = set(run.skipped)
    _require(run.phase in ("pre-commit", "pre-push"), "gate run phase")
    _require(run.classification in CLASSIFICATIONS, "gate run classification")
    _require(selected.issubset(LABELS) and len(selected) == len(run.selected), "gate run selected")
    _require(skipped.issubset(LABELS) and len(skipped) == len(run.skipped), "gate run skipped")
    _require(selected.isdisjoint(skipped), "gate run overlap")
    _require(run.gate in selected and "mutation_check" in selected, "gate run labels")
    _require(bool(run.command) and run.timeout_seconds > 0, "gate run command")
    runtime_root = _runtime_root(run.repo)
    output = run.output if run.output.is_absolute() else run.repo.resolve() / run.output
    _require(output.resolve(strict=False).is_relative_to(runtime_root), "gate run output")


def execute_gate(run: GateRun) -> int:
    """Run one gate, detect repository mutation, and preserve every failure."""
    _validate_run(run)
    before = fingerprint(run.repo)
    interrupted = False
    try:
        completed = subprocess.run(
            run.command, cwd=run.repo, check=False, stderr=subprocess.DEVNULL, timeout=run.timeout_seconds,
        )
        command_exit = completed.returncode if completed.returncode >= 0 else 128 - completed.returncode
    except subprocess.TimeoutExpired:
        command_exit = 124
    except RunInterrupted as error:
        interrupted = True
        command_exit = 128 + error.signal_number
    after = fingerprint(run.repo)
    mutated = before != after
    outcomes: JsonObject = {}
    for label in run.selected:
        if label == run.gate:
            outcomes[label] = {"status": "failed" if command_exit else "pass", "exit_code": command_exit}
        elif label == "mutation_check":
            outcomes[label] = {"status": "failed" if mutated else "pass", "exit_code": 1 if mutated else 0}
        else:
            outcomes[label] = {"status": "not_run", "exit_code": 0}
    for label in run.skipped:
        outcomes[label] = {"status": "skipped", "exit_code": 0}
    failures: list[JsonValue] = []
    if interrupted:
        failures.append({"code": "INTERRUPTED", "gate": run.gate})
    elif command_exit:
        failures.append({"code": "COMMAND_FAILED", "gate": run.gate})
    if mutated:
        failures.append({"code": "MUTATION_DETECTED", "gate": "mutation_check"})
    receipt: JsonObject = {
        "schema_version": 1, "phase": run.phase, "classification": "interrupted" if interrupted else run.classification,
        "refs": list(run.refs), "plan": {"selected": list(run.selected), "skipped": list(run.skipped)},
        "outcomes": outcomes, "failures": failures, "mutation": {"before": before, "after": after},
        "result": "failed" if failures else "pass", "complete": True,
    }
    _validate_run(run)
    write_receipt(run.output, receipt)
    return command_exit or (1 if mutated else 0)


def _signal_handler(signum: int, _frame: FrameType | None) -> None:
    raise RunInterrupted(signum)


def _option(arguments: list[str], name: str, default: str | None = None) -> str:
    count = arguments.count(name)
    if count == 0 and default is not None:
        return default
    if count != 1 or arguments.index(name) + 1 >= len(arguments):
        raise ReceiptValidationError(name)
    return arguments[arguments.index(name) + 1]


def main() -> int:
    raw = sys.argv[1:]
    try:
        delimiter = raw.index("--")
        options, command = raw[:delimiter], tuple(raw[delimiter + 1:])
        _require(set(options[::2]).issubset({"--repo", "--output", "--phase", "--classification", "--selected", "--skipped", "--gate"}), "command line")
        phase_raw = _option(options, "--phase")
        _require(phase_raw in ("pre-commit", "pre-push") and bool(command), "command line")
        phase: Phase = "pre-commit" if phase_raw == "pre-commit" else "pre-push"
        run = GateRun(
            Path(_option(options, "--repo")), Path(_option(options, "--output")), phase,
            _option(options, "--classification", "planned"), (),
            tuple(filter(None, _option(options, "--selected").split(","))),
            tuple(filter(None, _option(options, "--skipped", "").split(","))),
            _option(options, "--gate"), command,
        )
    except (ReceiptValidationError, ValueError) as error:
        _ = sys.stderr.write(f"receipt: {error}\n")
        return 2
    previous_term = signal.signal(signal.SIGTERM, _signal_handler)
    previous_interrupt = signal.signal(signal.SIGINT, _signal_handler)
    try:
        return execute_gate(run)
    except (ReceiptValidationError, OSError) as error:
        _ = sys.stderr.write(f"receipt: {error}\n")
        return 74
    finally:
        _ = signal.signal(signal.SIGTERM, previous_term)
        _ = signal.signal(signal.SIGINT, previous_interrupt)


if __name__ == "__main__":
    raise SystemExit(main())
