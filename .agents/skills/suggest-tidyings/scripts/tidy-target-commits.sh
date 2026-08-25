#!/usr/bin/env bash
set -euo pipefail

# Deterministic target selector for tidying review.
# Selects recent non-merge, non-tidying commits for analysis.
#
# Usage: tidy-target-commits.sh [<count>] [<branch>]
#
# Arguments:
#   count   - Number of ELIGIBLE commits to retrieve (default: 5, must be positive integer)
#   branch  - Git branch or revision (default: HEAD)
#
# Output:
#   Deterministic one-line records: <short-sha><tab><subject>
#   Excludes merge commits and commits with tidy markers at SUBJECT START only
#   (matches: tidy: prefix, refactor(api|worker|web): tidy with whitespace after)
#
# Exit codes:
#   0 - Success (may return fewer than requested if insufficient eligible commits)
#   1 - Invalid count (non-positive, non-integer)
#   2 - Invalid branch/revision (unknown or ambiguous)

show_help() {
  cat <<'EOF'
Usage: tidy-target-commits.sh [<count>] [<branch>]

Select recent non-merge, non-tidying commits for analysis.

Arguments:
  count   - Number of ELIGIBLE commits to retrieve (default: 5, must be positive integer)
  branch  - Git branch or revision (default: HEAD)

Exit codes:
  0 - Success (may return fewer than requested if insufficient eligible commits)
  1 - Invalid count (non-positive or non-integer)
  2 - Invalid branch/revision

Output format:
  <short-sha><TAB><subject>

Excluded commits:
  - Merge commits
  - Commits with "tidy:" prefix at start of subject
  - Commits matching "refactor(api|worker|web): tidy" with space/tab/em-dash/hyphen after tidy
  - Subject-only matching; body content is ignored for marker detection
  - Prefix-anchored matching: "untidy: x" is NOT excluded
EOF
}

# Parse arguments
if [[ "${1:-}" == "--help" ]]; then
  show_help
  exit 0
fi

count="${1:-5}"
branch="${2:-HEAD}"

# Validate count: must be positive integer
if ! [[ "$count" =~ ^[0-9]+$ ]] || [[ "$count" -le 0 ]]; then
  echo "error: count must be a positive integer, got: $count" >&2
  exit 1
fi

# Validate branch: check it exists
if ! git rev-parse --quiet --verify "$branch" >/dev/null 2>&1; then
  echo "error: unknown or ambiguous revision: $branch" >&2
  exit 2
fi

# Strategy: Get commits with format "%h%x09%s" (sha<tab>subject), then filter by subject,
# then take head -n $count. This ensures count refers to eligible commits, not inspected.
#
# Filtering (subject-only, prefix-anchored):
# 1. Exclude merge commits: --no-merges
# 2. Filter subjects by regex: exclude lines with <TAB>tidy: at subject start
# 3. Exclude lines with <TAB>refactor(api|worker|web): tidy[whitespace]
#    Using patterns that match after the tab separator
#
# Format is "SHA<TAB>SUBJECT", so we match:
#   <TAB>tidy: - Subject starts with "tidy:"
#   <TAB>refactor\((api|worker|web)\): tidy[[:space:]] - Refactor scope, tidy, whitespace
#   This matches "refactor(api): tidy —" (em-dash) and "refactor(api): tidy -" (hyphen)
#   But NOT "feat: untidy: something" (no "tidy:" prefix)

git log "$branch" \
  --no-merges \
  --format="%h%x09%s" | \
  grep -Ev $'	tidy:' | \
  grep -Ev $'	refactor\\((api|worker|web)\\): tidy[[:space:]]' | \
  head -n "$count" || true
