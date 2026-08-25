# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 -m unittest scripts.quality.tests.test_mise_quality_integration -v

from __future__ import annotations

import re
import subprocess
import unittest
from pathlib import Path
from typing import Final, override

from scripts.quality.contracts.json_boundary import load_json_bytes

ROOT: Final = Path(__file__).resolve().parents[3]
MISE_PATH: Final = ROOT / "mise.toml"
STATIC_HARNESS: Final = ROOT / "docs" / "static-harness.md"
CONTRACT_PATTERN: Final = re.compile(r"<!-- nod-quality-contract: (\{[^\n]+\}) -->")
EXPECTED_TASKS: Final = {
    "git:doctor",
    "git:plan",
    "git:pre-commit",
    "git:pre-push",
    "git:quality",
    "quality:contracts",
}


class MiseQualityIntegrationTests(unittest.TestCase):
    source: str = ""

    @override
    def setUp(self) -> None:
        self.source = MISE_PATH.read_text(encoding="utf-8")

    def task_run(self, name: str) -> str:
        pattern = re.compile(
            rf'^\[tasks\."{re.escape(name)}"\]\n.*?^run = \'\'\'\n(.*?)^\'\'\'$',
            re.MULTILINE | re.DOTALL,
        )
        match = pattern.search(self.source)
        if match is None:
            self.fail(f"missing task run block: {name}")
        return match.group(1)

    def test_root_tasks_when_listed_by_real_mise(self) -> None:
        completed = subprocess.run(
            ("mise", "tasks", "--json"), cwd=ROOT, check=False, capture_output=True, text=True,
        )
        self.assertEqual(0, completed.returncode, completed.stderr)
        names = {
            line.removeprefix("//:")
            for line in subprocess.run(
                ("jq", "-r", ".[].name"), input=completed.stdout, check=True, capture_output=True, text=True,
            ).stdout.splitlines()
        }
        self.assertTrue(EXPECTED_TASKS.issubset(names))

    def test_entrypoints_when_bound_to_contract_clis(self) -> None:
        self.assertIn('scripts/quality/hook_doctor.py "$@"', self.task_run("git:doctor"))
        self.assertIn('scripts/quality/plan.py "$@"', self.task_run("git:plan"))
        self.assertIn("git:quality -- pre-commit", self.task_run("git:pre-commit"))
        pre_push = self.task_run("git:pre-push")
        self.assertRegex(pre_push, r'\[\[ "\$#" -(?:eq|ne) 2 \]\]')
        self.assertIn('git:quality -- pre-push "$1" "$2"', pre_push)

    def test_push_stream_when_forwarded_to_every_stream_consumer(self) -> None:
        quality = self.task_run("git:quality")
        self.assertIn("push_input=$(cat)", quality)
        self.assertIn('plan.py --phase pre-push --remote "$remote" --json', quality)
        self.assertIn("secret_scan.py --json", quality)
        self.assertIn("handoff.py --json", quality)
        self.assertGreaterEqual(quality.count('"$push_input"'), 3)
        self.assertGreaterEqual(quality.count('printf "%s" "$1"'), 2)

    def test_gate_order_when_defined_once(self) -> None:
        quality = self.task_run("git:quality")
        labels = (
            "contract_validation", "api_lint", "api_test", "worker_lint", "worker_test",
            "web_lint", "web_test", "mobile_lint", "mobile_test", "dockerfile_lint",
            "secret_scan", "handoff", "generated_drift",
        )
        positions = [quality.index(f'"{label}"') for label in labels]
        self.assertEqual(sorted(positions), positions)

    def test_every_selected_gate_when_wrapped_by_receipt_and_mutation(self) -> None:
        quality = self.task_run("git:quality")
        self.assertIn("scripts/quality/receipt.py", quality)
        self.assertIn('--gate "$label"', quality)
        self.assertIn("mutation_check", quality)
        self.assertIn('.omo/quality/$phase/', quality)
        self.assertIn("PYTHONDONTWRITEBYTECODE=1", quality)
        self.assertNotIn("mapfile", quality)
        self.assertNotIn("|| true", quality)

    def test_no_history_or_scanner_fallback_when_configured(self) -> None:
        self.assertNotIn("origin/main...HEAD", self.source)
        self.assertNotIn("HEAD~1", self.source)
        self.assertRegex(self.source, r'(?m)^trufflehog = "3\.97\.0"$')
        quality = self.task_run("git:quality")
        self.assertEqual(1, quality.count("secret_scan.py --json"))
        self.assertNotRegex(quality.lower(), r"gitleaks|detect-secrets")

    def test_operational_contract_when_machine_metadata_parsed(self) -> None:
        match = CONTRACT_PATTERN.search(STATIC_HARNESS.read_text(encoding="utf-8"))
        if match is None:
            self.fail("missing nod-quality-contract metadata")
        contract = load_json_bytes(match.group(1).encode())
        self.assertEqual(
            {
                "ci_parity": "deferred",
                "execution_mode": "no_commit_shared_worktree",
                "receipt_root": ".omo/quality",
                "runtime_boundary": ".omo/",
            },
            contract,
        )

    def test_operational_document_links_when_resolved(self) -> None:
        for relative in ("docs/static-harness.md", "docs/handoff.md", "docs/agent-north-star.md", "docs/lessons.md", "AGENTS.md", "SECURITY.md"):
            text = (ROOT / relative).read_text(encoding="utf-8")
            targets: list[str] = re.findall(r"\[[^]]+\]\(([^)]+)\)", text)
            for target in targets:
                if target.startswith(("http://", "https://", "#")):
                    continue
                resolved = (ROOT / relative).parent / target.split("#", 1)[0]
                self.assertTrue(resolved.resolve().exists(), f"broken link in {relative}: {target}")


if __name__ == "__main__":
    _ = unittest.main()
