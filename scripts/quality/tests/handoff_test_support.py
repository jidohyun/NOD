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
from typing import Callable, Final, Self, final

from scripts.quality.tests.contract_support import JsonObject

QUALITY_ROOT: Final = Path(__file__).resolve().parents[1]
HANDOFF: Final = QUALITY_ROOT / "handoff.py"
FIXTURE: Final = QUALITY_ROOT / "fixtures" / "git_repo.sh"
MARKER_TEMPLATE: Final = "<!-- nod-handoff-base: {oid} -->\n"
JSON_LOAD_OBJECT: Final[Callable[..., JsonObject]] = json.loads


@final
class HandoffRepo:
    def __init__(self) -> None:
        self._temporary = tempfile.TemporaryDirectory()
        self.root = Path(self._temporary.name) / "fixture"
        completed = subprocess.run(
            ("bash", "-c", 'source "$1"; create_git_fixture "$2"', "handoff-test", str(FIXTURE), str(self.root)),
            check=False,
            capture_output=True,
            text=True,
        )
        if completed.returncode != 0:
            self._temporary.cleanup()
            raise RuntimeError(completed.stderr)
        metadata = JSON_LOAD_OBJECT(completed.stdout)
        self.work = Path(str(metadata["work"]))
        self.zero = str(metadata["zero_oid"])
        self.ancestor = self.git("rev-parse", "HEAD")
        _ = self.commit("baseline.txt", "remote main baseline\n")
        _ = self.git("push", "--quiet", "origin", "HEAD:main")
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

    def git(self, *arguments: str, input_text: str | None = None) -> str:
        completed = subprocess.run(
            ("git", "-C", os.fspath(self.work), *arguments),
            input=input_text,
            check=True,
            capture_output=True,
            text=True,
        )
        return completed.stdout.strip()

    def commit(self, path: str, content: str) -> str:
        target = self.work / path
        target.parent.mkdir(parents=True, exist_ok=True)
        _ = target.write_text(content, encoding="utf-8")
        _ = self.git("add", "--", path)
        _ = self.git("commit", "--quiet", "-m", f"test: update {path}")
        return self.git("rev-parse", "HEAD")

    def commit_handoff(self, content: str) -> str:
        return self.commit("docs/handoff.md", content)

    def main_record(self, local_oid: str, remote_oid: str | None = None) -> str:
        expected = self.base if remote_oid is None else remote_oid
        return f"refs/heads/main {local_oid} refs/heads/main {expected}\n"

    def feature_record(self, local_oid: str, name: str) -> str:
        ref = f"refs/heads/{name}"
        return f"{ref} {local_oid} {ref} {self.zero}\n"

    def deletion_record(self) -> str:
        return f"(delete) {self.zero} refs/heads/main {self.base}\n"

    def run(self, input_text: str, environment: dict[str, str] | None = None) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            ("python3", str(HANDOFF), "--json"),
            cwd=self.work,
            input=input_text,
            check=False,
            capture_output=True,
            text=True,
            env=environment,
        )

    @staticmethod
    def json(completed: subprocess.CompletedProcess[str]) -> JsonObject:
        return JSON_LOAD_OBJECT(completed.stdout)
