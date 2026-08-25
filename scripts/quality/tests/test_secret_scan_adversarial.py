# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 -m unittest scripts.quality.tests.test_secret_scan_adversarial -v

from __future__ import annotations

import json
import os
import select
import signal
import subprocess
import tempfile
import unittest
from pathlib import Path

from scripts.quality.contracts.json_boundary import load_json_bytes
from scripts.quality.receipt import GateRun, execute_gate, load_receipt
from scripts.quality.tests.secret_scan_test_support import SCANNER, SecretScanRepo


class SecretScanAdversarialTests(unittest.TestCase):
    def test_wrong_checksum_when_lock_is_mutated(self) -> None:
        # Given
        with SecretScanRepo() as repo, tempfile.TemporaryDirectory() as directory:
            tip = repo.commit()
            source = (SCANNER.parent / "trufflehog.lock").read_text(encoding="utf-8")
            lock = Path(directory) / "wrong.lock"
            _ = lock.write_text(source.replace("ad0a99bd48d6df80eabab24d11d0fd771e245fc55ed347f943cafb5e5f497c5c", "0" * 64), encoding="utf-8")
            # When
            completed = repo.scan(repo.record(tip), extra=("--lock", os.fspath(lock)))
        # Then
        self.assertEqual(69, completed.returncode)
        self.assertEqual("SCANNER_LOCK_INVALID", repo.json(completed)["classification"])

    def test_malformed_second_ref_when_first_ref_is_valid(self) -> None:
        # Given
        with SecretScanRepo() as repo:
            tip = repo.commit()
            # When
            completed = repo.scan(repo.record(tip) + "malformed second line\n")
        # Then
        self.assertEqual(2, completed.returncode)
        self.assertEqual("MALFORMED_INPUT", repo.json(completed)["classification"])

    def test_ignored_environment_file_when_history_is_clean(self) -> None:
        # Given
        with SecretScanRepo() as repo:
            tip = repo.commit()
            _ = (repo.work / ".gitignore").write_text(".env\n", encoding="utf-8")
            _ = (repo.work / ".env").write_text("ignored working tree value\n", encoding="utf-8")
            # When
            completed = repo.scan(repo.record(tip))
        # Then
        self.assertEqual(0, completed.returncode)
        self.assertEqual("CLEAN", repo.json(completed)["classification"])

    def test_add_then_delete_when_earlier_outgoing_commit_has_finding(self) -> None:
        # Given
        sentinel = "NOD_" + "HISTORY_VALUE_" + "REDACT_ME"
        with SecretScanRepo() as repo:
            secret_commit = repo.commit("temporary.txt", sentinel + "\n")
            (repo.work / "temporary.txt").unlink()
            _ = repo.git("add", "-u")
            _ = repo.git("commit", "--quiet", "-m", "test: delete temporary value")
            tip = repo.git("rev-parse", "HEAD")
            environment = repo.environment("finding")
            environment.update({"NOD_TRUFFLEHOG_STUB_SECRET": sentinel, "NOD_TRUFFLEHOG_STUB_COMMIT": secret_commit})
            # When
            completed = repo.scan(repo.record(tip), environment=environment)
        # Then
        self.assertEqual(1, completed.returncode)
        findings = repo.json(completed)["findings"]
        if not isinstance(findings, list) or not findings or not isinstance(findings[0], dict):
            raise AssertionError
        self.assertEqual(secret_commit, findings[0].get("commit"))
        self.assertNotIn(sentinel, completed.stdout + completed.stderr)

    def test_remote_base_finding_when_not_in_outgoing_range(self) -> None:
        # Given: the controlled scanner reports no finding for the base excluded by --since-commit.
        with SecretScanRepo() as repo, tempfile.TemporaryDirectory() as directory:
            tip = repo.commit()
            capture = Path(directory) / "arguments.jsonl"
            environment = repo.environment("finding")
            environment.update({
                "NOD_TRUFFLEHOG_STUB_CAPTURE": os.fspath(capture),
                "NOD_TRUFFLEHOG_STUB_COMMIT": repo.base,
            })
            # When
            completed = repo.scan(repo.record(tip), environment=environment)
            arguments_value = load_json_bytes(capture.read_bytes().splitlines()[0])
            if not isinstance(arguments_value, list) or not all(isinstance(item, str) for item in arguments_value):
                raise AssertionError
            arguments = [item for item in arguments_value if isinstance(item, str)]
        # Then
        self.assertEqual(0, completed.returncode)
        self.assertEqual("CLEAN", repo.json(completed)["classification"])
        self.assertEqual(repo.base, arguments[arguments.index("--since-commit") + 1])

    def test_scanner_signal_when_child_terminates_abnormally(self) -> None:
        # Given / When
        with SecretScanRepo() as repo:
            tip = repo.commit()
            completed = repo.scan(repo.record(tip), "scanner-signal")
        # Then
        self.assertEqual(143, completed.returncode)
        self.assertEqual("SCANNER_SIGNALLED", repo.json(completed)["classification"])

    def test_signal_interruption_when_scanner_is_running(self) -> None:
        # Given: a readiness FIFO is subscribed before the scanner starts.
        with SecretScanRepo() as repo, tempfile.TemporaryDirectory() as directory:
            tip = repo.commit()
            ready = Path(directory) / "ready"
            blocked = Path(directory) / "blocked"
            os.mkfifo(ready)
            os.mkfifo(blocked)
            ready_descriptor = os.open(ready, os.O_RDONLY | os.O_NONBLOCK)
            environment = repo.environment("signal")
            environment.update({"NOD_TRUFFLEHOG_STUB_READY": os.fspath(ready), "NOD_TRUFFLEHOG_STUB_FIFO": os.fspath(blocked)})
            process = subprocess.Popen(
                ("python3", os.fspath(SCANNER), "--json"), cwd=repo.work,
                stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                text=True, env=environment,
            )
            assert process.stdin is not None
            _ = process.stdin.write(repo.record(tip))
            process.stdin.close()
            process.stdin = None
            # When: await the exact child-ready event, then interrupt the adapter.
            readable, _, _ = select.select((ready_descriptor,), (), (), 5)
            self.assertEqual([ready_descriptor], readable)
            self.assertEqual(b"ready\n", os.read(ready_descriptor, 64))
            os.kill(process.pid, signal.SIGTERM)
            stdout, stderr = process.communicate(timeout=5)
            os.close(ready_descriptor)
        # Then
        self.assertEqual(143, process.returncode, stderr)
        self.assertEqual("INTERRUPTED", json.loads(stdout)["classification"])

    def test_receipt_preserves_failure_without_secret_or_stderr(self) -> None:
        # Given
        sentinel = "NOD_" + "RECEIPT_VALUE_" + "REDACT_ME"
        with SecretScanRepo() as repo:
            tip = repo.commit(".gitignore", ".omo/\n")
            input_path = repo.work / ".omo" / "refs.txt"
            input_path.parent.mkdir()
            _ = input_path.write_text(repo.record(tip), encoding="utf-8")
            output = repo.work / ".omo" / "receipt.json"
            environment = repo.environment("finding")
            environment.update({"NOD_TRUFFLEHOG_STUB_SECRET": sentinel, "NOD_TRUFFLEHOG_STUB_COMMIT": tip})
            command = ("env", *(f"{name}={value}" for name, value in environment.items()), "python3", os.fspath(SCANNER), "--json", "--input", os.fspath(input_path))
            run = GateRun(
                repo.work, output, "pre-push", "planned",
                ({"remote_ref": "refs/heads/main", "remote_oid": repo.base, "status": "not_run"},),
                ("secret_scan", "mutation_check"), (), "secret_scan", command,
            )
            # When
            exit_code = execute_gate(run)
            raw = output.read_text(encoding="utf-8")
            receipt = load_receipt(output)
        # Then
        self.assertEqual(1, exit_code)
        self.assertEqual([{"code": "COMMAND_FAILED", "gate": "secret_scan"}], receipt["failures"])
        self.assertNotIn(sentinel, raw)
        self.assertNotIn("stderr", raw)

    def test_multi_ref_invocations_use_distinct_tips(self) -> None:
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
            invocations: list[list[str]] = []
            for line in capture.read_bytes().splitlines():
                value = load_json_bytes(line)
                if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
                    raise AssertionError
                invocations.append([item for item in value if isinstance(item, str)])
        # Then
        self.assertEqual(0, completed.returncode)
        self.assertEqual({first, second}, {arguments[arguments.index("--branch") + 1] for arguments in invocations})


if __name__ == "__main__":
    _ = unittest.main()
