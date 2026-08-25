# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 -m unittest scripts.quality.tests.test_plan_cli -v

from __future__ import annotations

import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from typing import Final

from scripts.quality.tests.plan_test_support import PlannerRepo

PLANNER: Final = Path(__file__).resolve().parents[1] / "plan.py"


class PlannerCliTests(unittest.TestCase):
    def test_no_ref_updates_when_pre_push_stdin_is_empty(self) -> None:
        # Given: the planner is invoked for pre-push with no ref records.
        # When: stdin is empty.
        completed = subprocess.run(
            ("python3", str(PLANNER), "--phase", "pre-push", "--remote", "origin", "--json"),
            input="",
            check=False,
            capture_output=True,
            text=True,
        )

        # Then: it emits the schema-defined no-ref plan successfully.
        self.assertEqual(0, completed.returncode, completed.stderr)
        plan = json.loads(completed.stdout)
        self.assertEqual("no_ref_updates", plan["classification"])
        self.assertEqual([], plan["refs"])

    def test_identical_plans_when_multi_ref_stream_uses_pipe_or_regular_file(self) -> None:
        # Given: two valid ref records are persisted in a regular file.
        with PlannerRepo() as repo:
            api_oid = repo.commit("apps/api/file-stdin.py")
            repo.git("checkout", "--quiet", "-b", "feature/file-stdin")
            web_oid = repo.commit("apps/web/file-stdin.ts")
            stream_text = repo.push_record("refs/heads/main", api_oid) + repo.push_record(
                "refs/heads/feature/file-stdin", web_oid, "refs/heads/feature/file-stdin", repo.zero
            )
            pipe_json = repo.plan("pre-push", stream_text)
            pipe_text = repo.plan("pre-push", stream_text, json_output=False)
            with tempfile.TemporaryFile(mode="w+", encoding="utf-8") as stream:
                stream.write(stream_text)
                stream.seek(0)
                # When: the planner reads JSON from regular-file stdin.
                file_json = subprocess.run(
                    ("python3", str(PLANNER), "--phase", "pre-push", "--remote", "origin", "--json"),
                    cwd=repo.work,
                    stdin=stream,
                    check=False,
                    capture_output=True,
                    text=True,
                )
                stream.seek(0)
                file_text = subprocess.run(
                    ("python3", str(PLANNER), "--phase", "pre-push", "--remote", "origin"),
                    cwd=repo.work,
                    stdin=stream,
                    check=False,
                    capture_output=True,
                    text=True,
                )
        # Then: every line is consumed once and both stdin modes are byte-identical.
        self.assertEqual(0, pipe_json.returncode, pipe_json.stderr)
        self.assertEqual(0, file_json.returncode, file_json.stderr)
        self.assertEqual(2, len(json.loads(file_json.stdout)["refs"]))
        self.assertEqual(pipe_json.stdout, file_json.stdout)
        self.assertEqual(pipe_text.stdout, file_text.stdout)


if __name__ == "__main__":
    unittest.main()
