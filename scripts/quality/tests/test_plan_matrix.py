# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 -m unittest scripts.quality.tests.test_plan_matrix -v

from __future__ import annotations

import json
import subprocess
import unittest

from scripts.quality.plan import PlanJson
from scripts.quality.tests.plan_test_support import PlannerRepo


class PlannerMatrixTests(unittest.TestCase):
    def assert_classification(
        self, completed: subprocess.CompletedProcess[str], expected: str, exit_code: int
    ) -> PlanJson:
        self.assertEqual(exit_code, completed.returncode, completed.stderr)
        plan = json.loads(completed.stdout)
        self.assertEqual(expected, plan["classification"])
        return plan

    def test_p1_api_lint_when_api_path_is_staged(self) -> None:
        # Given: an API path is staged.
        with PlannerRepo() as repo:
            target = repo.work / "apps/api/staged.py"
            target.parent.mkdir(parents=True)
            target.write_text("staged\n", encoding="utf-8")
            repo.git("add", "--", "apps/api/staged.py")
            # When: pre-commit is planned.
            completed = repo.plan("pre-commit")
        # Then: only the API lint family is selected.
        plan = self.assert_classification(completed, "planned", 0)
        self.assertIn("api_lint", plan["selected"])
        self.assertNotIn("api_test", plan["selected"])

    def test_p2_create_when_remote_ancestry_is_provable(self) -> None:
        # Given: a new branch descends from a remote-tracking commit.
        with PlannerRepo() as repo:
            repo.git("checkout", "--quiet", "-b", "feature/create")
            local = repo.commit("apps/web/create.ts")
            record = repo.push_record("refs/heads/feature/create", local, "refs/heads/feature/create", repo.zero)
            # When: the create record is planned.
            completed = repo.plan("pre-push", record)
        # Then: it is a planned create affecting Web.
        plan = self.assert_classification(completed, "planned", 0)
        self.assertEqual("create", plan["refs"][0]["update_type"])
        self.assertIn("web_test", plan["selected"])

    def test_p3_update_when_remote_is_ancestor(self) -> None:
        # Given: main has one outgoing API commit.
        with PlannerRepo() as repo:
            local = repo.commit("apps/api/update.py")
            # When: the update is planned.
            completed = repo.plan("pre-push", repo.push_record("refs/heads/main", local))
        # Then: it is a normal update with the API test selected.
        plan = self.assert_classification(completed, "planned", 0)
        self.assertEqual("update", plan["refs"][0]["update_type"])
        self.assertIn("api_test", plan["selected"])

    def test_p4_delete_when_local_oid_is_zero(self) -> None:
        # Given: Git supplies its documented deletion tuple.
        with PlannerRepo() as repo:
            record = repo.push_record("(delete)", repo.zero)
            # When: the deletion is planned.
            completed = repo.plan("pre-push", record)
        # Then: no zero OID is dereferenced and the deletion is explicit.
        plan = self.assert_classification(completed, "planned", 0)
        self.assertEqual("delete", plan["refs"][0]["update_type"])
        self.assertEqual([], plan["affected_paths"])

    def test_p5_malformed_second_line_when_stream_contains_valid_first_line(self) -> None:
        # Given: a valid update is followed by a malformed record.
        with PlannerRepo() as repo:
            local = repo.commit("apps/api/first.py")
            stream = repo.push_record("refs/heads/main", local) + "malformed second line\n"
            # When: every input line is parsed.
            completed = repo.plan("pre-push", stream)
        # Then: the whole plan fails as malformed rather than ignoring line two.
        plan = self.assert_classification(completed, "malformed_input", 2)
        self.assertEqual([{"code": "MALFORMED_INPUT", "ref": "line:2"}], plan["blockers"])

    def test_p6_force_update_when_remote_is_not_ancestor(self) -> None:
        # Given: a local orphan commit replaces remote main.
        with PlannerRepo() as repo:
            repo.git("checkout", "--quiet", "--orphan", "force")
            repo.git("rm", "--quiet", "-rf", ".")
            local = repo.commit("apps/worker/force.py")
            # When: the non-fast-forward record is planned.
            completed = repo.plan("pre-push", repo.push_record("refs/heads/force", local))
        # Then: force-update is explicit and Worker is affected.
        plan = self.assert_classification(completed, "planned", 0)
        self.assertEqual("force_update", plan["refs"][0]["update_type"])
        self.assertIn("worker_test", plan["selected"])

    def test_p7_history_base_unavailable_when_local_object_is_missing(self) -> None:
        # Given: the payload names an unavailable local object.
        with PlannerRepo() as repo:
            record = repo.push_record("refs/heads/main", "f" * len(repo.zero))
            # When: history is inspected without a fallback.
            completed = repo.plan("pre-push", record)
        # Then: planning fails closed with the history classification.
        self.assert_classification(completed, "history_base_unavailable", 2)

    def test_p8_multi_ref_when_two_updates_are_supplied(self) -> None:
        # Given: one push updates API main and creates a Web branch.
        with PlannerRepo() as repo:
            api = repo.commit("apps/api/multi.py")
            repo.git("checkout", "--quiet", "-b", "feature/web")
            web = repo.commit("apps/web/multi.ts")
            stream = repo.push_record("refs/heads/main", api) + repo.push_record(
                "refs/heads/feature/web", web, "refs/heads/feature/web", repo.zero
            )
            # When: the complete stream is planned.
            completed = repo.plan("pre-push", stream)
        # Then: both refs and both app tests appear once.
        plan = self.assert_classification(completed, "planned", 0)
        self.assertEqual(2, len(plan["refs"]))
        self.assertEqual(1, plan["selected"].count("api_test"))
        self.assertEqual(1, plan["selected"].count("web_test"))

    def test_p9_dirty_worktree_when_affected_surface_is_dirty(self) -> None:
        # Given: an API update plus another dirty API path.
        with PlannerRepo() as repo:
            local = repo.commit("apps/api/clean.py")
            dirty = repo.work / "apps/api/dirty.py"
            dirty.write_text("dirty\n", encoding="utf-8")
            # When: the push is planned.
            completed = repo.plan("pre-push", repo.push_record("refs/heads/main", local))
        # Then: the affected dirty surface blocks the plan.
        self.assert_classification(completed, "dirty_worktree", 2)

    def test_p10_unmapped_path_when_app_prefix_only_looks_similar(self) -> None:
        # Given: apps/apiary is not the exact apps/api prefix.
        with PlannerRepo() as repo:
            local = repo.commit("apps/apiary/not-api.py")
            # When: it is planned.
            completed = repo.plan("pre-push", repo.push_record("refs/heads/main", local))
        # Then: it fails closed rather than selecting API.
        plan = self.assert_classification(completed, "unmapped_path", 2)
        self.assertNotIn("api", plan["surfaces"])

    def test_p11_contract_validation_when_proof_surface_changes(self) -> None:
        # Given: the planner proof surface changes.
        with PlannerRepo() as repo:
            local = repo.commit("scripts/quality/rule.txt")
            # When: the update is planned.
            completed = repo.plan("pre-push", repo.push_record("refs/heads/main", local))
        # Then: quality and contract validation are selected.
        plan = self.assert_classification(completed, "planned", 0)
        self.assertIn("quality", plan["surfaces"])
        self.assertIn("contract_validation", plan["selected"])

    def test_p12_cross_app_rename_when_source_and_destination_differ(self) -> None:
        # Given: a tracked API file is renamed into Web.
        with PlannerRepo() as repo:
            repo.commit("apps/api/rename.py", "rename\n")
            repo.git("push", "--quiet", "origin", "HEAD:main")
            base = repo.git("rev-parse", "HEAD")
            (repo.work / "apps/web").mkdir(parents=True, exist_ok=True)
            repo.git("mv", "apps/api/rename.py", "apps/web/rename.ts")
            repo.git("commit", "--quiet", "-m", "test: cross app rename")
            local = repo.git("rev-parse", "HEAD")
            record = repo.push_record("refs/heads/main", local, remote_oid=base)
            # When: rename-aware history is planned.
            completed = repo.plan("pre-push", record)
        # Then: both paths, surfaces, and app tests are present.
        plan = self.assert_classification(completed, "planned", 0)
        self.assertEqual(["apps/api/rename.py", "apps/web/rename.ts"], plan["affected_paths"])
        self.assertTrue({"api_test", "web_test"}.issubset(plan["selected"]))

    def test_p13_release_tag_when_extension_tag_is_created(self) -> None:
        # Given: an Extension release tag points at a remote-reachable commit.
        with PlannerRepo() as repo:
            repo.git("tag", "extension-v1.0.0")
            record = repo.push_record("refs/tags/extension-v1.0.0", repo.base, "refs/tags/extension-v1.0.0", repo.zero)
            # When: the tag creation is planned.
            completed = repo.plan("pre-push", record)
        # Then: Extension release contract validation is not silently skipped.
        plan = self.assert_classification(completed, "planned", 0)
        self.assertIn("extension", plan["surfaces"])
        self.assertIn("contract_validation", plan["selected"])

    def test_p14_tree_noop_when_update_trees_are_identical(self) -> None:
        # Given: a new commit has the same tree as its remote base.
        with PlannerRepo() as repo:
            repo.git("commit", "--quiet", "--allow-empty", "-m", "test: empty")
            local = repo.git("rev-parse", "HEAD")
            # When: the update is planned.
            completed = repo.plan("pre-push", repo.push_record("refs/heads/main", local))
        # Then: it is an explicit non-blocking tree no-op.
        self.assert_classification(completed, "tree_noop", 0)

    def test_p15_unmapped_path_when_unknown_top_level_changes(self) -> None:
        # Given: an unknown top-level surface changes.
        with PlannerRepo() as repo:
            local = repo.commit("unknown/new.txt")
            # When: it is planned.
            completed = repo.plan("pre-push", repo.push_record("refs/heads/main", local))
        # Then: it fails closed with the offending path.
        plan = self.assert_classification(completed, "unmapped_path", 2)
        self.assertEqual("unknown/new.txt", plan["blockers"][0].get("ref"))

    def test_p16_stale_state_when_local_ref_no_longer_matches_payload(self) -> None:
        # Given: refs/heads/main moved after the payload OID was captured.
        with PlannerRepo() as repo:
            captured = repo.commit("apps/api/captured.py")
            local_ref = f"refs/heads/{repo.git('branch', '--show-current')}"
            repo.commit("apps/api/later.py")
            # When: the stale record is planned.
            completed = repo.plan("pre-push", repo.push_record(local_ref, captured))
        # Then: the planner refuses to guess from current HEAD.
        self.assert_classification(completed, "stale_state", 2)

    def test_text_and_json_selected_and_skipped_labels_when_same_stream_is_replayed(self) -> None:
        # Given: one deterministic API update stream.
        with PlannerRepo() as repo:
            local = repo.commit("apps/api/deterministic.py")
            record = repo.push_record("refs/heads/main", local)
            # When: JSON and text renderings are requested repeatedly.
            first_json = repo.plan("pre-push", record)
            second_json = repo.plan("pre-push", record)
            first_text = repo.plan("pre-push", record, json_output=False)
            second_text = repo.plan("pre-push", record, json_output=False)
        # Then: bytes repeat and both label partitions are identical across formats.
        self.assertEqual(first_json.stdout, second_json.stdout)
        self.assertEqual(first_text.stdout, second_text.stdout)
        plan = json.loads(first_json.stdout)
        text_records = [line.split("=", 1) for line in first_text.stdout.splitlines()]
        text_selected = [json.loads(value) for key, value in text_records if key == "selected"]
        text_skipped = [json.loads(value) for key, value in text_records if key == "skipped"]
        self.assertEqual(plan["selected"], text_selected)
        self.assertEqual(plan["skipped"], text_skipped)

    def test_text_records_are_safe_when_valid_path_contains_newline(self) -> None:
        # Given: Git tracks a valid API path containing a record-looking newline.
        injected_path = "apps/api/safe\nselected=worker_test.py"
        with PlannerRepo() as repo:
            local = repo.commit(injected_path)
            record = repo.push_record("refs/heads/main", local)
            # When: JSON and text plans are rendered.
            json_result = repo.plan("pre-push", record)
            text_result = repo.plan("pre-push", record, json_output=False)
        # Then: each physical text line is one JSON-encoded record value.
        plan = json.loads(json_result.stdout)
        text_records = [line.split("=", 1) for line in text_result.stdout.splitlines()]
        self.assertTrue(all(len(record) == 2 for record in text_records))
        decoded = [(key, json.loads(value)) for key, value in text_records]
        self.assertIn(("affected_path", injected_path), decoded)
        self.assertEqual(plan["selected"], [value for key, value in decoded if key == "selected"])
        self.assertNotIn("worker_test", plan["selected"])

    def test_create_fails_when_no_remote_tracking_ancestry_is_provable(self) -> None:
        # Given: an orphan new branch has no remote-tracking ancestor.
        with PlannerRepo() as repo:
            repo.git("checkout", "--quiet", "--orphan", "orphan")
            repo.git("rm", "--quiet", "-rf", ".")
            local = repo.commit("apps/web/orphan.ts")
            record = repo.push_record("refs/heads/orphan", local, "refs/heads/orphan", repo.zero)
            # When: the create base is derived only from remote reachability.
            completed = repo.plan("pre-push", record)
        # Then: no silent ancestry guess is made.
        self.assert_classification(completed, "history_base_unavailable", 2)


if __name__ == "__main__":
    unittest.main()
