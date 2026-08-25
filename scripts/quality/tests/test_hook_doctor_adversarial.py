# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 -m unittest scripts.quality.tests.test_hook_doctor_adversarial -v

import os
import signal
import subprocess
import tempfile
import unittest
from pathlib import Path

from scripts.quality.tests.hook_doctor_test_support import (
    CANONICAL_HOOKS,
    HOOK_DOCTOR,
    error_codes,
    initialize_repository,
    install_hooks,
    process_exists,
    run,
    run_doctor,
    write_executable,
)


class HookDoctorAdversarialTests(unittest.TestCase):
    def test_hook_fails_when_multiline_redirection_discards_stdin(self) -> None:
        # Given
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            hooks_path = initialize_repository(root / "repo")
            variants = (
                '#!/bin/sh\nexec mise run git:pre-push -- "$@" \\\n  < /dev/null\n',
                '#!/bin/sh\nexec mise run git:pre-push -- "$@" \\\n  <<EOF\nignored\nEOF\n',
            )
            for content in variants:
                with self.subTest(content=content):
                    write_executable(hooks_path / "pre-push", content)

                    # When
                    completed = run_doctor(root / "repo")

                    # Then
                    self.assertNotEqual(0, completed.returncode)
                    self.assertIn("STDIN_REDIRECTED", error_codes(completed))

    def test_hook_fails_when_prior_exec_makes_delegation_unreachable(self) -> None:
        # Given
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            hooks_path = initialize_repository(root / "repo")
            write_executable(
                hooks_path / "pre-push",
                '#!/bin/sh\nexec true\nexec mise run git:pre-push -- "$@"\n',
            )

            # When
            completed = run_doctor(root / "repo")

            # Then
            self.assertNotEqual(0, completed.returncode)
            self.assertIn("DELEGATION_MISMATCH", error_codes(completed))

    def test_output_is_redacted_when_relative_hooks_path_is_configured(self) -> None:
        # Given
        with tempfile.TemporaryDirectory(prefix="relative-secret-marker-") as directory:
            repo = Path(directory) / "repo-secret-marker"
            initialize_repository(repo)
            configured_hooks = repo / "secret-hooks"
            install_hooks(configured_hooks)
            configured = run(("git", "config", "core.hooksPath", "secret-hooks"), cwd=repo)
            self.assertEqual(0, configured.returncode)

            # When
            completed = run_doctor(repo)

            # Then
            self.assertEqual(0, completed.returncode)
            self.assertNotIn(directory, completed.stdout + completed.stderr)
            self.assertIn('"core_hooks_path": "hooks"', completed.stdout)

    def test_output_is_redacted_for_linked_worktree_common_hooks(self) -> None:
        # Given
        with tempfile.TemporaryDirectory(prefix="linked-secret-marker-") as directory:
            root = Path(directory)
            main = root / "main-secret-marker"
            initialize_repository(main)
            for key, value in (("user.name", "Test"), ("user.email", "test@example.invalid")):
                self.assertEqual(0, run(("git", "config", key, value), cwd=main).returncode)
            self.assertEqual(
                0,
                run(
                    ("git", "-c", "core.hooksPath=/dev/null", "commit", "--allow-empty", "-qm", "base"),
                    cwd=main,
                ).returncode,
            )
            linked = root / "linked-secret-marker"
            self.assertEqual(0, run(("git", "worktree", "add", "-q", str(linked)), cwd=main).returncode)

            # When
            completed = run_doctor(linked)

            # Then
            self.assertEqual(0, completed.returncode)
            self.assertNotIn(directory, completed.stdout + completed.stderr)

    def test_doctor_fails_closed_when_git_path_resolution_fails(self) -> None:
        # Given
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            repo = root / "repo"
            initialize_repository(repo)
            binary_dir = root / "bin"
            binary_dir.mkdir()
            write_executable(
                binary_dir / "git",
                "".join(
                    (
                        "#!/bin/sh\ncase \"$*\" in\n",
                        "  *'rev-parse --git-dir'*) printf '.git\\n'; exit 0 ;;\n",
                        "  *'rev-parse --git-path hooks'*) exit 71 ;;\n",
                        "esac\nexit 72\n",
                    )
                ),
            )
            env = {**os.environ, "PATH": f"{binary_dir}{os.pathsep}{os.environ['PATH']}"}

            # When
            completed = run_doctor(repo, env=env)

            # Then
            self.assertNotEqual(0, completed.returncode)
            self.assertIn("HOOKS_PATH_RESOLVE_FAILED", error_codes(completed))

    def test_timeout_terminates_and_reaps_owned_git_process(self) -> None:
        # Given
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            repo = root / "repo"
            initialize_repository(repo)
            binary_dir = root / "bin"
            binary_dir.mkdir()
            pid_path = root / "git.pid"
            write_executable(
                binary_dir / "git",
                f"#!/bin/sh\nprintf '%s\\n' $$ > '{pid_path}'\ntrap 'exit 0' TERM INT\nwhile :; do read value || :; done < /dev/null\n",
            )
            env = {**os.environ, "PATH": f"{binary_dir}{os.pathsep}{os.environ['PATH']}"}

            # When
            completed = run_doctor(repo, env=env, timeout=10)

            # Then
            self.assertNotEqual(0, completed.returncode)
            self.assertIn("GIT_DIR_RESOLVE_FAILED", error_codes(completed))
            pid = int(pid_path.read_text(encoding="utf-8"))
            self.assertFalse(process_exists(pid), f"owned Git process {pid} survived timeout")

    def test_sigterm_preserves_signal_exit_and_reaps_ready_child(self) -> None:
        # Given
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            repo = root / "repo"
            initialize_repository(repo)
            binary_dir = root / "bin"
            binary_dir.mkdir()
            ready = root / "ready.fifo"
            os.mkfifo(ready)
            pid_path = root / "git.pid"
            write_executable(
                binary_dir / "git",
                f"#!/bin/sh\nprintf '%s\\n' $$ > '{pid_path}'\nprintf x > '{ready}'\ntrap 'exit 0' TERM INT\nwhile :; do read value || :; done < /dev/null\n",
            )
            env = {**os.environ, "PATH": f"{binary_dir}{os.pathsep}{os.environ['PATH']}"}
            doctor = subprocess.Popen(
                ("python3", str(HOOK_DOCTOR), "--cwd", str(repo), "--json"),
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
            )
            with ready.open("rb", buffering=0) as readiness:
                self.assertEqual(b"x", readiness.read(1))

            # When
            doctor.send_signal(signal.SIGTERM)
            _ = doctor.communicate(timeout=3)

            # Then
            self.assertEqual(128 + signal.SIGTERM, doctor.returncode)
            pid = int(pid_path.read_text(encoding="utf-8"))
            self.assertFalse(process_exists(pid), f"owned Git process {pid} survived SIGTERM")

    def test_canonical_wrapper_delivers_two_arguments_and_two_stdin_lines(self) -> None:
        # Given
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            hook = root / "pre-push"
            write_executable(hook, CANONICAL_HOOKS["pre-push"])
            capture = root / "capture"
            capture.mkdir()
            argv_path = capture / "argv"
            stdin_path = capture / "stdin"
            (root / "mise.toml").write_text(
                '[tasks."git:pre-push"]\nrun = "python3 capture.py"\n',
                encoding="utf-8",
            )
            (root / "capture.py").write_text(
                "".join(
                    (
                        "import os, sys\n",
                        "from pathlib import Path\n",
                        "capture = Path(os.environ['CAPTURE'])\n",
                        "(capture / 'argv').write_text('\\n'.join(sys.argv[1:]) + '\\n')\n",
                        "(capture / 'stdin').write_text(sys.stdin.read())\n",
                    )
                ),
                encoding="utf-8",
            )
            env = {**os.environ, "CAPTURE": str(capture)}
            payload = "refs/heads/a a refs/heads/a b\nrefs/heads/c c refs/heads/c d\n"

            # When
            completed = subprocess.run(
                (str(hook), "origin", "ssh://example.invalid/repo"),
                cwd=root,
                env=env,
                input=payload,
                capture_output=True,
                text=True,
                check=False,
            )

            # Then
            self.assertEqual(0, completed.returncode)
            self.assertEqual(
                ["origin", "ssh://example.invalid/repo"],
                argv_path.read_text(encoding="utf-8").splitlines(),
            )
            self.assertEqual(payload, stdin_path.read_text(encoding="utf-8"))


if __name__ == "__main__":
    _ = unittest.main()
