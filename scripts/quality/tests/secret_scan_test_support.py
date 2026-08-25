# /// script
# requires-python = ">=3.12"
# ///
# How to run: imported by scripts/quality/tests/test_secret_scan.py

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from types import TracebackType
from typing import Final, Self, final

from scripts.quality.contracts.json_boundary import load_json_bytes
from scripts.quality.tests.contract_support import JsonObject
from scripts.quality.tests.plan_test_support import PlannerRepo

QUALITY_ROOT: Final = Path(__file__).resolve().parents[1]
SCANNER: Final = QUALITY_ROOT / "secret_scan.py"
STUB_SOURCE: Final = Path(__file__).resolve().parent / "fixtures" / "trufflehog_stub.py"
LOCK: Final = QUALITY_ROOT / "trufflehog.lock"


@final
class SecretScanRepo:
    def __init__(self) -> None:
        self._planner = PlannerRepo()
        self.work = self._planner.work
        self.base = self._planner.base
        self.zero = self._planner.zero
        self._tools = Path(tempfile.mkdtemp(prefix="nod-secret-scan-tools-"))
        self.stub = self._tools / "trufflehog"
        _ = shutil.copyfile(STUB_SOURCE, self.stub)
        self.stub.chmod(0o755)

    def __enter__(self) -> Self:
        return self

    def __exit__(
        self,
        exception_type: type[BaseException] | None,
        exception: BaseException | None,
        traceback: TracebackType | None,
    ) -> None:
        shutil.rmtree(self._tools)
        self._planner.__exit__(exception_type, exception, traceback)

    def commit(self, path: str = "fixture.txt", content: str = "outgoing\n") -> str:
        return self._planner.commit(path, content)

    def git(self, *arguments: str) -> str:
        return self._planner.git(*arguments)

    def record(
        self,
        local_oid: str,
        local_ref: str = "refs/heads/main",
        remote_ref: str = "refs/heads/main",
        remote_oid: str | None = None,
    ) -> str:
        return self._planner.push_record(local_ref, local_oid, remote_ref, remote_oid)

    def environment(self, mode: str = "clean") -> dict[str, str]:
        environment = dict(os.environ)
        environment["PATH"] = os.pathsep.join((os.fspath(self._tools), environment.get("PATH", "")))
        environment["NOD_TRUFFLEHOG_STUB_MODE"] = mode
        return environment

    def scan(
        self,
        input_text: str,
        mode: str = "clean",
        extra: tuple[str, ...] = (),
        environment: dict[str, str] | None = None,
    ) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            (sys.executable, os.fspath(SCANNER), "--json", *extra), cwd=self.work, input=input_text,
            env=self.environment(mode) if environment is None else environment,
            check=False, capture_output=True, text=True,
        )

    @staticmethod
    def json(completed: subprocess.CompletedProcess[str]) -> JsonObject:
        parsed = load_json_bytes(completed.stdout.encode())
        if not isinstance(parsed, dict):
            raise TypeError
        return parsed
