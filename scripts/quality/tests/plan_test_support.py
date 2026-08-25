# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 -m unittest discover -s scripts/quality/tests -v

from __future__ import annotations

import json
import os
import subprocess
import tempfile
from pathlib import Path
from types import TracebackType
from typing import Final, Self

from scripts.quality.tests.contract_support import JsonObject

QUALITY_ROOT: Final = Path(__file__).resolve().parents[1]
PLANNER: Final = QUALITY_ROOT / "plan.py"
FIXTURE: Final = QUALITY_ROOT / "fixtures" / "git_repo.sh"


class PlannerRepo:
    def __init__(self) -> None:
        self._temporary = tempfile.TemporaryDirectory()
        self.root = Path(self._temporary.name) / "fixture"
        completed = subprocess.run(
            ("bash", "-c", 'source "$1"; create_git_fixture "$2"', "planner-test", str(FIXTURE), str(self.root)),
            check=False,
            capture_output=True,
            text=True,
        )
        if completed.returncode != 0:
            self._temporary.cleanup()
            raise RuntimeError(completed.stderr)
        metadata = json.loads(completed.stdout)
        self.work = Path(metadata["work"])
        self.zero = str(metadata["zero_oid"])
        self.git("push", "--quiet", "origin", "HEAD:main")
        self.base = self.git("rev-parse", "HEAD")

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
            ("git", "-C", os.fspath(self.work), *arguments),
            check=True,
            capture_output=True,
            text=True,
        )
        return completed.stdout.strip()

    def commit(self, path: str, content: str = "change\n") -> str:
        target = self.work / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
        self.git("add", "--", path)
        self.git("commit", "--quiet", "-m", f"test: change {path}")
        return self.git("rev-parse", "HEAD")

    def plan(self, phase: str, input_text: str = "", json_output: bool = True) -> subprocess.CompletedProcess[str]:
        command = ["python3", str(PLANNER), "--phase", phase]
        if phase == "pre-push":
            command.extend(("--remote", "origin"))
        if json_output:
            command.append("--json")
        return subprocess.run(command, cwd=self.work, input=input_text, check=False, capture_output=True, text=True)

    def push_record(
        self,
        local_ref: str,
        local_oid: str,
        remote_ref: str = "refs/heads/main",
        remote_oid: str | None = None,
    ) -> str:
        return f"{local_ref} {local_oid} {remote_ref} {self.base if remote_oid is None else remote_oid}\n"

    @staticmethod
    def json(completed: subprocess.CompletedProcess[str]) -> JsonObject:
        value = json.loads(completed.stdout)
        if not isinstance(value, dict):
            raise TypeError
        return value
