# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 -m unittest scripts.quality.tests.test_plan_process -v

from __future__ import annotations

import os
import select
import signal
import subprocess
import tempfile
import time
import unittest
from pathlib import Path
from typing import Final

from scripts.quality import git_reader
from scripts.quality.tests.plan_test_support import PLANNER, PlannerRepo


class PlannerProcessTests(unittest.TestCase):
    def test_git_timeout_when_external_command_does_not_finish(self) -> None:
        # Given: a real executable named git exceeds the bounded adapter timeout.
        with tempfile.TemporaryDirectory() as directory:
            wrapper = Path(directory) / "git"
            wrapper.write_text("#!/bin/sh\nexec sleep 30\n", encoding="utf-8")
            wrapper.chmod(0o755)
            original_path = os.environ["PATH"]
            os.environ["PATH"] = f"{directory}:{original_path}"
            try:
                # When: the Git adapter invokes it.
                started = time.monotonic()
                result = git_reader.git("status")
                elapsed = time.monotonic() - started
            finally:
                os.environ["PATH"] = original_path
        # Then: timeout is explicit and bounded near the declared limit.
        self.assertEqual(124, result.returncode)
        self.assertLess(elapsed, git_reader.GIT_TIMEOUT_SECONDS + 2)

    def test_no_mutation_when_planner_is_interrupted_mid_git_command(self) -> None:
        # Given: a planner subprocess reaches a signalable Git boundary.
        with PlannerRepo() as repo, tempfile.TemporaryDirectory() as directory:
            temporary = Path(directory)
            ready = temporary / "git-ready.fifo"
            control = temporary / "git-control.fifo"
            wrapper = temporary / "git"
            os.mkfifo(ready)
            os.mkfifo(control)
            wrapper.write_text(
                "#!/bin/sh\n"
                "printf 'ready\\n' >\"$READY_FIFO\"\n"
                "IFS= read -r _ <\"$CONTROL_FIFO\"\n"
                "exec /usr/bin/git \"$@\"\n",
                encoding="utf-8",
            )
            wrapper.chmod(0o755)
            environment = os.environ | {
                "CONTROL_FIFO": os.fspath(control),
                "PATH": f"{temporary}:{os.environ['PATH']}",
                "READY_FIFO": os.fspath(ready),
            }
            before = repo.git("status", "--porcelain=v1", "--untracked-files=all")
            ready_descriptor = os.open(ready, os.O_RDWR | os.O_NONBLOCK)
            control_descriptor = os.open(control, os.O_RDWR | os.O_NONBLOCK)
            try:
                # When: SIGTERM arrives after the exact Git-ready event.
                with subprocess.Popen(
                    ("python3", str(PLANNER), "--phase", "pre-push", "--remote", "origin", "--json"),
                    cwd=repo.work,
                    env=environment,
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    start_new_session=True,
                ) as process:
                    assert process.stdin is not None
                    process.stdin.write("malformed\n")
                    process.stdin.close()
                    readable, _, _ = select.select((ready_descriptor,), (), (), 5)
                    self.assertEqual((ready_descriptor,), tuple(readable))
                    self.assertEqual("ready", os.read(ready_descriptor, 64).decode().strip())
                    os.killpg(process.pid, signal.SIGTERM)
                    process.wait(timeout=5)
                after = repo.git("status", "--porcelain=v1", "--untracked-files=all")
            finally:
                os.close(control_descriptor)
                os.close(ready_descriptor)
        # Then: signal status survives and the fixture state is unchanged.
        self.assertEqual(-signal.SIGTERM, process.returncode)
        self.assertEqual(before, after)


if __name__ == "__main__":
    unittest.main()
