# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 -m unittest scripts.quality.tests.test_generated_process_lifecycle -v

from __future__ import annotations

import os
import select
import signal
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from typing import Final

from scripts.quality.contracts.json_boundary import JsonObject
from scripts.quality.generated_process import run_owned
from scripts.quality.tests.generated_drift_test_support import DriftRepo, parse_result

SCRIPT: Final = Path(__file__).resolve().parents[1] / "generated_drift.py"


class GeneratedProcessLifecycleTests(unittest.TestCase):
    def test_interrupt_kills_sigterm_ignoring_descendant_after_leader_exits(self) -> None:
        process, result, child_was_live, stderr = self._run_descendant_case(interrupt=True)
        self.assertEqual(128 + signal.SIGTERM, process.returncode, stderr)
        self.assertEqual("INTERRUPTED", result["classification"])
        self.assertFalse(child_was_live)

    def test_timeout_kills_sigterm_ignoring_descendant_after_leader_exits(self) -> None:
        process, result, child_was_live, stderr = self._run_descendant_case(interrupt=False)
        self.assertEqual(1, process.returncode, stderr)
        self.assertEqual("GENERATOR_TIMEOUT", result["classification"])
        self.assertFalse(child_was_live)

    def test_successful_leader_exit_cleans_up_owned_descendant(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            temporary = Path(directory)
            ready = temporary / "ready.fifo"
            os.mkfifo(ready)
            descriptor = os.open(ready, os.O_RDWR | os.O_NONBLOCK)
            environment = os.environ | {"READY_FIFO": os.fspath(ready)}
            child_code = (
                "import os,signal; signal.signal(signal.SIGTERM,signal.SIG_IGN); "
                "print(os.getpid(),flush=True); signal.pause()"
            )
            leader_code = (
                f"import os,subprocess; p=subprocess.Popen([{sys.executable!r},'-c',{child_code!r}],"
                "stdout=subprocess.PIPE,text=True); open(os.environ['READY_FIFO'],'w').write(p.stdout.readline())"
            )
            try:
                exit_code, timed_out = run_owned(
                    (sys.executable, "-c", leader_code), temporary, 5.0, environment,
                )
                readable, _, _ = select.select((descriptor,), (), (), 5)
                self.assertEqual((descriptor,), tuple(readable))
                child_pid = int(os.read(descriptor, 64))
            finally:
                os.close(descriptor)
        self.assertEqual(0, exit_code)
        self.assertFalse(timed_out)
        self.assertFalse(self._process_is_live(child_pid))

    def _run_descendant_case(
        self, *, interrupt: bool,
    ) -> tuple[subprocess.Popen[str], JsonObject, bool, str]:
        with DriftRepo() as repo, tempfile.TemporaryDirectory() as directory:
            temporary = Path(directory)
            ready = temporary / "ready.fifo"
            os.mkfifo(ready)
            descriptor = os.open(ready, os.O_RDWR | os.O_NONBLOCK)
            environment = os.environ | {
                "READY_FIFO": os.fspath(ready), "TMPDIR": os.fspath(temporary),
            }
            _ = repo.write_generator("raise SystemExit(0)\n")
            _ = repo.write_output()
            _ = repo.commit()
            child_code = (
                "import os,signal; signal.signal(signal.SIGTERM,signal.SIG_IGN); "
                "open(os.environ['READY_FIFO'],'w').write(str(os.getpid())); signal.pause()"
            )
            leader_code = (
                f"import signal,subprocess; subprocess.Popen([{sys.executable!r},'-c',{child_code!r}]); "
                "signal.pause()"
            )
            matrix = repo.matrix(
                command=[sys.executable, "-c", leader_code],
                timeout=30.0 if interrupt else 1.0,
            )
            child_pid = 0
            process = subprocess.Popen(
                (sys.executable, str(SCRIPT), "--repo", str(repo.root), "--revision", "HEAD",
                 "--matrix", str(matrix), "--json"),
                env=environment, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
            )
            try:
                readable, _, _ = select.select((descriptor,), (), (), 5)
                self.assertEqual((descriptor,), tuple(readable))
                child_pid = int(os.read(descriptor, 64))
                if interrupt:
                    os.kill(process.pid, signal.SIGTERM)
                stdout, stderr = process.communicate(timeout=5)
                result = parse_result(stdout)
                child_was_live = self._process_is_live(child_pid)
            finally:
                os.close(descriptor)
                if process.poll() is None:
                    process.kill()
                    _ = process.wait(timeout=5)
                if child_pid and self._process_is_live(child_pid):
                    os.kill(child_pid, signal.SIGKILL)
        return process, result, child_was_live, stderr

    @staticmethod
    def _process_is_live(pid: int) -> bool:
        completed = subprocess.run(
            ("ps", "-o", "stat=", "-p", str(pid)),
            check=False, capture_output=True, text=True,
        )
        state = completed.stdout.strip()
        return bool(state) and not state.startswith("Z")


if __name__ == "__main__":
    _ = unittest.main()
