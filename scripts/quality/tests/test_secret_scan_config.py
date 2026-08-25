# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 -m unittest scripts.quality.tests.test_secret_scan_config -v

from __future__ import annotations

import subprocess
import unittest
from pathlib import Path
from typing import Final

from scripts.quality.contracts.json_boundary import load_json_bytes

ROOT: Final = Path(__file__).resolve().parents[3]


class SecretScanConfigTests(unittest.TestCase):
    def test_trufflehog_is_pinned_when_root_tools_are_loaded(self) -> None:
        # Given / When
        completed = subprocess.run(
            ("mise", "ls", "trufflehog", "--json"), cwd=ROOT,
            check=False, capture_output=True,
        )
        tools = load_json_bytes(completed.stdout)
        # Then
        self.assertEqual(0, completed.returncode, completed.stderr.decode())
        if not isinstance(tools, list) or len(tools) != 1 or not isinstance(tools[0], dict):
            raise AssertionError
        self.assertEqual("3.97.0", tools[0].get("version"))


if __name__ == "__main__":
    _ = unittest.main()
