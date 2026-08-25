# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 -m unittest discover -s scripts/quality/tests -v

import json
import os
import select
import signal
import subprocess
import tempfile
import unittest
from pathlib import Path
from typing import Final

from scripts.quality.tests.contract_support import validate

QUALITY_ROOT: Final = Path(__file__).resolve().parents[1]
FIXTURE: Final = QUALITY_ROOT / "fixtures" / "git_repo.sh"
PLAN_SCHEMA: Final = QUALITY_ROOT / "contracts" / "plan.schema.json"


class GitFixtureTests(unittest.TestCase):
    def test_bare_remote_and_work_clone_when_fixture_created(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "fixture"
            completed = subprocess.run(
                ("bash", "-c", 'source "$1"; create_git_fixture "$2"', "fixture-test", str(FIXTURE), str(root)),
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertEqual(0, completed.returncode, completed.stderr)
            metadata = json.loads(completed.stdout)
            self.assertTrue((root / "remote.git").is_dir())
            self.assertTrue((root / "work" / ".git").is_dir())
            self.assertEqual("true", self.git(root / "remote.git", "rev-parse", "--is-bare-repository"))
            self.assertEqual("false", self.git(root / "work", "rev-parse", "--is-bare-repository"))
            self.assertEqual(metadata["zero_oid"], "0" * len(self.git(root / "work", "hash-object", "--stdin", input_text="")))
            self.assertNotEqual(metadata["base_oid"], metadata["local_oid"])

    def test_no_ref_and_update_plans_when_fixture_created(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "fixture"
            completed = subprocess.run(
                ("bash", "-c", 'source "$1"; create_git_fixture "$2"', "fixture-test", str(FIXTURE), str(root)),
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertEqual(0, completed.returncode, completed.stderr)
            no_ref = self.load(root / "no_ref_plan.json")
            update = self.load(root / "update_plan.json")
            schema = self.load(PLAN_SCHEMA)
            self.assertTrue(validate(no_ref, schema))
            self.assertTrue(validate(update, schema))
            self.assertEqual("no_ref_updates", no_ref["classification"])
            self.assertEqual([], no_ref["refs"])
            self.assertEqual("update", update["refs"][0]["update_type"])

    def test_direct_run_when_completed_removes_temporary_paths(self) -> None:
        completed = subprocess.run(("bash", str(FIXTURE)), check=False, capture_output=True, text=True)
        self.assertEqual(0, completed.returncode, completed.stderr)
        result = json.loads(completed.stdout)
        self.assertTrue(result["cleaned"])
        self.assertFalse(Path(result["root"]).exists())

    def test_repositories_are_removed_when_sigterm_arrives_after_clone(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            temporary = Path(directory)
            ready = temporary / "clone-ready.fifo"
            control = temporary / "clone-control.fifo"
            wrapper = temporary / "git"
            os.mkfifo(ready)
            os.mkfifo(control)
            wrapper.write_text(
                "#!/usr/bin/env bash\n"
                "set -euo pipefail\n"
                "if [[ $1 == clone ]]; then\n"
                "  /usr/bin/git \"$@\"\n"
                "  printf 'clone-ready\\n' >\"$READY_FIFO\"\n"
                "  IFS= read -r _ <\"$CONTROL_FIFO\"\n"
                "  exit 0\n"
                "fi\n"
                "exec /usr/bin/git \"$@\"\n",
                encoding="utf-8",
            )
            wrapper.chmod(0o755)
            environment = os.environ | {
                "CONTROL_FIFO": os.fspath(control),
                "PATH": f"{temporary}:{os.environ['PATH']}",
                "READY_FIFO": os.fspath(ready),
                "TMPDIR": os.fspath(temporary),
            }
            ready_descriptor = os.open(ready, os.O_RDWR | os.O_NONBLOCK)
            control_descriptor = os.open(control, os.O_RDWR | os.O_NONBLOCK)
            try:
                with subprocess.Popen(
                    ("bash", str(FIXTURE)),
                    env=environment,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    start_new_session=True,
                ) as process:
                    readable, _, _ = select.select((ready_descriptor,), (), (), 5)
                    self.assertEqual((ready_descriptor,), tuple(readable), "clone readiness event was not received")
                    self.assertEqual("clone-ready", os.read(ready_descriptor, 64).decode().strip())
                    roots = tuple(temporary.glob("nod-quality-fixture.*"))
                    self.assertEqual(1, len(roots))
                    self.assertTrue((roots[0] / "remote.git").is_dir())
                    self.assertTrue((roots[0] / "work" / ".git").is_dir())

                    os.killpg(process.pid, signal.SIGTERM)
                    process.communicate(timeout=5)

                    self.assertEqual(-signal.SIGTERM, process.returncode)
                    self.assertFalse(roots[0].exists())
            finally:
                os.close(control_descriptor)
                os.close(ready_descriptor)

    @staticmethod
    def git(repository: Path, *arguments: str, input_text: str | None = None) -> str:
        completed = subprocess.run(
            ("git", "-C", os.fspath(repository), *arguments),
            input=input_text,
            check=True,
            capture_output=True,
            text=True,
        )
        return completed.stdout.strip()

    @staticmethod
    def load(path: Path):
        return json.loads(path.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
