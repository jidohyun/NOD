# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 -m unittest scripts.quality.tests.test_hook_doctor -v

import subprocess
import tempfile
import unittest
from pathlib import Path

from scripts.quality.tests.hook_doctor_test_support import (
    CANONICAL_HOOKS,
    HOOK_DOCTOR,
    error_codes,
    initialize_repository,
    run,
    run_doctor,
    write_executable,
)


class HookDoctorTests(unittest.TestCase):
    def test_all_hooks_are_valid_when_canonical_wrappers_are_installed(self) -> None:
        # Given
        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory) / "repo"
            hooks_path = initialize_repository(repo)
            before = self._hook_snapshot(hooks_path)

            # When
            completed = run_doctor(repo)

            # Then
            self.assertEqual(0, completed.returncode)
            self.assertIn('"status": "pass"', completed.stdout)
            self.assertEqual(3, completed.stdout.count('"status": "valid"'))
            self.assertEqual(before, self._hook_snapshot(hooks_path))

    def test_missing_hook_fails_without_repairing_it(self) -> None:
        # Given
        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory) / "repo"
            hooks_path = initialize_repository(repo)
            (hooks_path / "pre-push").unlink()

            # When
            completed = run_doctor(repo)

            # Then
            self.assertNotEqual(0, completed.returncode)
            self.assertIn("HOOK_NOT_FOUND", error_codes(completed))
            self.assertFalse((hooks_path / "pre-push").exists())

    def test_non_executable_hook_fails_without_changing_mode(self) -> None:
        # Given
        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory) / "repo"
            hooks_path = initialize_repository(repo)
            hook = hooks_path / "pre-commit"
            hook.chmod(0o644)

            # When
            completed = run_doctor(repo)

            # Then
            self.assertNotEqual(0, completed.returncode)
            self.assertIn("NOT_EXECUTABLE", error_codes(completed))
            self.assertEqual(0o644, hook.stat().st_mode & 0o777)

    def test_wrong_target_fails_with_delegation_mismatch(self) -> None:
        # Given
        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory) / "repo"
            hooks_path = initialize_repository(repo)
            write_executable(hooks_path / "pre-push", '#!/bin/sh\nexec mise run git:pre-commit -- "$@"\n')

            # When
            completed = run_doctor(repo)

            # Then
            self.assertNotEqual(0, completed.returncode)
            self.assertIn("DELEGATION_MISMATCH", error_codes(completed))

    def test_missing_commit_message_argument_keeps_stable_classification(self) -> None:
        # Given
        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory) / "repo"
            hooks_path = initialize_repository(repo)
            write_executable(hooks_path / "commit-msg", "#!/bin/sh\nexec mise run git:commit-msg\n")

            # When
            completed = run_doctor(repo)

            # Then
            self.assertNotEqual(0, completed.returncode)
            self.assertIn("ARG_FORWARDING_MISSING", error_codes(completed))

    def test_missing_pre_push_arguments_keeps_stable_classification(self) -> None:
        # Given
        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory) / "repo"
            hooks_path = initialize_repository(repo)
            write_executable(hooks_path / "pre-push", "#!/bin/sh\nexec mise run git:pre-push\n")

            # When
            completed = run_doctor(repo)

            # Then
            self.assertNotEqual(0, completed.returncode)
            self.assertIn("ARG_FORWARDING_MISSING", error_codes(completed))

    def test_redirection_keeps_stable_classification(self) -> None:
        # Given
        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory) / "repo"
            hooks_path = initialize_repository(repo)
            write_executable(
                hooks_path / "pre-push",
                '#!/bin/sh\nexec mise run git:pre-push -- "$@" </dev/null\n',
            )

            # When
            completed = run_doctor(repo)

            # Then
            self.assertNotEqual(0, completed.returncode)
            self.assertIn("STDIN_REDIRECTED", error_codes(completed))

    def test_comments_extra_commands_and_control_flow_are_rejected(self) -> None:
        variants = (
            '#!/bin/sh\n# comment\nexec mise run git:pre-push -- "$@"\n',
            '#!/bin/sh\necho extra\nexec mise run git:pre-push -- "$@"\n',
            '#!/bin/sh\nif true; then exec mise run git:pre-push -- "$@"; fi\n',
        )
        for content in variants:
            with self.subTest(content=content), tempfile.TemporaryDirectory() as directory:
                # Given
                repo = Path(directory) / "repo"
                hooks_path = initialize_repository(repo)
                write_executable(hooks_path / "pre-push", content)

                # When
                completed = run_doctor(repo)

                # Then
                self.assertNotEqual(0, completed.returncode)
                self.assertIn("DELEGATION_MISMATCH", error_codes(completed))

    def test_malformed_utf8_fails_with_read_classification(self) -> None:
        # Given
        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory) / "repo"
            hooks_path = initialize_repository(repo)
            hook = hooks_path / "pre-push"
            hook.write_bytes(b"#!/bin/sh\n\xff\n")
            hook.chmod(0o755)

            # When
            completed = run_doctor(repo)

            # Then
            self.assertNotEqual(0, completed.returncode)
            self.assertIn("HOOK_READ_FAILED", error_codes(completed))

    def test_missing_repository_fails_with_git_dir_classification(self) -> None:
        # Given
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)

            # When
            completed = run_doctor(root)

            # Then
            self.assertNotEqual(0, completed.returncode)
            self.assertIn("GIT_DIR_RESOLVE_FAILED", error_codes(completed))

    def test_missing_configured_hook_tree_fails_without_path_disclosure(self) -> None:
        # Given
        with tempfile.TemporaryDirectory(prefix="configured-secret-marker-") as directory:
            repo = Path(directory) / "repo"
            initialize_repository(repo)
            self.assertEqual(0, run(("git", "config", "core.hooksPath", "missing-secret-hooks"), cwd=repo).returncode)

            # When
            completed = run_doctor(repo)

            # Then
            self.assertNotEqual(0, completed.returncode)
            self.assertIn("HOOK_NOT_FOUND", error_codes(completed))
            self.assertNotIn(directory, completed.stdout + completed.stderr)

    def test_repeated_missing_hook_reports_are_byte_stable(self) -> None:
        # Given
        with tempfile.TemporaryDirectory() as directory:
            repo = Path(directory) / "repo"
            hooks_path = initialize_repository(repo)
            (hooks_path / "commit-msg").unlink()

            # When
            first = run_doctor(repo)
            second = run_doctor(repo)

            # Then
            self.assertEqual(first.returncode, second.returncode)
            self.assertEqual(first.stdout, second.stdout)
            self.assertEqual(first.stderr, second.stderr)

    def test_invalid_cli_option_exits_two(self) -> None:
        # Given / When
        completed = subprocess.run(
            ("python3", str(HOOK_DOCTOR), "--unknown"),
            capture_output=True,
            text=True,
            check=False,
        )

        # Then
        self.assertEqual(2, completed.returncode)

    @staticmethod
    def _hook_snapshot(hooks_path: Path) -> tuple[tuple[str, bytes, int], ...]:
        return tuple(
            (name, (hooks_path / name).read_bytes(), (hooks_path / name).stat().st_mode & 0o777)
            for name in CANONICAL_HOOKS
        )


if __name__ == "__main__":
    _ = unittest.main()
