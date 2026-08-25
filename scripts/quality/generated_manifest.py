# /// script
# requires-python = ">=3.12"
# dependencies = []
# ///
# How to run: imported by scripts/quality/generated_drift.py

from __future__ import annotations

import hashlib
import json
import os
import stat
from dataclasses import dataclass
from pathlib import Path, PurePosixPath
from typing import Literal

from scripts.quality.contracts.json_boundary import JsonObject, JsonValue


@dataclass(frozen=True, slots=True)
class Entry:
    kind: Literal["directory", "file", "symlink", "other"]
    mode: str
    digest: str

    def json(self, path: str) -> JsonObject:
        return {"path": path, "kind": self.kind, "mode": self.mode, "sha256": self.digest}


type Manifest = dict[str, Entry]


def _entry(path: Path) -> Entry:
    metadata = path.lstat()
    mode = f"{stat.S_IMODE(metadata.st_mode):04o}"
    if stat.S_ISLNK(metadata.st_mode):
        return Entry("symlink", mode, hashlib.sha256(os.fsencode(os.readlink(path))).hexdigest())
    if stat.S_ISREG(metadata.st_mode):
        return Entry("file", mode, hashlib.sha256(path.read_bytes()).hexdigest())
    if stat.S_ISDIR(metadata.st_mode):
        return Entry("directory", mode, hashlib.sha256(b"directory").hexdigest())
    return Entry("other", mode, hashlib.sha256(b"other").hexdigest())


def _collect(root: Path, path: Path, entries: Manifest) -> None:
    relative = path.relative_to(root).as_posix()
    if relative == ".git" or relative.startswith(".git/"):
        return
    entry = _entry(path)
    entries[relative] = entry
    if entry.kind != "directory":
        return
    original_mode = stat.S_IMODE(path.lstat().st_mode)
    widened = False
    try:
        children = sorted(path.iterdir(), key=lambda child: child.name)
    except PermissionError:
        path.chmod(original_mode | stat.S_IRUSR | stat.S_IWUSR | stat.S_IXUSR)
        widened = True
        children = sorted(path.iterdir(), key=lambda child: child.name)
    try:
        for child in children:
            _collect(root, child, entries)
    finally:
        if widened:
            path.chmod(original_mode)


def manifest(root: Path, roots: tuple[PurePosixPath, ...] | None = None) -> Manifest:
    selected = (PurePosixPath("."),) if roots is None else roots
    entries: Manifest = {}
    for relative_root in selected:
        absolute = root / relative_root
        if absolute.exists() or absolute.is_symlink():
            _collect(root, absolute, entries)
    return dict(sorted(entries.items()))


def manifest_hash(entries: Manifest) -> str:
    encoded = json.dumps(
        [entry.json(path) for path, entry in entries.items()], sort_keys=True, separators=(",", ":"),
    ).encode()
    return hashlib.sha256(encoded).hexdigest()


def compare(before: Manifest, after: Manifest, expected_outputs: tuple[PurePosixPath, ...]) -> JsonObject:
    expected = {path.as_posix() for path in expected_outputs}
    allowed = expected | {
        parent.as_posix() for path in expected_outputs for parent in path.parents if parent != PurePosixPath(".")
    }
    common = expected & set(before) & set(after)
    content = list[JsonValue](sorted(path for path in common if before[path].digest != after[path].digest))
    missing = list[JsonValue](sorted(path for path in expected if path not in before))
    modes = list[JsonValue](sorted(path for path in common if before[path].mode != after[path].mode))
    types = list[JsonValue](sorted(path for path in common if before[path].kind != after[path].kind))
    unexpected = list[JsonValue](sorted((set(before) | set(after)) - allowed))
    return {"content": content, "missing": missing, "mode": modes, "type": types, "unexpected": unexpected}


def exclude_roots(entries: Manifest, roots: tuple[PurePosixPath, ...]) -> Manifest:
    return {
        path: entry for path, entry in entries.items()
        if not any(PurePosixPath(path) == root or PurePosixPath(path).is_relative_to(root) for root in roots)
    }
