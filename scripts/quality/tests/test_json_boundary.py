# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 -m unittest scripts.quality.tests.test_json_boundary -v

import subprocess
import unittest


class JsonBoundaryTests(unittest.TestCase):
    def test_duplicate_raw_outcome_member_when_loaded(self) -> None:
        raw_receipt = (
            b'{"outcomes":{"contract_validation":{"status":"pass","exit_code":0},'
            b'"contract_validation":{"status":"failed","exit_code":23}}}'
        )
        completed = subprocess.run(
            ("python3", "-m", "scripts.quality.contracts.json_boundary"),
            input=raw_receipt,
            check=False,
            capture_output=True,
        )
        self.assertEqual(2, completed.returncode, completed.stderr.decode())
        self.assertEqual(b"duplicate JSON member name: contract_validation\n", completed.stderr)
        self.assertEqual(b"", completed.stdout)


if __name__ == "__main__":
    program = unittest.main(exit=False)
    raise SystemExit(not program.result.wasSuccessful())
