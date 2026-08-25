# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 -m unittest scripts.quality.tests.test_receipt -v

from __future__ import annotations

import json
import os
import signal
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from types import FrameType
from unittest.mock import patch

from scripts.quality.contracts.json_boundary import JsonObject, JsonValue
from scripts.quality.receipt import (
    GateRun,
    ReceiptValidationError,
    execute_gate,
    load_receipt,
    write_receipt,
)
from scripts.quality.tests.mutation_test_support import MutationRepo


def json_object(value: JsonValue) -> JsonObject:
    if not isinstance(value, dict):
        raise AssertionError
    return value


def json_list(value: JsonValue) -> list[JsonValue]:
    if not isinstance(value, list):
        raise AssertionError
    return value


def valid_receipt() -> JsonObject:
    return {
        "schema_version": 1,
        "phase": "pre-push",
        "classification": "planned",
        "refs": [],
        "plan": {"selected": ["contract_validation"], "skipped": ["secret_scan"]},
        "outcomes": {
            "contract_validation": {"status": "pass", "exit_code": 0},
            "secret_scan": {"status": "skipped", "exit_code": 0},
        },
        "failures": [],
        "mutation": {"before": "a" * 64, "after": "a" * 64},
        "result": "pass",
        "complete": True,
    }


class AtomicReceiptTests(unittest.TestCase):
    def test_atomic_receipt_when_valid_contract_is_written(self) -> None:
        # Given: a same-directory ignored receipt destination.
        with MutationRepo() as repo:
            destination = repo.root / ".omo" / "quality" / "receipt.json"
            # When: a schema-conforming receipt is written atomically.
            write_receipt(destination, valid_receipt())
            loaded = load_receipt(destination)
            temporary = list(destination.parent.glob(f".{destination.name}.*.tmp"))
        # Then: strict loading succeeds and no temporary receipt remains.
        self.assertEqual("pass", loaded["result"])
        self.assertEqual([], temporary)

    def test_corrupt_or_duplicate_json_when_strictly_loaded(self) -> None:
        for raw in (b'{"schema_version":1', b'{"schema_version":1,"schema_version":1}'):
            with self.subTest(raw=raw), tempfile.TemporaryDirectory() as directory:
                path = Path(directory) / "receipt.json"
                _ = path.write_bytes(raw)
                with self.assertRaises((ReceiptValidationError, json.JSONDecodeError)):
                    _ = load_receipt(path)

    def test_concurrent_atomic_replace_when_writers_race(self) -> None:
        with MutationRepo() as repo:
            destination = repo.root / ".omo" / "quality" / "receipt.json"
            receipts: list[JsonObject] = []
            for classification in ("planned", "tree_noop"):
                receipt = valid_receipt()
                receipt["classification"] = classification
                receipts.append(receipt)
            # When: independent writers replace the same receipt concurrently.
            def write(value: JsonObject) -> None:
                write_receipt(destination, value)

            with ThreadPoolExecutor(max_workers=2) as pool:
                _ = list(pool.map(write, receipts))
            loaded = load_receipt(destination)
            temporary = list(destination.parent.glob(f".{destination.name}.*.tmp"))
        # Then: readers observe one complete contract-valid receipt.
        self.assertIn(loaded["classification"], ("planned", "tree_noop"))
        self.assertEqual([], temporary)

    def test_atomic_write_failure_or_interrupt_when_replace_does_not_complete(self) -> None:
        for failure in (OSError("replace failed"), KeyboardInterrupt()):
            with self.subTest(failure=type(failure).__name__), MutationRepo() as repo:
                destination = repo.root / ".omo" / "quality" / "receipt.json"
                with patch("scripts.quality.receipt.os.replace", side_effect=failure):
                    with self.assertRaises(type(failure)):
                        write_receipt(destination, valid_receipt())
                self.assertFalse(destination.exists())
                self.assertEqual([], list(destination.parent.glob(f".{destination.name}.*.tmp")))


class ReceiptContractTests(unittest.TestCase):
    def test_no_ref_and_not_run_receipts_when_written(self) -> None:
        for classification, result in (("no_ref_updates", "pass"), ("planned", "not_run")):
            with self.subTest(classification=classification, result=result), tempfile.TemporaryDirectory() as directory:
                receipt = valid_receipt()
                receipt["classification"] = classification
                receipt["result"] = result
                receipt["outcomes"] = {"contract_validation": {"status": result, "exit_code": 0}, "secret_scan": {"status": "skipped", "exit_code": 0}}
                path = Path(directory) / "receipt.json"
                write_receipt(path, receipt)
                self.assertEqual(result, load_receipt(path)["result"])

    def test_invalid_labels_or_status_exit_combinations_when_written(self) -> None:
        mutants: list[JsonObject] = []
        duplicate = valid_receipt()
        duplicate["plan"] = {"selected": ["contract_validation", "contract_validation"], "skipped": ["secret_scan"]}
        mutants.append(duplicate)
        invalid = valid_receipt()
        invalid["plan"] = {"selected": ["invalid_label"], "skipped": []}
        mutants.append(invalid)
        pass_with_failure = valid_receipt()
        pass_with_failure["failures"] = [{"code": "COMMAND_FAILED", "gate": "contract_validation"}]
        mutants.append(pass_with_failure)
        failed_with_zero = valid_receipt()
        failed_with_zero["result"] = "failed"
        failed_with_zero["failures"] = [{"code": "COMMAND_FAILED", "gate": "contract_validation"}]
        failed_with_zero["outcomes"] = {"contract_validation": {"status": "failed", "exit_code": 0}, "secret_scan": {"status": "skipped", "exit_code": 0}}
        mutants.append(failed_with_zero)
        stale_version = valid_receipt()
        stale_version["schema_version"] = 2
        mutants.append(stale_version)
        corrupt_checksum = valid_receipt()
        corrupt_checksum["mutation"] = {"before": "bad", "after": "a" * 64}
        mutants.append(corrupt_checksum)
        invalid_status = valid_receipt()
        invalid_status["outcomes"] = {"contract_validation": {"status": "unknown", "exit_code": 0}, "secret_scan": {"status": "skipped", "exit_code": 0}}
        mutants.append(invalid_status)
        for receipt in mutants:
            with self.subTest(receipt=receipt), tempfile.TemporaryDirectory() as directory:
                with self.assertRaises(ReceiptValidationError):
                    write_receipt(Path(directory) / "receipt.json", receipt)

    def test_command_exit_23_plus_mutation_when_gate_runs(self) -> None:
        sentinel = "NOD_TEST_SECRET_DO_NOT_PERSIST"
        with MutationRepo() as repo:
            output = repo.root / ".omo" / "quality" / "receipt.json"
            command = (
                "python3", "-c",
                "from pathlib import Path; import sys; Path('tracked.txt').write_text('mutated\\n'); "
                + f"sys.stderr.write('{sentinel}\\n'); raise SystemExit(23)",
            )
            # When: one child both fails and mutates tracked source.
            exit_code = execute_gate(GateRun(repo.root, output, "pre-push", "planned", (), ("api_test", "mutation_check"), (), "api_test", command))
            raw = output.read_text(encoding="utf-8")
            receipt = load_receipt(output)
        # Then: both failures survive without command stderr or secret leakage.
        self.assertNotEqual(0, exit_code)
        failures = json_list(receipt["failures"])
        outcomes = json_object(receipt["outcomes"])
        failure_codes = [json_object(item)["code"] for item in failures]
        api_outcome = json_object(outcomes["api_test"])
        self.assertEqual(["COMMAND_FAILED", "MUTATION_DETECTED"], failure_codes)
        self.assertEqual(23, api_outcome.get("exit_code"))
        self.assertNotIn(sentinel, raw)
        self.assertNotIn("stderr", raw)

    def test_signal_interrupt_when_atomic_write_is_in_progress(self) -> None:
        # Given: SIGTERM is delivered at the atomic replacement seam.
        with MutationRepo() as repo:
            destination = repo.root / ".omo" / "quality" / "receipt.json"
            previous = signal.getsignal(signal.SIGTERM)

            def interrupt(_source: str | os.PathLike[str], _destination: str | os.PathLike[str]) -> None:
                os.kill(os.getpid(), signal.SIGTERM)

            def raise_interrupt(signum: int, _frame: FrameType | None) -> None:
                raise KeyboardInterrupt(signum)

            _ = signal.signal(signal.SIGTERM, raise_interrupt)
            try:
                with patch("scripts.quality.receipt.os.replace", side_effect=interrupt):
                    with self.assertRaises(KeyboardInterrupt):
                        write_receipt(destination, valid_receipt())
            finally:
                _ = signal.signal(signal.SIGTERM, previous)
        # Then: no final or temporary receipt is left behind.
        self.assertFalse(destination.exists())
        self.assertEqual([], list(destination.parent.glob(f".{destination.name}.*.tmp")))


if __name__ == "__main__":
    _ = unittest.main()
