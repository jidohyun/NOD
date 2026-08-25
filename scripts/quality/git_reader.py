# /// script
# requires-python = ">=3.12"
# ///
# How to run: imported by scripts/quality/plan.py

from __future__ import annotations

import subprocess
from dataclasses import dataclass
from typing import Final

GIT_TIMEOUT_SECONDS: Final = 10


@dataclass(frozen=True, slots=True)
class GitResult:
    returncode: int
    stdout: str


def git(*arguments: str) -> GitResult:
    try:
        completed = subprocess.run(
            ("git", *arguments), check=False, capture_output=True, stdin=subprocess.DEVNULL,
            text=True, timeout=GIT_TIMEOUT_SECONDS,
        )
    except subprocess.TimeoutExpired:
        return GitResult(returncode=124, stdout="")
    return GitResult(returncode=completed.returncode, stdout=completed.stdout)


def parse_name_status(raw: str) -> set[str]:
    fields = raw.split("\0")
    paths: set[str] = set()
    index = 0
    while index < len(fields) and fields[index]:
        status = fields[index]
        index += 1
        if index >= len(fields):
            break
        paths.add(fields[index])
        index += 1
        if status.startswith(("R", "C")) and index < len(fields):
            paths.add(fields[index])
            index += 1
    return paths


def unstaged_paths() -> set[str] | None:
    tracked = git("diff", "--name-only", "-z")
    untracked = git("ls-files", "--others", "--exclude-standard", "-z")
    if tracked.returncode != 0 or untracked.returncode != 0:
        return None
    return {path for path in f"{tracked.stdout}{untracked.stdout}".split("\0") if path}


def dirty_paths() -> set[str] | None:
    result = git("status", "--porcelain=v1", "-z", "--untracked-files=all")
    if result.returncode != 0:
        return None
    paths: set[str] = set()
    fields = result.stdout.split("\0")
    index = 0
    while index < len(fields) and fields[index]:
        record = fields[index]
        index += 1
        paths.add(record[3:])
        if record.startswith(("R ", "C ")) and index < len(fields):
            paths.add(fields[index])
            index += 1
    return paths
