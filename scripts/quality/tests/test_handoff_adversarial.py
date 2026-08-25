# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 -m unittest scripts.quality.tests.test_handoff_adversarial -v

from __future__ import annotations

import os
import select
import signal
import subprocess
import tempfile
import unittest
from pathlib import Path

from scripts.quality.tests.handoff_test_support import HANDOFF, JSON_LOAD_OBJECT, HandoffRepo, MARKER_TEMPLATE
from scripts.quality.tests.hook_doctor_test_support import process_exists


class HandoffAdversarialTests(unittest.TestCase):
    def test_sigterm_returns_interruption_and_reaps_blocking_git_child(self) -> None:
        # Given: an owned Git child has announced readiness and is blocked on a FIFO.
        with HandoffRepo() as repo, tempfile.TemporaryDirectory() as directory:
            temporary = Path(directory)
            ready = temporary / "ready.fifo"
            control = temporary / "control.fifo"
            pid_path = temporary / "git.pid"
            git_wrapper = temporary / "git"
            os.mkfifo(ready)
            os.mkfifo(control)
            _ = git_wrapper.write_text(
                "".join((
                    "#!/bin/sh\n",
                    "printf '%s\\n' $$ >\"$PID_PATH\"\n",
                    "printf 'ready\\n' >\"$READY_FIFO\"\n",
                    "trap 'exit 0' TERM INT\n",
                    "IFS= read -r _ <\"$CONTROL_FIFO\"\n",
                    "exec /usr/bin/git \"$@\"\n",
                )),
                encoding="utf-8",
            )
            git_wrapper.chmod(0o755)
            environment = os.environ | {
                "CONTROL_FIFO": os.fspath(control),
                "PATH": f"{temporary}{os.pathsep}{os.environ['PATH']}",
                "PID_PATH": os.fspath(pid_path),
                "READY_FIFO": os.fspath(ready),
            }
            ready_descriptor = os.open(ready, os.O_RDWR | os.O_NONBLOCK)
            control_descriptor = os.open(control, os.O_RDWR | os.O_NONBLOCK)
            child_pid: int | None = None
            child_survived = True
            stdout = ""
            stderr = ""
            process = subprocess.Popen(
                ("python3", str(HANDOFF), "--json"),
                cwd=repo.work,
                env=environment,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            try:
                assert process.stdin is not None
                _ = process.stdin.write(repo.main_record(repo.base))
                process.stdin.close()
                process.stdin = None
                readable, _, _ = select.select((ready_descriptor,), (), (), 5)
                self.assertEqual((ready_descriptor,), tuple(readable))
                self.assertEqual("ready", os.read(ready_descriptor, 64).decode().strip())
                child_pid = int(pid_path.read_text(encoding="utf-8"))
                self.assertTrue(process_exists(child_pid))

                # When: SIGTERM reaches handoff only after the child is active.
                process.send_signal(signal.SIGTERM)
                stdout, stderr = process.communicate(timeout=5)
                child_survived = process_exists(child_pid)
            finally:
                if process.poll() is None:
                    process.kill()
                    _ = process.communicate(timeout=5)
                if child_pid is not None and process_exists(child_pid):
                    try:
                        os.killpg(child_pid, signal.SIGKILL)
                    except ProcessLookupError:
                        try:
                            os.kill(child_pid, signal.SIGKILL)
                        except ProcessLookupError:
                            child_survived = False
                    except PermissionError:
                        os.kill(child_pid, signal.SIGKILL)
                os.close(control_descriptor)
                os.close(ready_descriptor)

        # Then: the interruption result survives and no owned child remains.
        self.assertEqual(128 + signal.SIGTERM, process.returncode, stderr)
        self.assertEqual("HANDOFF_INTERRUPTED", JSON_LOAD_OBJECT(stdout)["classification"])
        self.assertFalse(child_survived, f"owned Git process {child_pid} survived SIGTERM")

    def test_fails_closed_when_git_subprocess_times_out(self) -> None:
        # Given: Git reports the adapter's bounded-command timeout code.
        with HandoffRepo() as repo, tempfile.TemporaryDirectory() as directory:
            fake_git = Path(directory) / "git"
            _ = fake_git.write_text("#!/bin/sh\nexit 124\n", encoding="utf-8")
            fake_git.chmod(0o755)
            environment = dict(os.environ)
            environment["PATH"] = f"{directory}{os.pathsep}{environment['PATH']}"

            # When: the handoff gate invokes Git.
            completed = repo.run(repo.main_record(repo.base), environment)

        # Then: timeout cannot become malformed-input or success output.
        self.assertEqual(1, completed.returncode)
        self.assertEqual("HANDOFF_GIT_UNAVAILABLE", repo.json(completed)["classification"])

    def test_rejects_malformed_second_ref_record(self) -> None:
        # Given: a valid feature update is followed by malformed input.
        with HandoffRepo() as repo:
            tip = repo.commit("feature.txt", "feature\n")
            stream = repo.feature_record(tip, "feature/topic") + "malformed\n"

            # When: the complete stream is parsed.
            completed = repo.run(stream)

        # Then: malformed input blocks rather than producing a feature skip.
        self.assertEqual(2, completed.returncode)
        self.assertEqual("MALFORMED_INPUT", repo.json(completed)["classification"])

    def test_main_blob_wins_when_feature_blob_has_valid_marker(self) -> None:
        # Given: a feature blob has the right marker but the pushed main blob does not.
        with HandoffRepo() as repo:
            _ = repo.git("checkout", "--quiet", "-b", "feature/marker")
            feature_tip = repo.commit_handoff(MARKER_TEMPLATE.format(oid=repo.base))
            _ = repo.git("checkout", "--quiet", "main")
            main_tip = repo.commit_handoff("missing marker\n")
            stream = repo.feature_record(feature_tip, "feature/marker") + repo.main_record(main_tip)

            # When: both refs are checked.
            completed = repo.run(stream)

        # Then: the marker in the wrong pushed blob cannot satisfy main.
        self.assertEqual(1, completed.returncode)
        self.assertEqual("HANDOFF_MARKER_MISSING", repo.json(completed)["classification"])

    def test_rejects_missing_pushed_blob_without_reading_worktree(self) -> None:
        # Given: the pushed commit has no docs/handoff.md blob while the worktree does.
        with HandoffRepo() as repo:
            tip = repo.commit("main.txt", "main update\n")
            target = repo.work / "docs/handoff.md"
            target.parent.mkdir(parents=True, exist_ok=True)
            _ = target.write_text(MARKER_TEMPLATE.format(oid=repo.base), encoding="utf-8")

            # When: the committed tip is checked.
            completed = repo.run(repo.main_record(tip))

        # Then: object lookup fails closed with no filesystem fallback.
        self.assertEqual(1, completed.returncode)
        self.assertEqual("HANDOFF_MARKER_MISSING", repo.json(completed)["classification"])


if __name__ == "__main__":
    _ = unittest.main()
