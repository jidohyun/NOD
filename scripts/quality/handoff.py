#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
# How to run: python3 scripts/quality/handoff.py --json < pre-push-refs.txt

from __future__ import annotations

import atexit
import json
import os
import re
import signal
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from types import FrameType
from typing import Final, Literal, TypedDict

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
if __package__ is None:
    __package__ = "scripts.quality"

from .git_reader import GIT_TIMEOUT_SECONDS, GitResult
from .plan import RefUpdate, UpdateType

type GateStatus = Literal["pass", "failed", "skipped"]
type ParseError = Literal["HANDOFF_GIT_UNAVAILABLE", "MALFORMED_INPUT"]

MAIN_REF: Final = "refs/heads/main"
EXACT_MARKER: Final = re.compile(r"<!-- nod-handoff-base: ([0-9a-f]{40}) -->")
ABBREVIATED_MARKER: Final = re.compile(r"<!-- nod-handoff-base: [0-9a-f]{1,39} -->")
MARKER_NAME: Final = re.compile(r"nod-handoff-base", re.IGNORECASE)
MISSING_REMEDIATION: Final = (
    "Commit docs/handoff.md with exactly one <!-- nod-handoff-base: <pre-push remote main OID> --> marker."
)
TERMINATE_TIMEOUT_SECONDS: Final = 2


class RefOutcomeJson(TypedDict):
    remote_ref: str
    remote_oid: str
    status: GateStatus


class GateJson(TypedDict):
    schema_version: int
    classification: str
    status: GateStatus
    refs: list[RefOutcomeJson]
    remediation: str


@dataclass(frozen=True, slots=True)
class MarkerOutcome:
    classification: str
    status: GateStatus
    remediation: str = ""


@dataclass(frozen=True, slots=True)
class HandoffInterrupted(BaseException):
    signal_number: int


class GitProcessTracker:
    """Own, terminate, and reap each Git process group synchronously."""

    def __init__(self) -> None:
        self._active: set[subprocess.Popen[str]] = set()

    def run(self, *arguments: str) -> GitResult:
        try:
            process = subprocess.Popen(
                ("git", *arguments), stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                stderr=subprocess.PIPE, text=True, start_new_session=True,
            )
        except OSError:
            return GitResult(127, "")
        self._active.add(process)
        try:
            try:
                stdout, _stderr = process.communicate(timeout=GIT_TIMEOUT_SECONDS)
            except subprocess.TimeoutExpired:
                self.terminate(process)
                return GitResult(124, "")
            return GitResult(process.returncode, stdout)
        finally:
            if process.poll() is not None:
                self._active.discard(process)

    def terminate(self, process: subprocess.Popen[str]) -> None:
        if process.poll() is None:
            try:
                os.killpg(process.pid, signal.SIGTERM)
            except ProcessLookupError:
                _ = process.poll()
        try:
            _ = process.communicate(timeout=TERMINATE_TIMEOUT_SECONDS)
        except subprocess.TimeoutExpired:
            try:
                os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError:
                _ = process.poll()
            _ = process.communicate()
        self._active.discard(process)

    def cleanup(self) -> None:
        for process in tuple(self._active):
            self.terminate(process)


_GIT: Final = GitProcessTracker()


def _handle_signal(signum: int, _frame: FrameType | None) -> None:
    _GIT.cleanup()
    raise HandoffInterrupted(signum)


_ = atexit.register(_GIT.cleanup)


def _parse_ref_stream(raw: str) -> tuple[list[RefUpdate], ParseError | None]:
    if raw == "":
        return [], None
    width_result = _GIT.run("hash-object", "--stdin")
    if width_result.returncode != 0:
        return [], "HANDOFF_GIT_UNAVAILABLE"
    oid_pattern = re.compile(rf"^[0-9a-f]{{{len(width_result.stdout.strip())}}}$")
    updates: list[RefUpdate] = []
    for line in raw.splitlines():
        fields = line.split()
        if len(fields) != 4 or not oid_pattern.fullmatch(fields[1]) or not oid_pattern.fullmatch(fields[3]):
            return [], "MALFORMED_INPUT"
        local_ref, local_oid, remote_ref, remote_oid = fields
        local_zero = set(local_oid) == {"0"}
        remote_zero = set(remote_oid) == {"0"}
        local_ref_valid = local_ref == "(delete)" if local_zero else (
            local_ref.startswith("refs/") and _GIT.run("check-ref-format", local_ref).returncode == 0
        )
        refs_valid = (
            local_ref_valid and remote_ref.startswith("refs/")
            and _GIT.run("check-ref-format", remote_ref).returncode == 0
            and not (local_zero and remote_zero)
        )
        if not refs_valid:
            return [], "MALFORMED_INPUT"
        update_type: UpdateType = "delete" if local_zero else "create" if remote_zero else "update"
        updates.append(RefUpdate(local_ref, local_oid, remote_ref, remote_oid, update_type))
    return updates, None


def _marker_outcome(update: RefUpdate) -> MarkerOutcome:
    commit = _GIT.run("cat-file", "-e", f"{update.local_oid}^{{commit}}")
    if commit.returncode != 0:
        return MarkerOutcome("HANDOFF_BLOB_UNAVAILABLE", "failed")
    blob = _GIT.run("show", f"{update.local_oid}:docs/handoff.md")
    if blob.returncode != 0:
        return MarkerOutcome("HANDOFF_MARKER_MISSING", "failed", MISSING_REMEDIATION)

    marker_names = MARKER_NAME.findall(blob.stdout)
    if not marker_names:
        return MarkerOutcome("HANDOFF_MARKER_MISSING", "failed", MISSING_REMEDIATION)
    if len(marker_names) != 1:
        return MarkerOutcome("HANDOFF_MARKER_DUPLICATE", "failed")
    exact_matches = [match.group(1) for match in EXACT_MARKER.finditer(blob.stdout)]
    if len(exact_matches) != 1:
        classification = (
            "HANDOFF_MARKER_ABBREVIATED"
            if ABBREVIATED_MARKER.search(blob.stdout) is not None
            else "HANDOFF_MARKER_MALFORMED"
        )
        return MarkerOutcome(classification, "failed")

    marker_oid = exact_matches[0]
    if marker_oid == update.remote_oid:
        return MarkerOutcome("HANDOFF_CURRENT", "pass")
    if _GIT.run("merge-base", "--is-ancestor", marker_oid, update.remote_oid).returncode == 0:
        return MarkerOutcome("HANDOFF_MARKER_STALE", "failed")
    if _GIT.run("merge-base", "--is-ancestor", update.remote_oid, marker_oid).returncode == 0:
        return MarkerOutcome("HANDOFF_MARKER_FUTURE", "failed")
    return MarkerOutcome("HANDOFF_MARKER_MISMATCH", "failed")


def evaluate(raw: str) -> GateJson:
    updates, parse_error = _parse_ref_stream(raw)
    if parse_error is not None:
        return {
            "schema_version": 1,
            "classification": parse_error,
            "status": "failed",
            "refs": [],
            "remediation": "",
        }
    if not updates:
        return {
            "schema_version": 1,
            "classification": "NO_REF_UPDATES",
            "status": "skipped",
            "refs": [],
            "remediation": "",
        }

    main_updates = [update for update in updates if update.remote_ref == MAIN_REF and update.update_type != "delete"]
    if not main_updates:
        main_deletion = any(update.remote_ref == MAIN_REF and update.update_type == "delete" for update in updates)
        classification = "NO_OUTGOING_OBJECTS" if main_deletion else "NOT_MAIN_UPDATE"
        return {
            "schema_version": 1,
            "classification": classification,
            "status": "skipped",
            "refs": [
                {"remote_ref": update.remote_ref, "remote_oid": update.remote_oid, "status": "skipped"}
                for update in updates
            ],
            "remediation": "",
        }

    outcomes = [_marker_outcome(update) for update in main_updates]
    failure = next((outcome for outcome in outcomes if outcome.status == "failed"), None)
    result = failure if failure is not None else MarkerOutcome("HANDOFF_CURRENT", "pass")
    main_oids = {update.local_oid for update in main_updates}
    return {
        "schema_version": 1,
        "classification": result.classification,
        "status": result.status,
        "refs": [
            {
                "remote_ref": update.remote_ref,
                "remote_oid": update.remote_oid,
                "status": result.status if update.local_oid in main_oids else "skipped",
            }
            for update in updates
        ],
        "remediation": result.remediation,
    }


def main() -> int:
    if sys.argv[1:] != ["--json"]:
        _ = sys.stderr.write("usage: handoff.py --json\n")
        return 2
    previous_term = signal.signal(signal.SIGTERM, _handle_signal)
    previous_interrupt = signal.signal(signal.SIGINT, _handle_signal)
    result: GateJson
    try:
        result = evaluate(sys.stdin.read())
        exit_code = 0 if result["status"] != "failed" else 2 if result["classification"] == "MALFORMED_INPUT" else 1
    except HandoffInterrupted as interruption:
        result = {
            "schema_version": 1, "classification": "HANDOFF_INTERRUPTED", "status": "failed",
            "refs": [], "remediation": "",
        }
        exit_code = 128 + interruption.signal_number
    finally:
        _GIT.cleanup()
        _ = signal.signal(signal.SIGTERM, previous_term)
        _ = signal.signal(signal.SIGINT, previous_interrupt)
    _ = sys.stdout.write(json.dumps(result, sort_keys=True, separators=(",", ":")) + "\n")
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
