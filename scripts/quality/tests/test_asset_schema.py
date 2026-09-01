# /// script
# requires-python = ">=3.12"
# ///
# How to run: python3 -m unittest scripts.quality.tests.test_asset_schema -v

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from scripts.quality.asset_schema import validate_asset, validate_vault

ROOT = Path(__file__).resolve().parents[3]

VALID = """\
---
url: https://example.com/article
captured_at: 2026-08-09
claims:
  - id: c1
    text: "첫 번째 검증 가능한 주장"
  - id: c2
    text: "두 번째 주장 — 'quote' and #hash inside text"
relations:
  - claim: c1
    type: new
    target: null
    note: ""
  - claim: c2
    type: supports
    target: some-asset-slug#c1
    note: "타 자산 참조"
---

## Context

테스트 자산.

## Evidence

> (c1) "원문 인용 하나"
> (c2) "원문 인용 둘"
"""


class AssetSchemaTests(unittest.TestCase):
    def check(self, content: str, name: str = "valid-slug.md") -> list[str]:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / name
            path.write_text(content, encoding="utf-8")
            return validate_asset(path).errors

    def test_valid_asset_when_checked(self) -> None:
        self.assertEqual([], self.check(VALID))

    def test_real_vault_when_checked(self) -> None:
        # The living vault is itself the contract: it must always validate.
        assets = validate_vault(ROOT / "vault")
        self.assertGreater(len(assets), 0)
        for asset in assets:
            self.assertEqual([], asset.errors, asset.path.name)

    def test_bad_filename_when_checked(self) -> None:
        errors = self.check(VALID, name="Bad_Slug.md")
        self.assertTrue(any("not a lowercase slug" in error for error in errors))

    def test_url_with_query_when_checked(self) -> None:
        errors = self.check(VALID.replace(
            "url: https://example.com/article", "url: https://example.com/article?utm=x"))
        self.assertTrue(any("query string or fragment" in error for error in errors))

    def test_url_with_trailing_slash_when_checked(self) -> None:
        errors = self.check(VALID.replace(
            "url: https://example.com/article", "url: https://example.com/article/"))
        self.assertTrue(any("trailing slash" in error for error in errors))

    def test_root_url_trailing_slash_when_allowed(self) -> None:
        errors = self.check(VALID.replace(
            "url: https://example.com/article", "url: https://example.com/"))
        self.assertFalse(any("trailing slash" in error for error in errors))

    def test_four_claims_when_rejected(self) -> None:
        extra = VALID.replace(
            '  - id: c2\n    text: "두 번째 주장 — \'quote\' and #hash inside text"',
            '  - id: c2\n    text: "둘"\n  - id: c3\n    text: "셋"\n  - id: c4\n    text: "넷"')
        errors = self.check(extra)
        self.assertTrue(any("schema allows 1..3" in error for error in errors))

    def test_empty_claim_text_when_rejected(self) -> None:
        errors = self.check(VALID.replace(
            'text: "첫 번째 검증 가능한 주장"', 'text: ""'))
        self.assertTrue(any("empty text" in error for error in errors))

    def test_claim_id_out_of_order_when_rejected(self) -> None:
        errors = self.check(VALID.replace("- id: c2", "- id: c3"))
        self.assertTrue(any("out of order" in error for error in errors))

    def test_unknown_relation_type_when_rejected(self) -> None:
        errors = self.check(VALID.replace("type: supports", "type: extends"))
        self.assertTrue(any("'extends' not in" in error for error in errors))

    def test_relation_to_undeclared_claim_when_rejected(self) -> None:
        errors = self.check(VALID.replace("- claim: c2\n    type: supports", "- claim: c9\n    type: supports"))
        self.assertTrue(any("does not reference a declared claim" in error for error in errors))

    def test_malformed_target_when_rejected(self) -> None:
        errors = self.check(VALID.replace("target: some-asset-slug#c1", "target: design:decision-3"))
        self.assertTrue(any("must be null or '<asset-slug>#cN'" in error for error in errors))

    def test_missing_evidence_anchor_when_rejected(self) -> None:
        errors = self.check(VALID.replace('> (c2) "원문 인용 둘"\n', ""))
        self.assertTrue(any("claim c2 has no (cN) anchored quotation" in error for error in errors))

    def test_orphan_anchor_when_rejected(self) -> None:
        errors = self.check(VALID + '> (c7) "선언 안 된 앵커"\n')
        self.assertTrue(any("anchor (c7) references no declared claim" in error for error in errors))

    def test_unknown_frontmatter_key_when_rejected(self) -> None:
        errors = self.check(VALID.replace(
            "captured_at: 2026-08-09", "captured_at: 2026-08-09\nstructures:\n  - name: x"))
        self.assertTrue(any("unknown key 'structures'" in error for error in errors))

    def test_duplicate_url_across_vault_when_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            vault = Path(directory)
            (vault / "first-capture.md").write_text(VALID, encoding="utf-8")
            (vault / "second-capture.md").write_text(VALID, encoding="utf-8")
            assets = validate_vault(vault)
        joined = [error for asset in assets for error in asset.errors]
        self.assertEqual(2, sum("re-capture must append" in error for error in joined))

    def test_hash_inside_quoted_text_when_not_comment(self) -> None:
        # '#hash inside text' in c2 must survive comment stripping.
        self.assertEqual([], self.check(VALID))

    def test_missing_frontmatter_when_rejected(self) -> None:
        errors = self.check("# 그냥 마크다운\n")
        self.assertTrue(any("must start with '---'" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
