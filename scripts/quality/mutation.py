#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
# How to run: python3 scripts/quality/mutation.py --repo .

from __future__ import annotations

import hashlib
import os
import stat
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Final, NewType, Protocol, override

Fingerprint = NewType("Fingerprint", str)
GIT_TIMEOUT_SECONDS: Final = 10


class Hasher(Protocol):
    def update(self, data: bytes, /) -> None: ...


@dataclass(frozen=True, slots=True)
class FingerprintError(RuntimeError):
    operation: str
    exit_code: int

    @override
    def __str__(self) -> str:
        return f"cannot fingerprint Git {self.operation} (exit {self.exit_code})"


def _git(repo: Path, operation: str, *arguments: str) -> bytes:
    try:
        completed = subprocess.run(
            ("git", "-C", os.fspath(repo), *arguments),
            check=False,
            capture_output=True,
            stdin=subprocess.DEVNULL,
            timeout=GIT_TIMEOUT_SECONDS,
        )
    except subprocess.TimeoutExpired as error:
        raise FingerprintError(operation, 124) from error
    if completed.returncode != 0:
        raise FingerprintError(operation, completed.returncode)
    return completed.stdout


def _frame(digest: Hasher, name: bytes, value: bytes) -> None:
    digest.update(len(name).to_bytes(8, "big"))
    digest.update(name)
    digest.update(len(value).to_bytes(8, "big"))
    digest.update(value)


def _tracked_state(repo: Path, raw_path: bytes) -> bytes:
    path = repo / os.fsdecode(raw_path)
    try:
        metadata = path.lstat()
    except FileNotFoundError:
        return b"missing"
    mode = f"{stat.S_IMODE(metadata.st_mode):04o}".encode()
    if stat.S_ISLNK(metadata.st_mode):
        return b"symlink\0" + mode + b"\0" + os.fsencode(os.readlink(path))
    if stat.S_ISREG(metadata.st_mode):
        return b"file\0" + mode + b"\0" + hashlib.sha256(path.read_bytes()).digest()
    return b"other\0" + mode


def _is_safe_omo_path(root: Path, raw_path: bytes) -> bool:
    relative = Path(os.fsdecode(raw_path))
    runtime_root = root / ".omo"
    return (
        bool(relative.parts)
        and relative.parts[0] == ".omo"
        and runtime_root.resolve(strict=False) == runtime_root
        and (root / relative).resolve(strict=False).is_relative_to(runtime_root)
    )


def fingerprint(repo: Path | None = None) -> Fingerprint:
    """Return one content-free digest of all mutation-relevant Git state."""
    root = Path(".").resolve() if repo is None else repo.resolve()
    digest = hashlib.sha256()
    _frame(digest, b"version", b"2")
    _frame(digest, b"head", _git(root, "HEAD", "rev-parse", "--verify", "HEAD").strip())
    _frame(digest, b"index", _git(root, "index", "ls-files", "--stage", "-z"))
    tracked = sorted(path for path in _git(root, "tracked paths", "ls-files", "-z").split(b"\0") if path)
    for raw_path in tracked:
        _frame(digest, b"tracked\0" + raw_path, _tracked_state(root, raw_path))
    untracked = sorted(
        path
        for path in _git(root, "untracked paths", "ls-files", "--others", "--exclude-standard", "-z").split(b"\0")
        if path
    )
    for raw_path in untracked:
        _frame(digest, b"untracked", raw_path)
    ignored = sorted(
        path
        for path in _git(
            root, "ignored paths", "ls-files", "--others", "--ignored", "--exclude-standard", "-z",
        ).split(b"\0")
        if path and not _is_safe_omo_path(root, path)
    )
    for raw_path in ignored:
        _frame(digest, b"ignored", raw_path)
    return Fingerprint(digest.hexdigest())


def main() -> int:
    arguments = sys.argv[1:]
    if arguments[:1] == ["--help"]:
        _ = sys.stdout.write("usage: mutation.py [--repo PATH]\n")
        return 0
    if arguments and (len(arguments) != 2 or arguments[0] != "--repo"):
        _ = sys.stderr.write("usage: mutation.py [--repo PATH]\n")
        return 2
    repo = Path(arguments[1]) if arguments else Path(".")
    try:
        value = fingerprint(repo)
    except FingerprintError as error:
        _ = sys.stderr.write(f"{error}\n")
        return 2
    _ = sys.stdout.write(f"{value}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
