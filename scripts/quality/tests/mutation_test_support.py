# /// script
# requires-python = ">=3.12"
# ///
# How to run: imported by scripts/quality/tests/test_mutation.py

from __future__ import annotations

import os
import subprocess
import tempfile
from pathlib import Path
from types import TracebackType
from typing import Self, final


@final
class MutationRepo:
    def __init__(self) -> None:
        self._temporary = tempfile.TemporaryDirectory()
        self.root = Path(self._temporary.name) / "repo"
        self.root.mkdir()
        _ = self.git("init", "--quiet")
        _ = self.git("config", "user.email", "fixture@example.invalid")
        _ = self.git("config", "user.name", "Fixture")
        _ = (self.root / ".gitignore").write_text(".omo/\n", encoding="utf-8")
        _ = (self.root / "tracked.txt").write_text("original\n", encoding="utf-8")
        _ = (self.root / "link").symlink_to("tracked.txt")
        _ = self.git("add", ".")
        _ = self.git("commit", "--quiet", "-m", "fixture")

    def __enter__(self) -> Self:
        return self

    def __exit__(
        self,
        exception_type: type[BaseException] | None,
        exception: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        self._temporary.cleanup()

    def git(self, *arguments: str) -> str:
        completed = subprocess.run(
            ("git", "-C", os.fspath(self.root), *arguments),
            check=True,
            capture_output=True,
            text=True,
        )
        return completed.stdout.strip()
