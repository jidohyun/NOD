#!/usr/bin/env bash
# set -euo pipefail will be selectively disabled for V2
set -uo pipefail

# Fixture test for tidy-target-commits.sh selector  
# Tests: normal commits, merges, tidy: markers (subject and body),
# refactor(scope): tidy markers, branch selection, no-op (all excluded),
# fewer-than-count, help, and invalid inputs.

# Derive selector path and NOD root relative to this script
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
selector_path="$script_dir/tidy-target-commits.sh"
nod_root="$(cd "$script_dir/../../../.." && pwd)"

# Unified cleanup function for all temporary directories
cleanup_all() {
  rm -rf "${tmp:-}" "${tmp_all_markers:-}" "${tmp_external:-}" "${tmp_merge:-}" "${tmp_sigint:-}" 2>/dev/null || true
}

# Single trap for all cleanup (V5: prevents leaks on multi-step)
trap cleanup_all EXIT

# Probe mode is used by Test 15 to exercise this script's real EXIT trap.
# It creates an owned sentinel, signals readiness through a FIFO, then blocks
# until the parent delivers SIGTERM. The EXIT trap must remove the sentinel.
if [[ -n "${TIDY_TEST_PROBE_ROOT:-}" ]]; then
  : "${TIDY_TEST_PROBE_READY:?TIDY_TEST_PROBE_READY is required}"
  : "${TIDY_TEST_PROBE_WAIT:?TIDY_TEST_PROBE_WAIT is required}"
  tmp_sigint="$TIDY_TEST_PROBE_ROOT"
  mkdir -p "$tmp_sigint/trap_test_sentinel"
  trap 'exit 143' TERM
  printf 'ready\n' > "$TIDY_TEST_PROBE_READY"
  IFS= read -r _ < "$TIDY_TEST_PROBE_WAIT"
  exit 0
fi

# Verify test runs in a temporary fixture repo, not the NOD root
tmp=$(mktemp -d)
tmp_all_markers=""
tmp_external=""
tmp_merge=""
tmp_sigint=""

if [[ "$tmp" == "$nod_root" ]]; then
  echo "FATAL: Test would run in NOD root" >&2
  exit 1
fi

# Initialize fixture repo
cd "$tmp"
git init -q
git config user.email "test@example.invalid"
git config user.name "Test User"

# Helper: commit with pinned distinct timestamps (FIX 1: Deterministic dates)
commit_msg_with_date() {
  local msg="$1"
  local date="$2"
  GIT_AUTHOR_DATE="$date" GIT_COMMITTER_DATE="$date" git commit -q --allow-empty -m "$msg"
}

# Pin distinct timestamps to ensure deterministic git log ordering
BASE_TS="2026-08-17T12:00:00"
COUNTER=0
next_ts() {
  COUNTER=$((COUNTER + 1))
  printf "%s:%02d:00 +0000\n" "$BASE_TS" "$COUNTER"
}

# Ensure we have an initial commit to establish HEAD
commit_msg_with_date "initial commit" "$(next_ts)"

# Create test commits in chronological order with distinct timestamps
commit_msg_with_date "feat(api): add user endpoint" "$(next_ts)"
normal_1=$(git rev-parse --short HEAD)

commit_msg_with_date "fix(web): typo in label" "$(next_ts)"
normal_2=$(git rev-parse --short HEAD)

commit_msg_with_date "tidy: cleanup unused imports" "$(next_ts)"

commit_msg_with_date "feat(worker): add queue task

tidy: this is in the commit body, not the subject" "$(next_ts)"
normal_with_tidy_body=$(git rev-parse --short HEAD)

commit_msg_with_date "refactor(api): tidy — remove dead code" "$(next_ts)"

commit_msg_with_date "refactor(worker): tidy - remove unused helper" "$(next_ts)"

commit_msg_with_date "refactor(web): tidy — simplify state" "$(next_ts)"

commit_msg_with_date "docs: update readme" "$(next_ts)"
normal_3=$(git rev-parse --short HEAD)

commit_msg_with_date "fix(web): accessibility improvement" "$(next_ts)"
normal_4=$(git rev-parse --short HEAD)

# Create branch, commit on it, and create TRUE merge with --no-ff
current_branch=$(git rev-parse --abbrev-ref HEAD)
git checkout -qb test-branch
commit_msg_with_date "refactor(api): extract helper" "$(next_ts)"
git checkout -q "$current_branch"
# Use --no-ff to force merge commit (not fast-forward)
git merge -q --no-ff -m "Merge branch 'test-branch'" test-branch
merge_commit=$(git rev-parse --short HEAD)

# Add a commit AFTER merge
commit_msg_with_date "chore: post-merge cleanup" "$(next_ts)"
post_merge=$(git rev-parse --short HEAD)

# V5 edge case: "untidy: x" should NOT be excluded (prefix-anchored)
commit_msg_with_date "feat: untidy: something" "$(next_ts)"
untidy_not_excluded=$(git rev-parse --short HEAD)

echo "=== Test 1: --help ==="
if bash "$selector_path" --help 2>&1 | grep -q "usage\|Usage\|USAGE"; then
  echo "✓ --help printed usage"
else
  echo "✗ --help did not print usage"
  exit 1
fi

echo ""
echo "=== Test 2: Count = ELIGIBLE (topology-independent set assertion) ==="
all_eligible=$(bash "$selector_path" 100 HEAD)
top_3=$(bash "$selector_path" 3 HEAD)

while IFS= read -r line; do
  if [[ -n "$line" ]] && ! echo "$all_eligible" | grep -F "$line" >/dev/null; then
    echo "✗ Top-3 commit not in all-eligible set: $line"
    exit 1
  fi
done <<< "$top_3"

line_count=$(echo "$top_3" | grep -c . || true)
if [[ $line_count -eq 3 ]]; then
  echo "✓ Returned exactly 3 eligible commits (verified against full eligible set)"
else
  echo "✗ Expected 3 lines, got $line_count"
  exit 1
fi

echo ""
echo "=== Test 3: Body-only tidy markers included when requesting many commits ==="
output_6=$(bash "$selector_path" 6 HEAD)
if echo "$output_6" | grep -q "$normal_with_tidy_body"; then
  echo "✓ Includes normal_with_tidy_body (tidy in body only, not subject)"
else
  echo "✗ Missing normal_with_tidy_body in 6-commit result"
  exit 1
fi

echo ""
echo "=== Test 4: Subject tidy markers excluded ==="
output_broad=$(bash "$selector_path" 20 HEAD)

if echo "$output_broad" | grep -q "tidy: cleanup"; then
  echo "✗ Incorrectly includes tidy: subject marker"
  exit 1
else
  echo "✓ Correctly excludes tidy: subject marker"
fi

if echo "$output_broad" | grep -q "refactor(api): tidy"; then
  echo "✗ Incorrectly includes refactor(api): tidy"
  exit 1
else
  echo "✓ Correctly excludes refactor(api): tidy"
fi

if echo "$output_broad" | grep -q "refactor(worker): tidy"; then
  echo "✗ Incorrectly includes refactor(worker): tidy"
  exit 1
else
  echo "✓ Correctly excludes refactor(worker): tidy"
fi

if echo "$output_broad" | grep -q "refactor(web): tidy"; then
  echo "✗ Incorrectly includes refactor(web): tidy"
  exit 1
else
  echo "✓ Correctly excludes refactor(web): tidy"
fi

if echo "$output_broad" | grep -qE '^[0-9a-f]{7,}[[:space:]]+'; then
  echo "✓ Output format is SHA<whitespace>subject"
else
  echo "✗ Output format is incorrect"
  exit 1
fi

echo ""
echo "=== Test 5: All-marker repository exits 0 with empty output (V2 fix) ==="
tmp_all_markers=$(mktemp -d)
cd "$tmp_all_markers"
git init -q
git config user.email "test@example.invalid"
git config user.name "Test User"
GIT_AUTHOR_DATE="2026-08-17T12:00:01 +0000" GIT_COMMITTER_DATE="2026-08-17T12:00:01 +0000" git commit -q --allow-empty -m "tidy: a"
GIT_AUTHOR_DATE="2026-08-17T12:00:02 +0000" GIT_COMMITTER_DATE="2026-08-17T12:00:02 +0000" git commit -q --allow-empty -m "refactor(api): tidy — b"

set +e
output_markers=$(bash "$selector_path" 5 HEAD 2>&1)
exit_code=$?
set -u

if [[ $exit_code -eq 0 ]]; then
  echo "✓ All-marker repo exits 0 (not 1)"
else
  echo "✗ All-marker repo exited $exit_code, expected 0"
  exit 1
fi

line_count=$(echo "$output_markers" | grep -c . || true)
if [[ $line_count -eq 0 ]]; then
  echo "✓ All-marker repo outputs empty (no eligible commits)"
else
  echo "✗ Expected empty output, got $line_count lines"
  exit 1
fi

cd "$tmp"

echo ""
echo "=== Test 6: Fewer than requested with exact row count (V4 fix) ==="
output_20=$(bash "$selector_path" 20 HEAD)
line_count=$(echo "$output_20" | grep -c . || true)
expected_count=9
if [[ $line_count -eq $expected_count ]]; then
  echo "✓ Returned exact fewer-than-count: $line_count (not padded or truncated)"
else
  echo "✗ Expected $expected_count lines, got $line_count"
  exit 1
fi

echo ""
echo "=== Test 7: Branch selection ==="
git checkout -qb feature
GIT_AUTHOR_DATE="$(next_ts)" GIT_COMMITTER_DATE="$(next_ts)" git commit -q --allow-empty -m "feat(api): branch-specific feature"
branch_commit=$(git rev-parse --short HEAD)
git checkout -q "$current_branch"

feature_output=$(bash "$selector_path" 2 feature)
if echo "$feature_output" | grep -q "$branch_commit"; then
  echo "✓ Branch selection works (feature branch)"
else
  echo "✗ Failed to select from feature branch"
  exit 1
fi

echo ""
echo "=== Test 8: Zero count (invalid) ==="
set +e
bash "$selector_path" 0 HEAD 2>&1 >/dev/null
exit_code=$?
set -u
if [[ $exit_code -ne 0 ]]; then
  echo "✓ Correctly rejects count=0 (exit $exit_code)"
else
  echo "✗ Should have rejected count=0"
  exit 1
fi

echo ""
echo "=== Test 9: Non-integer count ==="
set +e
bash "$selector_path" "not-a-number" HEAD 2>&1 >/dev/null
exit_code=$?
set -u
if [[ $exit_code -ne 0 ]]; then
  echo "✓ Correctly rejects non-integer count (exit $exit_code)"
else
  echo "✗ Should have rejected non-integer count"
  exit 1
fi

echo ""
echo "=== Test 10: Unknown branch ==="
set +e
bash "$selector_path" 5 "nonexistent-branch" 2>&1 >/dev/null
exit_code=$?
set -u
if [[ $exit_code -ne 0 ]]; then
  echo "✓ Correctly rejects unknown branch (exit $exit_code)"
else
  echo "✗ Should have rejected unknown branch"
  exit 1
fi

echo ""
echo "=== Test 11: Default arguments byte-identical to explicit 5 HEAD (V4 fix) ==="
default_output=$(bash "$selector_path" 2>&1)
explicit_output=$(bash "$selector_path" 5 HEAD 2>&1)

if [[ "$default_output" == "$explicit_output" ]]; then
  echo "✓ Default invocation byte-identical to explicit 5 HEAD"
else
  echo "✗ Default and explicit outputs differ"
  exit 1
fi

echo ""
echo "=== Test 12: Portability (external cwd, real exit, valid output) (V1 fix) ==="
tmp_external=$(mktemp -d)
cd "$tmp_external"
git init -q
git config user.email "test@example.invalid"
git config user.name "Test User"
GIT_AUTHOR_DATE="2026-08-17T12:00:01 +0000" GIT_COMMITTER_DATE="2026-08-17T12:00:01 +0000" git commit -q --allow-empty -m "feat: external test"
external_commit=$(git rev-parse --short HEAD)

set +e
external_output=$(bash "$selector_path" 1 HEAD 2>&1)
external_exit=$?
set -u

if [[ $external_exit -eq 0 ]]; then
  echo "✓ Selector from external cwd exits 0"
else
  echo "✗ Selector from external cwd exited $external_exit, expected 0"
  exit 1
fi

if echo "$external_output" | grep -q "$external_commit"; then
  echo "✓ Selector from external cwd returns valid output"
else
  echo "✗ Selector from external cwd returned invalid output"
  exit 1
fi

cd "$tmp"

echo ""
echo "=== Test 13: True merge commit excluded (V3 fix) ==="
merge_output=$(bash "$selector_path" 20 HEAD 2>&1 | grep "$merge_commit" || true)
if [[ -z "$merge_output" ]]; then
  echo "✓ True merge commit correctly excluded"
else
  echo "✗ Merge commit incorrectly included in output"
  exit 1
fi

echo ""
echo "=== Test 14: Edge case - 'untidy:' is NOT excluded (V5 prefix-anchored) ==="
output_broad_wide=$(bash "$selector_path" 20 HEAD)

if echo "$output_broad_wide" | grep -q "feat: untidy"; then
  echo "✓ 'untidy:' is not excluded (prefix-anchored match)"
else
  echo "✗ 'untidy:' was incorrectly excluded"
  exit 1
fi

if echo "$output_broad_wide" | grep -q "$untidy_not_excluded"; then
  echo "✓ Commit with 'untidy:' is included"
else
  echo "✗ Commit with 'untidy:' was incorrectly excluded"
  exit 1
fi

echo ""
echo "=== Test 15: Production trap + cleanup_all under SIGTERM ==="
tmp_sigint=$(mktemp -d)
probe_control=$(mktemp -d)
probe_ready="$probe_control/ready"
probe_wait="$probe_control/wait"
probe_output="$probe_control/output"
probe_sentinel="$tmp_sigint/trap_test_sentinel"
mkfifo "$probe_ready" "$probe_wait"
exec 8<> "$probe_ready"
exec 9<> "$probe_wait"

# Launch this exact test script in probe mode. The child installs the real
# top-level EXIT trap, creates its sentinel, and blocks after the readiness
# event. The parent then delivers SIGTERM and observes the real cleanup.
TIDY_TEST_PROBE_ROOT="$tmp_sigint" \
TIDY_TEST_PROBE_READY="$probe_ready" \
TIDY_TEST_PROBE_WAIT="$probe_wait" \
bash "$script_dir/tidy-target-commits.test.sh" >"$probe_output" 2>&1 &
probe_pid=$!

IFS= read -r probe_ready_line <&8
if [[ "$probe_ready_line" != "ready" || ! -d "$probe_sentinel" ]]; then
  echo "✗ Probe did not create the sentinel and signal readiness"
  kill "$probe_pid" 2>/dev/null || true
  wait "$probe_pid" 2>/dev/null || true
  exec 8>&-
  exec 9>&-
  rm -rf "$probe_control" "$tmp_sigint"
  exit 1
fi

if ! kill -TERM "$probe_pid" 2>/dev/null; then
  echo "✗ Could not deliver SIGTERM to probe subprocess"
  exec 8>&-
  exec 9>&-
  wait "$probe_pid" 2>/dev/null || true
  rm -rf "$probe_control" "$tmp_sigint"
  exit 1
fi

printf 'stop\n' >&9
set +e
wait "$probe_pid"
probe_exit=$?
set -u
exec 8>&-
exec 9>&-

if [[ "$probe_exit" -ne 143 ]]; then
  echo "✗ Probe exited $probe_exit instead of 143"
  rm -rf "$probe_control" "$tmp_sigint"
  exit 1
fi

if [[ -e "$probe_sentinel" || -d "$tmp_sigint" ]]; then
  echo "✗ Production cleanup left the probe sentinel behind"
  rm -rf "$probe_control" "$tmp_sigint"
  exit 1
fi

rm -rf "$probe_control"
probe_control=""
echo "✓ Production EXIT trap removed the sentinel after SIGTERM"

echo ""
echo "All tests passed!"
