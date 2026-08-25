# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 -m unittest scripts.quality.tests.test_plan_adversarial -v

from __future__ import annotations

import json
import unittest
from pathlib import Path
from typing import Final

from scripts.quality.tests.contract_support import load_json, validate
from scripts.quality.tests.plan_test_support import PlannerRepo

PLAN_SCHEMA: Final = Path(__file__).resolve().parents[1] / "contracts" / "plan.schema.json"


class PlannerAdversarialTests(unittest.TestCase):
    def test_malformed_input_when_four_field_or_ref_contract_is_broken(self) -> None:
        # Given: malformed field counts, OIDs, zero combinations, and ref forms.
        with PlannerRepo() as repo:
            valid_oid = repo.base
            malformed = (
                "three fields only",
                f"refs/heads/main {valid_oid} refs/heads/main {valid_oid} extra",
                f"refs/heads/main {'A' * len(repo.zero)} refs/heads/main {valid_oid}",
                f"refs/heads/main {repo.zero} refs/heads/main {repo.zero}",
                f"refs/heads/main {repo.zero} refs/heads/main {valid_oid}",
                f"(delete) {valid_oid} refs/heads/main {valid_oid}",
                f"refs/heads/main {valid_oid} main {valid_oid}",
                "",
            )
            outcomes = []
            # When: each non-empty malformed line is planned independently.
            for line in malformed[:-1]:
                outcomes.append(repo.plan("pre-push", f"{line}\n"))
            outcomes.append(repo.plan("pre-push", "\n"))
        # Then: every malformed boundary exits nonzero with one stable blocker.
        for completed in outcomes:
            with self.subTest(stderr=completed.stderr):
                self.assertEqual(2, completed.returncode)
                plan = json.loads(completed.stdout)
                self.assertEqual("malformed_input", plan["classification"])
                self.assertEqual("MALFORMED_INPUT", plan["blockers"][0]["code"])

    def test_malformed_input_when_non_delete_local_ref_is_not_fully_qualified(self) -> None:
        # Given: non-delete local refs are shorthand or violate Git ref grammar.
        with PlannerRepo() as repo:
            malformed_refs = ("HEAD", "main", "refs/heads/bad..name")
            outcomes = [
                repo.plan(
                    "pre-push",
                    f"{local_ref} {repo.base} refs/heads/main {repo.base}\n",
                )
                for local_ref in malformed_refs
            ]
        # Then: every record fails at the input boundary, before history planning.
        for local_ref, completed in zip(malformed_refs, outcomes, strict=True):
            with self.subTest(local_ref=local_ref):
                self.assertEqual(2, completed.returncode)
                self.assertEqual("malformed_input", json.loads(completed.stdout)["classification"])

    def test_dirty_worktree_when_pre_commit_surface_has_unstaged_path(self) -> None:
        # Given: one staged API path and another unstaged API path.
        with PlannerRepo() as repo:
            staged = repo.work / "apps/api/staged.py"
            staged.parent.mkdir(parents=True)
            staged.write_text("staged\n", encoding="utf-8")
            repo.git("add", "--", "apps/api/staged.py")
            (repo.work / "apps/api/unstaged.py").write_text("unstaged\n", encoding="utf-8")
            # When: pre-commit is planned.
            completed = repo.plan("pre-commit")
        # Then: unrelated dirt on the affected surface blocks the plan.
        self.assertEqual(2, completed.returncode)
        self.assertEqual("dirty_worktree", json.loads(completed.stdout)["classification"])

    def test_plan_schema_when_every_matrix_output_is_emitted(self) -> None:
        # Given: a normal API update and the confirmed Todo 1 schema.
        with PlannerRepo() as repo:
            local = repo.commit("apps/api/schema.py")
            record = repo.push_record("refs/heads/main", local)
            # When: the planner emits JSON.
            completed = repo.plan("pre-push", record)
        # Then: the machine-consumed output satisfies the schema.
        self.assertEqual(0, completed.returncode, completed.stderr)
        self.assertTrue(validate(json.loads(completed.stdout), load_json(PLAN_SCHEMA)))

    def test_live_fixture_state_when_dirty_surface_is_rejected(self) -> None:
        # Given: a dirty affected surface with captured status, index, and mode.
        with PlannerRepo() as repo:
            local = repo.commit("apps/api/preserved.py")
            dirty = repo.work / "apps/api/dirty.py"
            dirty.write_text("dirty\n", encoding="utf-8")
            before_status = repo.git("status", "--porcelain=v1", "--untracked-files=all")
            before_index = repo.git("ls-files", "--stage")
            before_mode = dirty.stat().st_mode
            # When: planning rejects the dirty surface.
            completed = repo.plan("pre-push", repo.push_record("refs/heads/main", local))
            after_status = repo.git("status", "--porcelain=v1", "--untracked-files=all")
            after_index = repo.git("ls-files", "--stage")
            after_mode = dirty.stat().st_mode
        # Then: status, index, and mode remain byte-for-byte equivalent.
        self.assertEqual(2, completed.returncode)
        self.assertEqual(before_status, after_status)
        self.assertEqual(before_index, after_index)
        self.assertEqual(before_mode, after_mode)


if __name__ == "__main__":
    unittest.main()
