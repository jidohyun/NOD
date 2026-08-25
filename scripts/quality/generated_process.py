# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
# How to run: imported by scripts/quality/generated_drift.py

from __future__ import annotations

import os
import signal
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Final, override

TERMINATION_GRACE_SECONDS: Final = 0.5


@dataclass(frozen=True, slots=True)
class ProcessInterrupted(BaseException):
    signal_number: int


@dataclass(frozen=True, slots=True)
class ProcessCleanupError(RuntimeError):
    pid: int

    @override
    def __str__(self) -> str:
        return f"owned process group {self.pid} could not be reaped"


def _live_group_members(process_group: int) -> tuple[int, ...]:
    try:
        snapshot = subprocess.run(
            ("ps", "-axo", "pid=,pgid=,state="), check=True, capture_output=True,
            text=True, timeout=TERMINATION_GRACE_SECONDS,
        )
    except (OSError, subprocess.SubprocessError) as error:
        raise ProcessCleanupError(process_group) from error
    members: list[int] = []
    for line in snapshot.stdout.splitlines():
        fields = line.split(None, 2)
        if len(fields) == 3 and fields[1] == str(process_group) and not fields[2].startswith("Z"):
            members.append(int(fields[0]))
    return tuple(members)


def _signal_group(process_group: int, signal_number: int) -> bool:
    try:
        os.killpg(process_group, signal_number)
    except ProcessLookupError:
        return False
    return True


def _terminate_and_reap(process: subprocess.Popen[bytes]) -> None:
    process_group = process.pid
    _ = _signal_group(process_group, signal.SIGTERM)
    try:
        _ = process.wait(timeout=TERMINATION_GRACE_SECONDS)
    except subprocess.TimeoutExpired:
        _ = process.poll()

    if _signal_group(process_group, 0):
        _ = _signal_group(process_group, signal.SIGKILL)

    try:
        _ = process.wait(timeout=TERMINATION_GRACE_SECONDS)
    except subprocess.TimeoutExpired as error:
        raise ProcessCleanupError(process_group) from error
    if _live_group_members(process_group):
        raise ProcessCleanupError(process_group)


def run_owned(
    command: tuple[str, ...], cwd: Path, timeout: float, environment: dict[str, str],
) -> tuple[int, bool]:
    """Run one process-group leader and synchronously reap it on every exit."""
    process: subprocess.Popen[bytes] | None = None
    try:
        process = subprocess.Popen(
            command, cwd=cwd, env=environment, stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True,
        )
        try:
            exit_code = process.wait(timeout=timeout)
            _terminate_and_reap(process)
            return exit_code, False
        except subprocess.TimeoutExpired:
            _terminate_and_reap(process)
            return 124, True
    except OSError:
        return 127, False
    except ProcessInterrupted:
        if process is not None:
            _terminate_and_reap(process)
        raise
