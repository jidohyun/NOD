# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 -m unittest scripts.quality.tests.test_secret_scan -v

from __future__ import annotations

import os
import subprocess
import tempfile
import unittest
from pathlib import Path

from scripts.quality.contracts.json_boundary import load_json_bytes
from scripts.quality.tests.secret_scan_test_support import SecretScanRepo


class SecretScanTests(unittest.TestCase):
    def test_clean_history_when_update_has_outgoing_commit(self) -> None:
        # Given
        with SecretScanRepo() as repo:
            tip = repo.commit()
            # When
            completed = repo.scan(repo.record(tip))
        # Then
        self.assertEqual(0, completed.returncode, completed.stderr)
        self.assertEqual("CLEAN", repo.json(completed)["classification"])

    def test_commit_range_when_scanner_is_invoked(self) -> None:
        # Given
        with SecretScanRepo() as repo, tempfile.TemporaryDirectory() as directory:
            tip = repo.commit()
            capture = Path(directory) / "arguments.json"
            environment = repo.environment()
            environment["NOD_TRUFFLEHOG_STUB_CAPTURE"] = os.fspath(capture)
            # When
            completed = repo.scan(repo.record(tip), environment=environment)
            parsed_arguments = load_json_bytes(capture.read_bytes())
            if not isinstance(parsed_arguments, list) or not all(isinstance(argument, str) for argument in parsed_arguments):
                raise AssertionError
            arguments = [argument for argument in parsed_arguments if isinstance(argument, str)]
        # Then
        self.assertEqual(0, completed.returncode)
        self.assertIn("git", arguments)
        self.assertIn("--since-commit", arguments)
        self.assertEqual(repo.base, arguments[arguments.index("--since-commit") + 1])
        self.assertEqual(tip, arguments[arguments.index("--branch") + 1])
        self.assertFalse(any(argument in {"filesystem", "."} for argument in arguments))

    def test_finding_when_scanner_reports_secret(self) -> None:
        # Given
        sentinel = "NOD_" + "TEST_VALUE_" + "REDACT_ME"
        with SecretScanRepo() as repo:
            tip = repo.commit()
            environment = repo.environment("finding")
            environment.update({
                "NOD_TRUFFLEHOG_STUB_SECRET": sentinel,
                "NOD_TRUFFLEHOG_STUB_COMMIT": tip,
            })
            # When
            completed = repo.scan(repo.record(tip), environment=environment)
        # Then
        self.assertEqual(1, completed.returncode)
        result = repo.json(completed)
        self.assertEqual("SECRET_FOUND", result["classification"])
        self.assertEqual([{"commit": tip, "path": "fixture.txt", "rule": "FixtureDetector"}], result["findings"])
        self.assertNotIn(sentinel, completed.stdout + completed.stderr)

    def test_malformed_output_when_scanner_exits_zero(self) -> None:
        # Given / When
        with SecretScanRepo() as repo:
            tip = repo.commit()
            completed = repo.scan(repo.record(tip), "malformed")
        # Then
        self.assertEqual(74, completed.returncode)
        self.assertEqual("SCANNER_OUTPUT_INVALID", repo.json(completed)["classification"])
        self.assertNotIn("not-json", completed.stdout + completed.stderr)

    def test_scanner_error_when_nonzero_is_not_findings_exit(self) -> None:
        # Given
        sentinel = "NOD_" + "SCANNER_ERROR_" + "REDACT_ME"
        with SecretScanRepo() as repo:
            tip = repo.commit()
            environment = repo.environment("error")
            environment["NOD_TRUFFLEHOG_STUB_SECRET"] = sentinel
            # When
            completed = repo.scan(repo.record(tip), environment=environment)
        # Then
        self.assertEqual(74, completed.returncode)
        self.assertEqual("SCANNER_ERROR", repo.json(completed)["classification"])
        self.assertNotIn(sentinel, completed.stdout + completed.stderr)

    def test_timeout_when_scanner_does_not_finish(self) -> None:
        # Given
        with SecretScanRepo() as repo, tempfile.TemporaryDirectory() as directory:
            tip = repo.commit()
            ready = Path(directory) / "ready"
            fifo = Path(directory) / "blocked"
            os.mkfifo(fifo)
            environment = repo.environment("timeout")
            environment.update({"NOD_TRUFFLEHOG_STUB_READY": os.fspath(ready), "NOD_TRUFFLEHOG_STUB_FIFO": os.fspath(fifo)})
            # When
            completed = repo.scan(repo.record(tip), extra=("--timeout", "0.2"), environment=environment)
        # Then
        self.assertEqual(124, completed.returncode)
        self.assertEqual("SCANNER_TIMEOUT", repo.json(completed)["classification"])

    def test_missing_binary_when_path_has_no_trufflehog(self) -> None:
        # Given
        with SecretScanRepo() as repo:
            tip = repo.commit()
            environment = repo.environment()
            environment["PATH"] = "/usr/bin:/bin"
            # When
            completed = repo.scan(repo.record(tip), environment=environment)
        # Then
        self.assertEqual(69, completed.returncode)
        self.assertEqual("SCANNER_UNAVAILABLE", repo.json(completed)["classification"])

    def test_wrong_version_when_binary_does_not_match_lock(self) -> None:
        # Given
        with SecretScanRepo() as repo:
            tip = repo.commit()
            environment = repo.environment()
            environment["NOD_TRUFFLEHOG_STUB_VERSION"] = "trufflehog 3.96.0"
            # When
            completed = repo.scan(repo.record(tip), environment=environment)
        # Then
        self.assertEqual(69, completed.returncode)
        self.assertEqual("SCANNER_VERSION_INVALID", repo.json(completed)["classification"])

    def test_deletion_and_no_ref_when_nothing_is_outgoing(self) -> None:
        # Given
        with SecretScanRepo() as repo:
            deletion = repo.record(repo.zero, "(delete)")
            # When
            no_ref = repo.scan("")
            deleted = repo.scan(deletion)
        # Then
        self.assertEqual((0, "NO_REF_UPDATES"), (no_ref.returncode, repo.json(no_ref)["classification"]))
        self.assertEqual((0, "NO_OUTGOING_OBJECTS"), (deleted.returncode, repo.json(deleted)["classification"]))

    def test_new_ref_when_ancestry_is_unavailable(self) -> None:
        # Given
        with SecretScanRepo() as repo:
            _ = subprocess.run(("git", "checkout", "--quiet", "--orphan", "orphan"), cwd=repo.work, check=True)
            _ = subprocess.run(("git", "rm", "--quiet", "-rf", "."), cwd=repo.work, check=True)
            tip = repo.commit("orphan.txt")
            record = repo.record(tip, "refs/heads/orphan", "refs/heads/orphan", repo.zero)
            # When
            completed = repo.scan(record)
        # Then
        self.assertEqual(2, completed.returncode)
        self.assertEqual("HISTORY_BASE_UNAVAILABLE", repo.json(completed)["classification"])

    def test_multi_ref_when_each_ref_is_scanned_in_isolation(self) -> None:
        # Given
        with SecretScanRepo() as repo, tempfile.TemporaryDirectory() as directory:
            first = repo.commit("first.txt")
            _ = subprocess.run(("git", "checkout", "--quiet", "-b", "second", repo.base), cwd=repo.work, check=True)
            second = repo.commit("second.txt")
            capture = Path(directory) / "arguments.jsonl"
            environment = repo.environment()
            environment["NOD_TRUFFLEHOG_STUB_CAPTURE"] = os.fspath(capture)
            stream = repo.record(first) + repo.record(second, "refs/heads/second", "refs/heads/second", repo.zero)
            # When
            completed = repo.scan(stream, environment=environment)
        # Then
        self.assertEqual(0, completed.returncode, completed.stderr)
        refs = repo.json(completed)["refs"]
        if not isinstance(refs, list):
            raise AssertionError
        self.assertEqual(2, len(refs))


if __name__ == "__main__":
    _ = unittest.main()
