# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 -m unittest scripts.quality.tests.test_mutation -v

from __future__ import annotations

import os
import unittest

from scripts.quality.mutation import fingerprint
from scripts.quality.tests.mutation_test_support import MutationRepo


class MutationFingerprintTests(unittest.TestCase):
    def test_M1_fingerprint_matches_when_repository_is_unchanged(self) -> None:
        # Given: a repository with tracked files and a symlink.
        with MutationRepo() as repo:
            before = fingerprint(repo.root)
            # When: no mutation occurs.
            after = fingerprint(repo.root)
        # Then: the mutation fingerprints match.
        self.assertEqual(before, after)

    def test_M2_tracked_bytes_and_missing_state_when_gate_mutates(self) -> None:
        for pre_dirty, delete in ((False, False), (True, False), (False, True)):
            with self.subTest(pre_dirty=pre_dirty, delete=delete), MutationRepo() as repo:
                target = repo.root / "tracked.txt"
                if pre_dirty:
                    _ = target.write_text("pre-existing dirty\n", encoding="utf-8")
                before = fingerprint(repo.root)
                # When: a gate mutates bytes or removes the tracked path.
                if delete:
                    target.unlink()
                else:
                    _ = target.write_text("gate mutation\n", encoding="utf-8")
                after = fingerprint(repo.root)
                self.assertNotEqual(before, after)

    def test_M3_semantic_index_entry_when_gate_stages_change(self) -> None:
        with MutationRepo() as repo:
            _ = (repo.root / "tracked.txt").write_text("dirty\n", encoding="utf-8")
            before = fingerprint(repo.root)
            # When: identical worktree bytes are added to the index.
            _ = repo.git("add", "tracked.txt")
            after = fingerprint(repo.root)
        # Then: the semantic index mutation is detected.
        self.assertNotEqual(before, after)

    def test_M4_mode_and_symlink_target_when_gate_mutates(self) -> None:
        for mutation in ("mode", "symlink"):
            with self.subTest(mutation=mutation), MutationRepo() as repo:
                before = fingerprint(repo.root)
                # When: tracked mode or symlink target changes.
                if mutation == "mode":
                    os.chmod(repo.root / "tracked.txt", 0o755)
                else:
                    (repo.root / "link").unlink()
                    (repo.root / "link").symlink_to("missing-target")
                after = fingerprint(repo.root)
                self.assertNotEqual(before, after)

    def test_non_omo_ignored_untracked_path_when_gate_creates_file(self) -> None:
        # Given: a repository-specific ignored directory exists before the gate starts.
        with MutationRepo() as repo:
            ignore = repo.root / ".gitignore"
            _ = ignore.write_text(".omo/\n.cache-test/\n", encoding="utf-8")
            _ = repo.git("add", ".gitignore")
            _ = repo.git("commit", "--quiet", "-m", "fixture: ignore cache")
            before = fingerprint(repo.root)
            # When: the gate creates an ignored path outside root .omo/.
            cached = repo.root / ".cache-test" / "created.txt"
            cached.parent.mkdir()
            _ = cached.write_text("ignored mutation\n", encoding="utf-8")
            after = fingerprint(repo.root)
        # Then: arbitrary Git ignores do not grant a mutation exemption.
        self.assertNotEqual(before, after)

    def test_nested_omo_ignore_or_symlink_escape_when_gate_creates_path(self) -> None:
        for mutation in ("nested", "symlink"):
            with self.subTest(mutation=mutation), MutationRepo() as repo:
                if mutation == "nested":
                    ignore = repo.root / ".gitignore"
                    _ = ignore.write_text(".omo/\nnested/.omo/\n", encoding="utf-8")
                    _ = repo.git("add", ".gitignore")
                    _ = repo.git("commit", "--quiet", "-m", "fixture: nested ignore")
                outside = repo.root.parent / "outside-runtime"
                outside.mkdir()
                before = fingerprint(repo.root)
                # When: an unrelated nested .omo path or root .omo symlink is created.
                if mutation == "nested":
                    target = repo.root / "nested" / ".omo" / "receipt.json"
                    target.parent.mkdir(parents=True)
                    _ = target.write_text("nested mutation\n", encoding="utf-8")
                else:
                    (repo.root / ".omo").symlink_to(outside, target_is_directory=True)
                after = fingerprint(repo.root)
                self.assertNotEqual(before, after)

    def test_M5_ignored_omo_runtime_write_when_gate_writes_receipt(self) -> None:
        with MutationRepo() as repo:
            before = fingerprint(repo.root)
            # When: an ignored runtime receipt is written under .omo/quality.
            receipt = repo.root / ".omo" / "quality" / "receipt.json"
            receipt.parent.mkdir(parents=True)
            _ = receipt.write_text("runtime only\n", encoding="utf-8")
            after = fingerprint(repo.root)
        # Then: the permitted runtime write is absent from the fingerprint.
        self.assertEqual(before, after)

    def test_M6_head_and_nonignored_untracked_path_when_gate_mutates(self) -> None:
        for mutation in ("head", "untracked"):
            with self.subTest(mutation=mutation), MutationRepo() as repo:
                before = fingerprint(repo.root)
                # When: HEAD moves or a visible untracked path appears.
                if mutation == "head":
                    _ = repo.git("commit", "--quiet", "--allow-empty", "-m", "move head")
                else:
                    _ = (repo.root / "visible.txt").write_text("new\n", encoding="utf-8")
                after = fingerprint(repo.root)
                self.assertNotEqual(before, after)


if __name__ == "__main__":
    _ = unittest.main()
