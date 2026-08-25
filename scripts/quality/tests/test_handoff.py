# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 -m unittest scripts.quality.tests.test_handoff -v

from __future__ import annotations

import unittest

from scripts.quality.tests.handoff_test_support import HandoffRepo, MARKER_TEMPLATE


class HandoffGateTests(unittest.TestCase):
    def test_accepts_remote_base_marker_when_main_is_updated(self) -> None:
        # Given: the pushed handoff blob contains the pre-push remote main OID.
        with HandoffRepo() as repo:
            tip = repo.commit_handoff(MARKER_TEMPLATE.format(oid=repo.base))

            # When: the committed tip is offered as a main update.
            completed = repo.run(repo.main_record(tip))

        # Then: the gate accepts the handoff as current.
        self.assertEqual(0, completed.returncode, completed.stderr)
        self.assertEqual("HANDOFF_CURRENT", repo.json(completed)["classification"])

    def test_skips_feature_update_without_interpreting_handoff_prose(self) -> None:
        # Given: a feature commit contains marker-like prose that is not a valid marker.
        with HandoffRepo() as repo:
            tip = repo.commit_handoff("pointer: 48be05f\n<!-- nod-handoff-base: bad -->\n")

            # When: only the feature ref is offered.
            completed = repo.run(repo.feature_record(tip, "feature/topic"))

        # Then: the gate explicitly skips without opening the blob contract.
        self.assertEqual(0, completed.returncode, completed.stderr)
        self.assertEqual("NOT_MAIN_UPDATE", repo.json(completed)["classification"])

    def test_skips_no_ref_updates(self) -> None:
        # Given: Git supplies no pre-push records.
        with HandoffRepo() as repo:
            # When: the gate receives empty stdin.
            completed = repo.run("")

        # Then: it reports the no-ref skip explicitly.
        self.assertEqual(0, completed.returncode, completed.stderr)
        self.assertEqual("NO_REF_UPDATES", repo.json(completed)["classification"])

    def test_skips_deletion_only_main_update(self) -> None:
        # Given: main is being deleted and has no outgoing commit blob.
        with HandoffRepo() as repo:
            record = repo.deletion_record()

            # When: the deletion record is checked.
            completed = repo.run(record)

        # Then: it reports the deletion-only skip explicitly.
        self.assertEqual(0, completed.returncode, completed.stderr)
        self.assertEqual("NO_OUTGOING_OBJECTS", repo.json(completed)["classification"])

    def test_reads_pushed_blob_instead_of_dirty_worktree(self) -> None:
        # Given: the committed blob lacks a marker while the worktree has a valid one.
        with HandoffRepo() as repo:
            tip = repo.commit_handoff("handoff without marker\n")
            _ = (repo.work / "docs/handoff.md").write_text(
                MARKER_TEMPLATE.format(oid=repo.base), encoding="utf-8",
            )

            # When: the committed tip is checked.
            completed = repo.run(repo.main_record(tip))

        # Then: the worktree-only marker cannot satisfy the gate.
        self.assertEqual(1, completed.returncode)
        self.assertEqual("HANDOFF_MARKER_MISSING", repo.json(completed)["classification"])

    def test_rejects_abbreviated_marker(self) -> None:
        # Given: the pushed blob contains an abbreviated hexadecimal marker.
        with HandoffRepo() as repo:
            tip = repo.commit_handoff(f"<!-- nod-handoff-base: {repo.base[:12]} -->\n")

            # When: main is updated.
            completed = repo.run(repo.main_record(tip))

        # Then: abbreviation has a stable failure classification.
        self.assertEqual(1, completed.returncode)
        self.assertEqual("HANDOFF_MARKER_ABBREVIATED", repo.json(completed)["classification"])

    def test_rejects_malformed_marker(self) -> None:
        # Given: the marker uses uppercase hexadecimal outside the exact grammar.
        with HandoffRepo() as repo:
            tip = repo.commit_handoff(MARKER_TEMPLATE.format(oid=repo.base.upper()))

            # When: main is updated.
            completed = repo.run(repo.main_record(tip))

        # Then: malformed syntax is rejected distinctly.
        self.assertEqual(1, completed.returncode)
        self.assertEqual("HANDOFF_MARKER_MALFORMED", repo.json(completed)["classification"])

    def test_rejects_duplicate_markers(self) -> None:
        # Given: the pushed blob has two otherwise valid marker comments.
        with HandoffRepo() as repo:
            marker = MARKER_TEMPLATE.format(oid=repo.base)
            tip = repo.commit_handoff(marker + marker)

            # When: main is updated.
            completed = repo.run(repo.main_record(tip))

        # Then: duplicates are rejected before value selection.
        self.assertEqual(1, completed.returncode)
        self.assertEqual("HANDOFF_MARKER_DUPLICATE", repo.json(completed)["classification"])

    def test_rejects_ancestor_stale_marker(self) -> None:
        # Given: the marker identifies an ancestor older than remote main.
        with HandoffRepo() as repo:
            tip = repo.commit_handoff(MARKER_TEMPLATE.format(oid=repo.ancestor))

            # When: main is updated.
            completed = repo.run(repo.main_record(tip))

        # Then: ancestry proves the marker stale.
        self.assertEqual(1, completed.returncode)
        self.assertEqual("HANDOFF_MARKER_STALE", repo.json(completed)["classification"])

    def test_rejects_future_marker(self) -> None:
        # Given: the marker identifies a commit descending from remote main.
        with HandoffRepo() as repo:
            _ = repo.git("checkout", "--quiet", "-b", "future-marker")
            future = repo.commit("future.txt", "future\n")
            _ = repo.git("checkout", "--quiet", "main")
            tip = repo.commit_handoff(MARKER_TEMPLATE.format(oid=future))

            # When: main is updated from the older remote base.
            completed = repo.run(repo.main_record(tip))

        # Then: ancestry proves the marker is from the future.
        self.assertEqual(1, completed.returncode)
        self.assertEqual("HANDOFF_MARKER_FUTURE", repo.json(completed)["classification"])

    def test_rejects_marker_from_unrelated_ref(self) -> None:
        # Given: the marker identifies a valid commit unrelated to remote main.
        with HandoffRepo() as repo:
            tree = repo.git("mktree", input_text="")
            unrelated = repo.git("commit-tree", tree, input_text="unrelated\n")
            tip = repo.commit_handoff(MARKER_TEMPLATE.format(oid=unrelated))

            # When: main is updated.
            completed = repo.run(repo.main_record(tip))

        # Then: a wrong-ref marker is rejected as a mismatch.
        self.assertEqual(1, completed.returncode)
        self.assertEqual("HANDOFF_MARKER_MISMATCH", repo.json(completed)["classification"])


if __name__ == "__main__":
    _ = unittest.main()
