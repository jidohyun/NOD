#!/usr/bin/env bash
set -euo pipefail

# Static contract test for the skill prose and its required local files.
# This intentionally checks only stable, machine-consumed boundaries; reviewer
# judgment remains covered by the fresh-context dogfood run.

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
skill_root="$(cd "$script_dir/.." && pwd)"
skill_file="$skill_root/SKILL.md"
dogfood_file="$skill_root/dogfood.md"

fail() {
  echo "✗ $1" >&2
  exit 1
}

[[ -f "$skill_file" ]] || fail "SKILL.md is missing"
[[ -f "$dogfood_file" ]] || fail "dogfood.md is missing"

name_line=$(grep -m1 '^name: ' "$skill_file")
[[ "$name_line" == "name: suggest-tidyings" ]] \
  || fail "frontmatter name does not match the skill directory"
grep -q '^description: ' "$skill_file" \
  || fail "frontmatter description is missing"

grep -q '최근 커밋 정리 후보' "$skill_file" \
  || fail "Korean recent-commit trigger is missing"
grep -q 'full code reviews' "$skill_file" \
  || fail "full-review negative boundary is missing"
grep -qF 'TIDYING_RUN_COMPLETE' "$skill_file" \
  || fail "final report marker is missing"

required_paths=(
  "references/context-recovery.md"
  "references/nod-validation.md"
  "references/rollout-gates.md"
  "references/tidying-guide.md"
  "scripts/tidy-target-commits.sh"
  "scripts/tidy-aggregate.sh"
  "scripts/tidy-target-commits.test.sh"
  "scripts/tidy-aggregate.test.sh"
  "dogfood.md"
)

for relative_path in "${required_paths[@]}"; do
  [[ -f "$skill_root/$relative_path" ]] \
    || fail "required skill path is missing: $relative_path"
done

[[ -x "$skill_root/scripts/tidy-target-commits.sh" ]] \
  || fail "selector is not executable"
[[ -x "$skill_root/scripts/tidy-aggregate.sh" ]] \
  || fail "aggregator is not executable"

grep -q -- '- mode: `preserve`' "$dogfood_file" \
  || fail "dogfood preserve declaration is missing"
grep -q 'TIDYING_RUN_COMPLETE' "$dogfood_file" \
  || fail "dogfood final report contract is missing"

sentinel_values=$(
  grep -RhoF '<!-- AGENT_COMPLETE -->' "$skill_root" | LC_ALL=C sort -u
)
[[ "$sentinel_values" == '<!-- AGENT_COMPLETE -->' ]] \
  || fail "sentinel spelling is inconsistent or missing"

echo "All skill contract checks passed!"
