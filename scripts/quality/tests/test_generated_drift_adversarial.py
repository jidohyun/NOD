# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 -m unittest scripts.quality.tests.test_generated_drift_adversarial -v

from __future__ import annotations

import os
import select
import signal
import subprocess
import shutil
import tempfile
import unittest
from pathlib import Path
from typing import Final
from unittest.mock import patch

from scripts.quality.contracts.json_boundary import JsonObject
from scripts.quality.generated_drift import check, load_pairs
from scripts.quality.tests.generated_drift_test_support import DriftRepo, first_pair, json_list, parse_result

SCRIPT: Final = Path(__file__).resolve().parents[1] / "generated_drift.py"


class GeneratedDriftAdversarialTests(unittest.TestCase):
    def test_cached_artifact_when_generator_leaks_outside_output_root(self) -> None:
        with DriftRepo() as repo:
            repo.write_generator(
                "from pathlib import Path; Path('generated/result.txt').write_text('generated\\n'); "
                "Path('.cache/leak').parent.mkdir(); Path('.cache/leak').write_text('cache')\n",
            )
            repo.write_output()
            repo.commit()
            completed, result = self._run(repo, repo.matrix())
        self.assertEqual(1, completed.returncode)
        self.assertEqual("SOURCE_MUTATION", result["classification"])
        mutations = json_list(first_pair(result)["source_mutations"])
        self.assertIn(".cache/leak", mutations)

    def test_locked_generated_cache_has_complete_manifest_and_is_removed(self) -> None:
        with DriftRepo() as repo, tempfile.TemporaryDirectory() as directory:
            temporary = Path(directory)
            repo.write_generator(
                "from pathlib import Path; p=Path('.cache/locked/leak'); p.parent.mkdir(parents=True); "
                "p.write_text('cache'); p.parent.chmod(0o000); Path('generated/result.txt').write_text('generated\\n')\n",
            )
            repo.write_output()
            repo.commit()
            environment = os.environ | {"TMPDIR": os.fspath(temporary)}
            completed = subprocess.run(
                ("python3", str(SCRIPT), "--repo", str(repo.root), "--revision", "HEAD", "--matrix", str(repo.matrix()), "--json"),
                env=environment, check=False, capture_output=True, text=True,
            )
            result = parse_result(completed.stdout)
            mutations = json_list(first_pair(result)["source_mutations"])
            leaked_trees = list(temporary.glob("nod-generated-drift-*"))
        self.assertEqual(1, completed.returncode, completed.stderr)
        self.assertEqual("SOURCE_MUTATION", result["classification"])
        self.assertIn(".cache/locked/leak", mutations)
        self.assertTrue(result["temporary_tree_removed"])
        self.assertEqual([], leaked_trees)

    def test_misleading_success_output_when_generator_exits_nonzero(self) -> None:
        with DriftRepo() as repo:
            repo.write_generator("print('generated successfully'); raise SystemExit(23)\n")
            repo.write_output()
            repo.commit()
            completed, result = self._run(repo, repo.matrix())
        self.assertEqual(1, completed.returncode)
        self.assertEqual("GENERATOR_FAILURE", result["classification"])
        self.assertNotIn("generated successfully", completed.stdout)

    def test_mid_operation_interrupt_when_generator_announces_readiness(self) -> None:
        with DriftRepo() as repo, tempfile.TemporaryDirectory() as directory:
            temporary = Path(directory)
            ready = temporary / "ready.fifo"
            control = temporary / "control.fifo"
            os.mkfifo(ready)
            os.mkfifo(control)
            ready_descriptor = os.open(ready, os.O_RDWR | os.O_NONBLOCK)
            control_descriptor = os.open(control, os.O_RDWR | os.O_NONBLOCK)
            environment = os.environ | {"READY_FIFO": os.fspath(ready), "CONTROL_FIFO": os.fspath(control), "TMPDIR": os.fspath(temporary)}
            repo.write_generator("raise SystemExit(0)\n")
            repo.write_output()
            repo.commit()
            matrix = repo.matrix(command=["python3", "-c", "import os; open(os.environ['READY_FIFO'],'w').write('ready'); open(os.environ['CONTROL_FIFO']).read()"])
            try:
                with subprocess.Popen(
                    ("python3", str(SCRIPT), "--repo", str(repo.root), "--revision", "HEAD", "--matrix", str(matrix), "--json"),
                    env=environment, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, start_new_session=True,
                ) as process:
                    readable, _, _ = select.select((ready_descriptor,), (), (), 5)
                    self.assertEqual((ready_descriptor,), tuple(readable))
                    self.assertEqual("ready", os.read(ready_descriptor, 64).decode())
                    os.kill(process.pid, signal.SIGTERM)
                    stdout, stderr = process.communicate(timeout=5)
                result = parse_result(stdout)
                leaked_trees = list(temporary.glob("nod-generated-drift-*"))
            finally:
                os.close(control_descriptor)
                os.close(ready_descriptor)
        self.assertEqual(128 + signal.SIGTERM, process.returncode, stderr)
        self.assertEqual("INTERRUPTED", result["classification"])
        self.assertEqual([], leaked_trees)

    def test_interrupt_escalates_when_ready_generator_ignores_sigterm(self) -> None:
        with DriftRepo() as repo, tempfile.TemporaryDirectory() as directory:
            temporary = Path(directory)
            ready, control = temporary / "ready.fifo", temporary / "control.fifo"
            os.mkfifo(ready)
            os.mkfifo(control)
            ready_descriptor = os.open(ready, os.O_RDWR | os.O_NONBLOCK)
            control_descriptor = os.open(control, os.O_RDWR | os.O_NONBLOCK)
            environment = os.environ | {"READY_FIFO": os.fspath(ready), "CONTROL_FIFO": os.fspath(control), "TMPDIR": os.fspath(temporary)}
            repo.write_generator("raise SystemExit(0)\n")
            repo.write_output()
            repo.commit()
            code = "import os,signal; signal.signal(signal.SIGTERM,signal.SIG_IGN); open(os.environ['READY_FIFO'],'w').write(str(os.getpid())); open(os.environ['CONTROL_FIFO']).read()"
            matrix = repo.matrix(command=["python3", "-c", code])
            generator_pid = 0
            try:
                with subprocess.Popen(
                    ("python3", str(SCRIPT), "--repo", str(repo.root), "--revision", "HEAD", "--matrix", str(matrix), "--json"),
                    env=environment, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, start_new_session=True,
                ) as process:
                    readable, _, _ = select.select((ready_descriptor,), (), (), 5)
                    self.assertEqual((ready_descriptor,), tuple(readable))
                    generator_pid = int(os.read(ready_descriptor, 64).decode())
                    os.kill(process.pid, signal.SIGTERM)
                    try:
                        stdout, stderr = process.communicate(timeout=3)
                    except subprocess.TimeoutExpired:
                        os.killpg(generator_pid, signal.SIGKILL)
                        _ = process.communicate(timeout=3)
                        self.fail("checker did not bound SIGTERM-ignoring generator cleanup")
                result = parse_result(stdout)
                leaked_trees = list(temporary.glob("nod-generated-drift-*"))
            finally:
                os.close(control_descriptor)
                os.close(ready_descriptor)
                if generator_pid and self._process_exists(generator_pid):
                    os.killpg(generator_pid, signal.SIGKILL)
        self.assertEqual(128 + signal.SIGTERM, process.returncode, stderr)
        self.assertEqual("INTERRUPTED", result["classification"])
        self.assertFalse(self._process_exists(generator_pid))
        self.assertEqual([], leaked_trees)

    def test_timeout_sends_term_then_escalates_and_reaps_process_group(self) -> None:
        with DriftRepo() as repo, tempfile.TemporaryDirectory() as directory:
            temporary = Path(directory)
            ready, terminated, control = temporary / "ready.fifo", temporary / "term.fifo", temporary / "control.fifo"
            for fifo in (ready, terminated, control):
                os.mkfifo(fifo)
            descriptors = [os.open(fifo, os.O_RDWR | os.O_NONBLOCK) for fifo in (ready, terminated, control)]
            environment = os.environ | {"READY_FIFO": os.fspath(ready), "TERM_FIFO": os.fspath(terminated), "CONTROL_FIFO": os.fspath(control)}
            repo.write_generator("raise SystemExit(0)\n")
            repo.write_output()
            repo.commit()
            code = "import os,signal; signal.signal(signal.SIGTERM,lambda *_: open(os.environ['TERM_FIFO'],'w').write('term')); open(os.environ['READY_FIFO'],'w').write(str(os.getpid())); open(os.environ['CONTROL_FIFO']).read()"
            matrix = repo.matrix(command=["python3", "-c", code], timeout=1.0)
            generator_pid = 0
            try:
                with subprocess.Popen(
                    ("python3", str(SCRIPT), "--repo", str(repo.root), "--revision", "HEAD", "--matrix", str(matrix), "--json"),
                    env=environment, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, start_new_session=True,
                ) as process:
                    ready_set, _, _ = select.select((descriptors[0],), (), (), 5)
                    self.assertEqual((descriptors[0],), tuple(ready_set))
                    generator_pid = int(os.read(descriptors[0], 64).decode())
                    term_set, _, _ = select.select((descriptors[1],), (), (), 5)
                    self.assertEqual((descriptors[1],), tuple(term_set))
                    self.assertEqual("term", os.read(descriptors[1], 64).decode())
                    stdout, stderr = process.communicate(timeout=5)
                result = parse_result(stdout)
            finally:
                for descriptor in descriptors:
                    os.close(descriptor)
                if generator_pid and self._process_exists(generator_pid):
                    os.killpg(generator_pid, signal.SIGKILL)
        self.assertEqual(1, process.returncode, stderr)
        self.assertEqual("GENERATOR_TIMEOUT", result["classification"])
        self.assertFalse(self._process_exists(generator_pid))

    def test_cleanup_failure_is_blocking_and_never_claims_tree_removed(self) -> None:
        with DriftRepo() as repo, tempfile.TemporaryDirectory() as directory:
            owned = Path(directory) / "nod-generated-drift-observable"
            owned.mkdir()
            repo.write_generator("from pathlib import Path; Path('generated/result.txt').write_text('generated\\n')\n")
            repo.write_output()
            repo.commit()
            with patch("scripts.quality.generated_drift.tempfile.mkdtemp", return_value=os.fspath(owned)), patch(
                "scripts.quality.generated_drift._remove_tree", return_value=False,
            ):
                result, exit_code = check(repo.root, "HEAD", load_pairs(repo.matrix()))
            remained = owned.exists()
            shutil.rmtree(owned)
        self.assertEqual(1, exit_code)
        self.assertEqual("CLEANUP_FAILURE", result["classification"])
        self.assertFalse(result["temporary_tree_removed"])
        self.assertTrue(remained)

    @staticmethod
    def _process_exists(pid: int) -> bool:
        try:
            os.kill(pid, 0)
        except ProcessLookupError:
            return False
        return True

    def _run(self, repo: DriftRepo, matrix: Path) -> tuple[subprocess.CompletedProcess[str], JsonObject]:
        completed = subprocess.run(
            ("python3", str(SCRIPT), "--repo", str(repo.root), "--revision", "HEAD", "--matrix", str(matrix), "--json"),
            check=False, capture_output=True, text=True,
        )
        return completed, parse_result(completed.stdout)


if __name__ == "__main__":
    _ = unittest.main()
