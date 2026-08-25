# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 -m unittest scripts.quality.tests.test_generated_drift -v

from __future__ import annotations

import json
import os
import subprocess
import tempfile
from pathlib import Path
from types import TracebackType
from typing import Self

from scripts.quality.contracts.json_boundary import JsonObject, JsonValue, load_json_bytes


def json_object(value: JsonValue) -> JsonObject:
    if not isinstance(value, dict):
        raise AssertionError
    return value


def json_list(value: JsonValue) -> list[JsonValue]:
    if not isinstance(value, list):
        raise AssertionError
    return value


def parse_result(raw: str) -> JsonObject:
    return json_object(load_json_bytes(raw.encode()))


def first_pair(result: JsonObject) -> JsonObject:
    return json_object(json_list(result["pairs"])[0])


def pair_by_name(result: JsonObject, name: str) -> JsonObject:
    for value in json_list(result["pairs"]):
        pair = json_object(value)
        if pair["name"] == name:
            return pair
    raise AssertionError


class DriftRepo:
    def __init__(self) -> None:
        self._temporary = tempfile.TemporaryDirectory()
        self.root = Path(self._temporary.name) / "repo"
        self.root.mkdir()
        self.git("init", "--quiet")
        self.git("config", "user.email", "fixture@example.invalid")
        self.git("config", "user.name", "Fixture")

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
        return subprocess.run(
            ("git", "-C", os.fspath(self.root), *arguments), check=True, capture_output=True, text=True,
        ).stdout.strip()

    def write_generator(self, body: str) -> None:
        _ = (self.root / "generate.py").write_text(body, encoding="utf-8")

    def write_output(self, content: str = "generated\n") -> Path:
        output = self.root / "generated" / "result.txt"
        output.parent.mkdir(exist_ok=True)
        _ = output.write_text(content, encoding="utf-8")
        return output

    def commit(self) -> str:
        self.git("add", ".")
        self.git("commit", "--quiet", "-m", "fixture")
        return self.git("rev-parse", "HEAD")

    def matrix(self, *, command: list[str] | None = None, timeout: float = 2.0) -> Path:
        path = self.root.parent / "matrix.json"
        value = {
            "pairs": [{
                "name": "fixture",
                "blocking": True,
                "reason": None,
                "cwd": ".",
                "command": command or ["python3", "generate.py"],
                "output_roots": ["generated"],
                "expected_outputs": ["generated/result.txt"],
                "timeout_seconds": timeout,
            }],
        }
        _ = path.write_text(json.dumps(value), encoding="utf-8")
        return path
