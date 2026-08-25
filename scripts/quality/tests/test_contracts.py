# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 -m unittest discover -s scripts/quality/tests -v

import copy
import json
import re
import subprocess
import unittest

from scripts.quality.tests.contract_support import (
    AJV_2020,
    CONTRACTS,
    EXPECTED_CHECKSUMS,
    LOCK_PATH,
    JsonObject,
    load_json,
    validate,
)


class ContractTests(unittest.TestCase):
    plan_schema: JsonObject = {}
    receipt_schema: JsonObject = {}
    plan: JsonObject = {}
    receipt: JsonObject = {}

    def setUp(self) -> None:
        self.plan_schema = load_json(CONTRACTS / "plan.schema.json")
        self.receipt_schema = load_json(CONTRACTS / "receipt.schema.json")
        self.plan = {
            "schema_version": 1,
            "phase": "pre-push",
            "classification": "planned",
            "refs": [],
            "affected_paths": ["scripts/quality/contracts/plan.schema.json"],
            "surfaces": ["quality"],
            "selected": ["contract_validation"],
            "skipped": ["secret_scan"],
            "blockers": [],
        }
        self.receipt = {
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

    def assert_draft_2020_rejects(self, receipt: JsonObject) -> None:
        completed = subprocess.run(
            (
                "node",
                "-e",
                "const Ajv=require(process.argv[1]).default;"
                "const fs=require('node:fs');"
                "const schema=JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));"
                "const data=JSON.parse(fs.readFileSync(0, 'utf8'));"
                "const validate=new Ajv({strict:false}).compile(schema);"
                "process.exit(validate(data) ? 0 : 1);",
                str(AJV_2020),
                str(CONTRACTS / "receipt.schema.json"),
            ),
            input=json.dumps(receipt),
            check=False,
            capture_output=True,
            text=True,
        )
        self.assertEqual(1, completed.returncode, completed.stderr)

    def test_valid_contracts_when_loaded(self) -> None:
        self.assertTrue(validate(self.plan, self.plan_schema))
        self.assertTrue(validate(self.receipt, self.receipt_schema))

    def test_wrapped_oids_and_hashes_when_schema_patterns_applied(self) -> None:
        plan_oid = subprocess.run(
            ("jq", "-r", '.["$defs"].oid.pattern', str(CONTRACTS / "plan.schema.json")),
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()
        receipt_patterns = subprocess.run(
            (
                "jq",
                "-r",
                '.["$defs"].oid.pattern, .["$defs"].mutation.properties.before.pattern, .["$defs"].mutation.properties.after.pattern',
                str(CONTRACTS / "receipt.schema.json"),
            ),
            check=True,
            capture_output=True,
            text=True,
        ).stdout.splitlines()
        wrapped_oid = f"x{'a' * 40}y"
        wrapped_hash = f"x{'a' * 64}y"

        self.assertIsNone(re.search(plan_oid, wrapped_oid))
        self.assertIsNone(re.search(receipt_patterns[0], wrapped_oid))
        self.assertIsNone(re.search(receipt_patterns[1], wrapped_hash))
        self.assertIsNone(re.search(receipt_patterns[2], wrapped_hash))

    def test_legacy_array_outcomes_when_draft_2020_schema_applied(self) -> None:
        duplicate = copy.deepcopy(self.receipt)
        duplicate["outcomes"] = [
            {"label": "contract_validation", "status": "pass", "exit_code": 0},
            {"label": "contract_validation", "status": "skipped", "exit_code": 0},
        ]
        self.assert_draft_2020_rejects(duplicate)

    def test_unknown_outcome_label_when_draft_2020_schema_applied(self) -> None:
        unknown = copy.deepcopy(self.receipt)
        unknown["outcomes"] = {
            "contract_validation": {"status": "pass", "exit_code": 0}, "secret_scan": {"status": "skipped", "exit_code": 0},
            "unknown_gate": {"status": "pass", "exit_code": 0},
        }
        self.assert_draft_2020_rejects(unknown)

    def test_missing_selected_outcome_when_draft_2020_schema_applied(self) -> None:
        missing = copy.deepcopy(self.receipt)
        missing["outcomes"] = {"secret_scan": {"status": "skipped", "exit_code": 0}}
        self.assert_draft_2020_rejects(missing)

    def test_missing_skipped_outcome_when_draft_2020_schema_applied(self) -> None:
        missing = copy.deepcopy(self.receipt)
        missing["outcomes"] = {"contract_validation": {"status": "pass", "exit_code": 0}}
        self.assert_draft_2020_rejects(missing)

    def test_contradictory_skipped_outcome_when_draft_2020_schema_applied(self) -> None:
        contradiction = copy.deepcopy(self.receipt)
        contradiction["outcomes"] = {
            "contract_validation": {"status": "pass", "exit_code": 0},
            "secret_scan": {"status": "pass", "exit_code": 0},
        }
        self.assert_draft_2020_rejects(contradiction)

    def test_extra_unplanned_outcome_when_draft_2020_schema_applied(self) -> None:
        extra = copy.deepcopy(self.receipt)
        extra["outcomes"] = {
            "api_lint": {"status": "pass", "exit_code": 0},
            "contract_validation": {"status": "pass", "exit_code": 0},
            "secret_scan": {"status": "skipped", "exit_code": 0},
        }
        self.assert_draft_2020_rejects(extra)

    def test_blocking_classification_pass_when_draft_2020_schema_applied(self) -> None:
        for classification in ("malformed_input", "dirty_worktree", "stale_state"):
            with self.subTest(classification=classification):
                blocking = copy.deepcopy(self.receipt)
                blocking["classification"] = classification
                self.assert_draft_2020_rejects(blocking)

    def test_duplicate_or_overlapping_labels_when_validated(self) -> None:
        duplicate = copy.deepcopy(self.plan)
        duplicate["selected"] = ["secret_scan", "secret_scan"]
        overlap = copy.deepcopy(self.plan)
        overlap["selected"] = ["secret_scan"]
        self.assertFalse(validate(duplicate, self.plan_schema))
        self.assertFalse(validate(overlap, self.plan_schema))

    def test_blocking_classifications_require_matching_blockers(self) -> None:
        for classification, code in (
            ("malformed_input", "MALFORMED_INPUT"),
            ("dirty_worktree", "DIRTY_WORKTREE"),
            ("stale_state", "STALE_STATE"),
        ):
            mutant = copy.deepcopy(self.plan)
            mutant["classification"] = classification
            self.assertFalse(validate(mutant, self.plan_schema))
            mutant["blockers"] = [{"code": code}]
            self.assertTrue(validate(mutant, self.plan_schema))

    def test_inconsistent_receipt_when_validated(self) -> None:
        pass_with_failure = copy.deepcopy(self.receipt)
        pass_with_failure["failures"] = [{"code": "COMMAND_FAILED", "gate": "contract_validation"}]
        misleading_success = copy.deepcopy(self.receipt)
        misleading_success["outcomes"] = {"contract_validation": {"status": "failed", "exit_code": 23}}
        failed_with_zero = copy.deepcopy(self.receipt)
        failed_with_zero["result"] = "failed"
        failed_with_zero["failures"] = [{"code": "COMMAND_FAILED", "gate": "contract_validation"}]
        failed_with_zero["outcomes"] = {"contract_validation": {"status": "failed", "exit_code": 0}}
        self.assertFalse(validate(pass_with_failure, self.receipt_schema))
        self.assertFalse(validate(misleading_success, self.receipt_schema))
        self.assertFalse(validate(failed_with_zero, self.receipt_schema))

    def test_json_contracts_when_checked_by_jq(self) -> None:
        for path in (CONTRACTS / "plan.schema.json", CONTRACTS / "receipt.schema.json", LOCK_PATH):
            completed = subprocess.run(("jq", "-e", ".", str(path)), check=False, capture_output=True, text=True)
            self.assertEqual(0, completed.returncode, completed.stderr)

    def test_trufflehog_lock_when_validated(self) -> None:
        lock = load_json(LOCK_PATH)
        self.assertEqual("v3.97.0", lock["version"])
        self.assertNotIn("latest", json.dumps(lock).lower())
        assets = {asset["platform"]: asset for asset in lock["assets"]}
        self.assertEqual(EXPECTED_CHECKSUMS, {key: value["sha256"] for key, value in assets.items()})
        self.assertTrue(all(re.fullmatch(r"[0-9a-f]{64}", asset["sha256"]) for asset in assets.values()))

    def test_bad_trufflehog_locks_when_validated(self) -> None:
        lock = load_json(LOCK_PATH)
        latest = copy.deepcopy(lock)
        latest["version"] = "latest"
        wrong_version = copy.deepcopy(lock)
        wrong_version["version"] = "v3.96.0"
        wrong_checksum = copy.deepcopy(lock)
        wrong_checksum["assets"][0]["sha256"] = "a" * 64
        malformed_checksum = copy.deepcopy(lock)
        malformed_checksum["assets"][0]["sha256"] = "abc"
        for mutant in (latest, wrong_version, wrong_checksum, malformed_checksum):
            assets = {asset["platform"]: asset for asset in mutant["assets"]}
            valid = (
                mutant["version"] == "v3.97.0"
                and set(assets) == set(EXPECTED_CHECKSUMS)
                and all(assets[key]["sha256"] == checksum for key, checksum in EXPECTED_CHECKSUMS.items())
                and all(re.fullmatch(r"[0-9a-f]{64}", asset["sha256"]) for asset in assets.values())
            )
            self.assertFalse(valid)


if __name__ == "__main__":
    unittest.main()
