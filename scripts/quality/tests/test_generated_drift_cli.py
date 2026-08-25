# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 -m unittest scripts.quality.tests.test_generated_drift_cli -v

from __future__ import annotations

import subprocess
import unittest
from pathlib import Path
from typing import Final

from scripts.quality.contracts.json_boundary import JsonObject
from scripts.quality.tests.generated_drift_test_support import DriftRepo, first_pair, json_object, pair_by_name, parse_result

SCRIPT: Final = Path(__file__).resolve().parents[1] / "generated_drift.py"


class GeneratedDriftCliTests(unittest.TestCase):
    def test_production_matrix_when_listed(self) -> None:
        # Given: no generator is run while inspecting the production ownership matrix.
        completed = subprocess.run(
            ("python3", str(SCRIPT), "--list-pairs", "--json"), check=False, capture_output=True, text=True,
        )
        result = parse_result(completed.stdout)
        # Then: OpenAPI blocks; mixed/manual/metadata surfaces are explicit advisory outcomes.
        self.assertEqual(0, completed.returncode, completed.stderr)
        self.assertTrue(pair_by_name(result, "api-openapi")["blocking"])
        self.assertEqual(["mise", "//apps/api:gen:openapi"], pair_by_name(result, "api-openapi")["command"])
        self.assertEqual("MIXED_MANUAL_OUTPUT", pair_by_name(result, "package-i18n")["reason"])
        self.assertEqual("UNTRACKED_OUTPUT", pair_by_name(result, "design-tokens")["reason"])
        self.assertEqual("METADATA_BEARING_OUTPUT", pair_by_name(result, "extension-zip")["reason"])
        for name in ("package-i18n", "design-tokens", "extension-zip"):
            self.assertEqual("NON_REPRODUCIBLE_PAIR", pair_by_name(result, name)["classification"])

    def test_malformed_matrix_and_stale_revision_when_boundary_is_invalid(self) -> None:
        for scenario in ("malformed", "revision"):
            with self.subTest(scenario=scenario), DriftRepo() as repo:
                repo.write_generator("raise SystemExit(0)\n")
                repo.write_output()
                repo.commit()
                matrix = repo.root.parent / "matrix.json"
                _ = matrix.write_text('{"pairs":[{"name":7}]}', encoding="utf-8")
                revision = "HEAD" if scenario == "malformed" else "missing-revision"
                if scenario == "revision":
                    matrix = repo.matrix()
                completed = subprocess.run(
                    ("python3", str(SCRIPT), "--repo", str(repo.root), "--revision", revision,
                     "--matrix", str(matrix), "--json"), check=False, capture_output=True, text=True,
                )
                result = parse_result(completed.stdout)
            self.assertEqual(2, completed.returncode)
            self.assertEqual("MALFORMED_INPUT" if scenario == "malformed" else "STALE_STATE", result["classification"])

    def test_json_is_deterministic_when_same_revision_runs_twice(self) -> None:
        with DriftRepo() as repo:
            repo.write_generator("from pathlib import Path; Path('generated/result.txt').write_text('generated\\n')\n")
            repo.write_output()
            repo.commit()
            matrix = repo.matrix()
            command = ("python3", str(SCRIPT), "--repo", str(repo.root), "--revision", "HEAD", "--matrix", str(matrix), "--json")
            first = subprocess.run(command, check=False, capture_output=True, text=True)
            second = subprocess.run(command, check=False, capture_output=True, text=True)
        self.assertEqual(0, first.returncode, first.stderr)
        self.assertEqual(first.stdout, second.stdout)
        self.assertNotIn(str(repo.root), first.stdout)

    def test_symlink_manifest_when_target_changes(self) -> None:
        with DriftRepo() as repo:
            generated = repo.root / "generated"
            generated.mkdir()
            (generated / "one.txt").write_text("same\n", encoding="utf-8")
            (generated / "two.txt").write_text("same\n", encoding="utf-8")
            (generated / "result.txt").symlink_to("one.txt")
            repo.write_generator("from pathlib import Path; p=Path('generated/result.txt'); p.unlink(); p.symlink_to('two.txt')\n")
            repo.commit()
            completed, result = self._run(repo)
        self.assertEqual(1, completed.returncode)
        self.assertEqual(["generated/result.txt"], json_object(first_pair(result)["changes"])["content"])

    def _run(self, repo: DriftRepo) -> tuple[subprocess.CompletedProcess[str], JsonObject]:
        completed = subprocess.run(
            ("python3", str(SCRIPT), "--repo", str(repo.root), "--revision", "HEAD", "--matrix", str(repo.matrix()), "--json"),
            check=False, capture_output=True, text=True,
        )
        return completed, parse_result(completed.stdout)


if __name__ == "__main__":
    _ = unittest.main()
