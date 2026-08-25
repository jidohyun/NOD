# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 -m unittest scripts.quality.tests.test_receipt_process -v

from __future__ import annotations

import os
import select
import signal
import subprocess
import tempfile
import unittest
from pathlib import Path
from typing import Final

from scripts.quality.contracts.json_boundary import JsonObject, JsonValue
from scripts.quality.receipt import GateRun, execute_gate, load_receipt
from scripts.quality.tests.mutation_test_support import MutationRepo

RECEIPT: Final = Path(__file__).resolve().parents[1] / "receipt.py"


def json_object(value: JsonValue) -> JsonObject:
    if not isinstance(value, dict):
        raise AssertionError
    return value


class ReceiptProcessTests(unittest.TestCase):
    def test_root_omo_symlink_when_cli_gate_starts(self) -> None:
        # Given: repository-root .omo redirects to a directory outside the repository.
        with MutationRepo() as repo:
            outside = repo.root.parent / "outside-receipts"
            outside.mkdir()
            (repo.root / ".omo").symlink_to(outside, target_is_directory=True)
            output = repo.root / ".omo" / "quality" / "escaped.json"
            source = repo.root / "tracked.txt"
            before = source.read_bytes()
            # When: the real receipt CLI is asked to run a source-mutating command.
            completed = subprocess.run(
                (
                    "python3", str(RECEIPT), "--repo", str(repo.root), "--output", str(output),
                    "--phase", "pre-push", "--selected", "api_test,mutation_check", "--gate", "api_test", "--",
                    "python3", "-c",
                    "from pathlib import Path; Path('tracked.txt').write_text('ran\\n'); Path('command-ran').touch()",
                ),
                check=False,
                capture_output=True,
                text=True,
            )
            after = source.read_bytes()
            command_ran = (repo.root / "command-ran").exists()
            outside_receipt = (outside / "quality" / "escaped.json").exists()
            temporary_receipts = list(outside.rglob(".*.tmp"))
        # Then: the boundary fails before command execution or any outside write.
        self.assertEqual(74, completed.returncode)
        self.assertEqual("receipt: invalid receipt field: gate run runtime root\n", completed.stderr)
        self.assertEqual(before, after)
        self.assertFalse(command_ran)
        self.assertFalse(outside_receipt)
        self.assertEqual([], temporary_receipts)

    def test_invalid_root_omo_entry_or_descendant_escape_when_cli_gate_starts(self) -> None:
        for boundary in ("root_file", "descendant_symlink"):
            with self.subTest(boundary=boundary), MutationRepo() as repo:
                outside = repo.root.parent / "outside-boundary"
                outside.mkdir()
                runtime_root = repo.root / ".omo"
                if boundary == "root_file":
                    _ = runtime_root.write_text("not a directory\n", encoding="utf-8")
                    output = runtime_root / "receipt.json"
                else:
                    runtime_root.mkdir()
                    (runtime_root / "quality").symlink_to(outside, target_is_directory=True)
                    output = runtime_root / "quality" / "escaped.json"
                # When: the real CLI receives an invalid runtime boundary.
                completed = subprocess.run(
                    (
                        "python3", str(RECEIPT), "--repo", str(repo.root), "--output", str(output),
                        "--phase", "pre-push", "--selected", "api_test,mutation_check", "--gate", "api_test", "--",
                        "python3", "-c", "from pathlib import Path; Path('command-ran').touch()",
                    ),
                    check=False,
                    capture_output=True,
                    text=True,
                )
                command_ran = (repo.root / "command-ran").exists()
                outside_entries = list(outside.iterdir())
            # Then: neither shape can execute the gate or write outside the repository.
            expected_field = "gate run runtime root" if boundary == "root_file" else "gate run output"
            self.assertEqual(74, completed.returncode)
            self.assertEqual(f"receipt: invalid receipt field: {expected_field}\n", completed.stderr)
            self.assertFalse(command_ran)
            self.assertEqual([], outside_entries)

    def test_interrupted_command_when_sigterm_arrives_after_ready_event(self) -> None:
        # Given: a child command has announced readiness and is blocked on a FIFO.
        with MutationRepo() as repo, tempfile.TemporaryDirectory() as directory:
            temporary = Path(directory)
            ready = temporary / "ready.fifo"
            control = temporary / "control.fifo"
            os.mkfifo(ready)
            os.mkfifo(control)
            ready_descriptor = os.open(ready, os.O_RDWR | os.O_NONBLOCK)
            control_descriptor = os.open(control, os.O_RDWR | os.O_NONBLOCK)
            output = repo.root / ".omo" / "quality" / "interrupted.json"
            environment = os.environ | {"CONTROL_FIFO": os.fspath(control), "READY_FIFO": os.fspath(ready)}
            command = (
                "python3", "-c",
                "import os; open(os.environ['READY_FIFO'], 'w').write('ready\\n'); "
                + "open(os.environ['CONTROL_FIFO']).read()",
            )
            try:
                with subprocess.Popen(
                    (
                        "python3", str(RECEIPT), "--repo", str(repo.root), "--output", str(output),
                        "--phase", "pre-push", "--selected", "api_test,mutation_check", "--gate", "api_test",
                        "--", *command,
                    ),
                    env=environment,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    start_new_session=True,
                ) as process:
                    readable, _, _ = select.select((ready_descriptor,), (), (), 5)
                    self.assertEqual((ready_descriptor,), tuple(readable))
                    self.assertEqual("ready", os.read(ready_descriptor, 64).decode().strip())
                    # When: SIGTERM reaches the receipt driver at the exact ready event.
                    os.kill(process.pid, signal.SIGTERM)
                    stdout, stderr = process.communicate(timeout=5)
                receipt = load_receipt(output)
                temporary_receipts = list(output.parent.glob(f".{output.name}.*.tmp"))
            finally:
                os.close(control_descriptor)
                os.close(ready_descriptor)
        # Then: execution fails closed with a complete interrupted receipt and no temp.
        self.assertEqual(128 + signal.SIGTERM, process.returncode, stderr)
        self.assertEqual("", stdout)
        self.assertEqual("interrupted", receipt["classification"])
        self.assertEqual([{"code": "INTERRUPTED", "gate": "api_test"}], receipt["failures"])
        outcomes = json_object(receipt["outcomes"])
        api_outcome = json_object(outcomes["api_test"])
        self.assertEqual(128 + signal.SIGTERM, api_outcome["exit_code"])
        self.assertEqual([], temporary_receipts)

    def test_long_external_command_when_bounded_timeout_expires(self) -> None:
        # Given: a child command runs beyond the configured gate boundary.
        with MutationRepo() as repo:
            output = repo.root / ".omo" / "quality" / "timeout.json"
            run = GateRun(
                repo.root, output, "pre-push", "planned", (), ("api_test", "mutation_check"), (), "api_test",
                ("python3", "-c", "import time; time.sleep(30)"), 0.05,
            )
            # When: the bounded runner reaches its timeout.
            exit_code = execute_gate(run)
            receipt = load_receipt(output)
        # Then: timeout fails closed and is represented as a command failure.
        self.assertEqual(124, exit_code)
        self.assertEqual([{"code": "COMMAND_FAILED", "gate": "api_test"}], receipt["failures"])

    def test_atomic_write_failure_when_destination_cannot_be_replaced(self) -> None:
        # Given: the requested receipt destination is an existing directory.
        with MutationRepo() as repo:
            output = repo.root / ".omo" / "quality" / "blocked.json"
            output.mkdir(parents=True)
            # When: a passing command reaches atomic replacement.
            completed = subprocess.run(
                (
                    "python3", str(RECEIPT), "--repo", str(repo.root), "--output", str(output),
                    "--phase", "pre-push", "--selected", "api_test,mutation_check", "--gate", "api_test",
                    "--", "python3", "-c", "raise SystemExit(0)",
                ),
                check=False,
                capture_output=True,
                text=True,
            )
            temporary_receipts = list(output.parent.glob(f".{output.name}.*.tmp"))
        # Then: receipt failure is nonzero and no temporary receipt remains.
        self.assertEqual(74, completed.returncode)
        self.assertEqual([], temporary_receipts)


if __name__ == "__main__":
    _ = unittest.main()
