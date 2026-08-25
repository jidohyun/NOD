#!/usr/bin/env bash
# Fixture test for tidy-aggregate.sh.
# `set -e` is deliberately omitted: several tests assert non-zero exits from the
# aggregator, and the assertions themselves decide pass or fail.
set -uo pipefail

# Tests:
#   1  --help exits 0 and prints usage
#   2  malformed input: unknown option, unexpected argument, --root without value
#   3  missing artifact root exits 2
#   4  complete artifact appears under its commit heading, body verbatim
#   5  incomplete artifact is reported SKIPPED_INCOMPLETE and contributes nothing
#   6  skipped paths: missing suggestions.md, non-SHA entry, empty file
#   7  deterministic order: byte-ordered headings, byte-identical repeat runs
#   8  no-op: empty root and incomplete-only root both print NO_OP and exit 0
#   9  read-only: artifact tree is byte-identical before and after aggregation
#   10 dirty-state preservation in a fixture git repo
#   11 cleanup: the real EXIT trap removes the fixture root under SIGTERM

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
aggregate_path="$script_dir/tidy-aggregate.sh"
nod_root="$(cd "$script_dir/../../../.." && pwd)"

SENTINEL='<!-- AGENT_COMPLETE -->'

tmp=""
tmp_git=""
tmp_probe=""

cleanup_all() {
  rm -rf "${tmp:-}" "${tmp_git:-}" "${tmp_probe:-}" 2>/dev/null || true
}

trap cleanup_all EXIT

# Probe mode is used by Test 11 to exercise this script's real EXIT trap. It
# creates an owned sentinel directory, signals readiness through a FIFO, then
# blocks until the parent delivers SIGTERM. The EXIT trap must remove it.
if [[ -n "${TIDY_AGG_PROBE_ROOT:-}" ]]; then
  : "${TIDY_AGG_PROBE_READY:?TIDY_AGG_PROBE_READY is required}"
  : "${TIDY_AGG_PROBE_WAIT:?TIDY_AGG_PROBE_WAIT is required}"
  tmp="$TIDY_AGG_PROBE_ROOT"
  mkdir -p "$tmp/probe_sentinel"
  trap 'exit 143' TERM
  printf 'ready\n' > "$TIDY_AGG_PROBE_READY"
  IFS= read -r _ < "$TIDY_AGG_PROBE_WAIT"
  exit 0
fi

fail() {
  echo "✗ $1" >&2
  exit 1
}

tmp=$(mktemp -d)
if [[ "$tmp" == "$nod_root" || "$tmp" == "$nod_root/"* ]]; then
  echo "FATAL: fixture root would be inside the NOD root" >&2
  exit 1
fi

# Fixture artifact roots.
#   root_mixed      one complete, one incomplete, one missing, one empty, one non-SHA
#   root_multi      three complete artifacts, created out of byte order
#   root_empty      no entries at all
#   root_incomplete only an incomplete artifact
root_mixed="$tmp/mixed"
root_multi="$tmp/multi"
root_empty="$tmp/empty"
root_incomplete="$tmp/incomplete-only"

write_complete() {
  # write_complete <dir> <short-sha> <count>
  mkdir -p "$1/$2"
  {
    printf '# Tidying suggestions: %s\n\n' "$2"
    printf -- '- commit: %s0000000000000000000000000000\n' "$2"
    printf -- '- short_sha: %s\n' "$2"
    printf -- '- subject: feat(api): fixture subject\n'
    printf -- '- app_root: apps/api\n'
    printf -- '- suggestion_count: %s\n\n' "$3"
    printf '%s\n' "$SENTINEL"
  } > "$1/$2/suggestions.md"
}

mkdir -p "$root_empty"

write_complete "$root_mixed" "aaaaaaaaaaaa" 1
mkdir -p "$root_mixed/bbbbbbbbbbbb"
printf '# Tidying suggestions: bbbbbbbbbbbb\n\nhalf a suggestion, no sentinel\n' \
  > "$root_mixed/bbbbbbbbbbbb/suggestions.md"
mkdir -p "$root_mixed/cccccccccccc"
mkdir -p "$root_mixed/dddddddddddd"
: > "$root_mixed/dddddddddddd/suggestions.md"
printf 'selector rows, not an artifact directory\n' > "$root_mixed/run-summary.md"

write_complete "$root_multi" "ffffffffffff" 0
write_complete "$root_multi" "0123456789ab" 2
write_complete "$root_multi" "abcdef012345" 1

mkdir -p "$root_incomplete/eeeeeeeeeeee"
printf 'truncated\n' > "$root_incomplete/eeeeeeeeeeee/suggestions.md"

echo "=== Test 1: --help ==="
help_out=$(bash "$aggregate_path" --help 2>&1)
help_exit=$?
[[ $help_exit -eq 0 ]] || fail "--help exited $help_exit, expected 0"
echo "$help_out" | grep -q "Usage: tidy-aggregate.sh" || fail "--help did not print usage"
echo "$help_out" | grep -q -- "--root" || fail "--help did not document --root"
echo "$help_out" | grep -qF "$SENTINEL" || fail "--help did not document the sentinel"
echo "$help_out" | grep -q "SKIPPED_INCOMPLETE" || fail "--help did not document SKIPPED_INCOMPLETE"
echo "$help_out" | grep -q "NO_OP" || fail "--help did not document the no-op line"
echo "✓ --help prints usage, --root, sentinel, skip and no-op contract"

echo ""
echo "=== Test 2: malformed input ==="
bash "$aggregate_path" --bogus >/dev/null 2>&1
[[ $? -eq 1 ]] || fail "unknown option should exit 1"
echo "✓ unknown option exits 1"

bash "$aggregate_path" unexpected-positional >/dev/null 2>&1
[[ $? -eq 1 ]] || fail "unexpected argument should exit 1"
echo "✓ unexpected argument exits 1"

bash "$aggregate_path" --root >/dev/null 2>&1
[[ $? -eq 1 ]] || fail "--root without a value should exit 1"
echo "✓ --root without a value exits 1"

bash "$aggregate_path" --root= >/dev/null 2>&1
[[ $? -eq 1 ]] || fail "--root= with an empty value should exit 1"
echo "✓ --root= with an empty value exits 1"

usage_err=$(bash "$aggregate_path" --bogus 2>&1 >/dev/null)
echo "$usage_err" | grep -q "unknown option" || fail "malformed input lacked a diagnostic"
echo "✓ malformed input prints a diagnostic on stderr"

echo ""
echo "=== Test 3: missing artifact root ==="
bash "$aggregate_path" --root "$tmp/does-not-exist" >/dev/null 2>&1
[[ $? -eq 2 ]] || fail "missing artifact root should exit 2"
missing_out=$(bash "$aggregate_path" --root "$tmp/does-not-exist" 2>&1 >/dev/null)
echo "$missing_out" | grep -q "artifact root is not a directory" \
  || fail "missing root lacked a diagnostic"
echo "✓ missing artifact root exits 2 with a diagnostic"

echo ""
echo "=== Test 4: complete artifact grouped under its commit heading ==="
mixed_out=$(bash "$aggregate_path" --root "$root_mixed" 2>/dev/null)
mixed_exit=$?
[[ $mixed_exit -eq 0 ]] || fail "mixed root exited $mixed_exit, expected 0"
echo "$mixed_out" | grep -qx "## aaaaaaaaaaaa" || fail "complete artifact heading missing"
echo "$mixed_out" | grep -qx "ARTIFACT $root_mixed/aaaaaaaaaaaa/suggestions.md" \
  || fail "complete artifact path missing"
echo "$mixed_out" | grep -qx -- "- short_sha: aaaaaaaaaaaa" \
  || fail "complete artifact body not emitted verbatim"
echo "$mixed_out" | grep -qx "COMPLETE_COUNT 1" || fail "expected COMPLETE_COUNT 1"
echo "$mixed_out" | grep -qx "AGGREGATE_ROOT $root_mixed" || fail "AGGREGATE_ROOT line missing"
echo "✓ complete artifact appears under its commit heading with its body"

echo ""
echo "=== Test 5: incomplete artifact reported and excluded ==="
echo "$mixed_out" | grep -qx "SKIPPED_INCOMPLETE $root_mixed/bbbbbbbbbbbb/suggestions.md" \
  || fail "incomplete artifact not reported as SKIPPED_INCOMPLETE"
echo "$mixed_out" | grep -qx "## bbbbbbbbbbbb" \
  && fail "incomplete artifact must not get a commit heading"
echo "$mixed_out" | grep -q "half a suggestion" \
  && fail "incomplete artifact body must not be aggregated"
echo "✓ incomplete artifact is reported and contributes nothing"

echo ""
echo "=== Test 6: skipped paths reported explicitly ==="
echo "$mixed_out" | grep -qx "SKIPPED_MISSING $root_mixed/cccccccccccc/suggestions.md" \
  || fail "directory without suggestions.md not reported as SKIPPED_MISSING"
echo "$mixed_out" | grep -qx "SKIPPED_INCOMPLETE $root_mixed/dddddddddddd/suggestions.md" \
  || fail "empty suggestions.md not reported as SKIPPED_INCOMPLETE"
echo "$mixed_out" | grep -qx "SKIPPED_MALFORMED $root_mixed/run-summary.md" \
  || fail "non-SHA entry not reported as SKIPPED_MALFORMED"
echo "$mixed_out" | grep -qx "SKIPPED_COUNT 4" || fail "expected SKIPPED_COUNT 4"
echo "✓ missing, empty, and non-SHA entries are each reported by path"

echo ""
echo "=== Test 7: deterministic order and repeat runs ==="
multi_first=$(bash "$aggregate_path" --root "$root_multi" 2>/dev/null)
multi_second=$(bash "$aggregate_path" --root "$root_multi" 2>/dev/null)
[[ "$multi_first" == "$multi_second" ]] || fail "two runs over an unchanged root differ"

headings=$(echo "$multi_first" | grep '^## ' | sed 's/^## //')
expected_headings=$(printf '0123456789ab\nabcdef012345\nffffffffffff\n')
[[ "$headings" == "$expected_headings" ]] \
  || fail "headings not in byte order: got [$headings]"

locale_run=$(LC_ALL=en_US.UTF-8 bash "$aggregate_path" --root "$root_multi" 2>/dev/null)
[[ "$locale_run" == "$multi_first" ]] || fail "output depends on caller locale"

external_run=$(cd / && bash "$aggregate_path" --root "$root_multi" 2>/dev/null)
[[ "$external_run" == "$multi_first" ]] || fail "output depends on caller cwd"

echo "$multi_first" | grep -qx "COMPLETE_COUNT 3" || fail "expected COMPLETE_COUNT 3"
echo "$multi_first" | grep -qx "SKIPPED_COUNT 0" || fail "expected SKIPPED_COUNT 0"
echo "$multi_first" | grep -q "NO_OP" && fail "NO_OP must not appear with complete artifacts"
echo "✓ order is byte-stable across repeats, locales, and working directories"

echo ""
echo "=== Test 8: deterministic no-op ==="
empty_out=$(bash "$aggregate_path" --root "$root_empty" 2>/dev/null)
empty_exit=$?
[[ $empty_exit -eq 0 ]] || fail "empty root exited $empty_exit, expected 0"
echo "$empty_out" | grep -qx "NO_OP no complete artifact under $root_empty" \
  || fail "empty root did not print the no-op line"
echo "$empty_out" | grep -qx "COMPLETE_COUNT 0" || fail "empty root COMPLETE_COUNT wrong"

incomplete_out=$(bash "$aggregate_path" --root "$root_incomplete" 2>/dev/null)
incomplete_exit=$?
[[ $incomplete_exit -eq 0 ]] || fail "incomplete-only root exited $incomplete_exit, expected 0"
echo "$incomplete_out" | grep -qx "NO_OP no complete artifact under $root_incomplete" \
  || fail "incomplete-only root did not print the no-op line"
echo "$incomplete_out" | grep -qx "SKIPPED_INCOMPLETE $root_incomplete/eeeeeeeeeeee/suggestions.md" \
  || fail "incomplete-only root did not report its skipped path"

repeat_empty=$(bash "$aggregate_path" --root "$root_empty" 2>/dev/null)
[[ "$repeat_empty" == "$empty_out" ]] || fail "no-op output is not byte-stable"
echo "✓ empty and incomplete-only roots both print a stable no-op and exit 0"

echo ""
echo "=== Test 9: aggregation is read-only ==="
before_listing=$(cd "$tmp" && find . | LC_ALL=C sort)
before_hashes=$(cd "$tmp" && find . -type f | LC_ALL=C sort | xargs shasum)
bash "$aggregate_path" --root "$root_mixed" >/dev/null 2>&1
bash "$aggregate_path" --root "$root_multi" >/dev/null 2>&1
bash "$aggregate_path" --root "$root_empty" >/dev/null 2>&1
after_listing=$(cd "$tmp" && find . | LC_ALL=C sort)
after_hashes=$(cd "$tmp" && find . -type f | LC_ALL=C sort | xargs shasum)
[[ "$before_listing" == "$after_listing" ]] || fail "aggregation changed the artifact tree listing"
[[ "$before_hashes" == "$after_hashes" ]] || fail "aggregation changed artifact contents"
echo "✓ artifact tree listing and contents are byte-identical after aggregation"

echo ""
echo "=== Test 10: dirty worktree state is preserved ==="
tmp_git=$(mktemp -d)
if [[ "$tmp_git" == "$nod_root" || "$tmp_git" == "$nod_root/"* ]]; then
  echo "FATAL: git fixture root would be inside the NOD root" >&2
  exit 1
fi
(
  cd "$tmp_git" || exit 1
  git init -q
  git config user.email "test@example.invalid"
  git config user.name "Test User"
  mkdir -p apps/api
  printf 'committed\n' > apps/api/a.py
  git add .
  GIT_AUTHOR_DATE="2026-08-17T12:00:00 +0000" GIT_COMMITTER_DATE="2026-08-17T12:00:00 +0000" \
    git commit -qm "feat(api): base"
  printf 'uncommitted user edit\n' >> apps/api/a.py
  printf 'staged\n' > apps/api/staged.py
  git add apps/api/staged.py
  printf 'untracked\n' > apps/api/untracked.py
) || fail "could not build the git fixture"

git_root="$tmp_git/.omo/tidy"
write_complete "$git_root" "aaaaaaaaaaaa" 1
mkdir -p "$git_root/bbbbbbbbbbbb"
printf 'truncated\n' > "$git_root/bbbbbbbbbbbb/suggestions.md"

status_before=$(git -C "$tmp_git" status --porcelain=v1 --untracked-files=all)
diff_before=$(git -C "$tmp_git" diff --name-only)
dirty_before=$(cat "$tmp_git/apps/api/a.py")
head_before=$(git -C "$tmp_git" rev-parse HEAD)
log_before=$(git -C "$tmp_git" log --format=%H%x09%s)

git_out=$(cd "$tmp_git" && bash "$aggregate_path" --root .omo/tidy 2>/dev/null)
git_exit=$?
[[ $git_exit -eq 0 ]] || fail "aggregation in the git fixture exited $git_exit"

status_after=$(git -C "$tmp_git" status --porcelain=v1 --untracked-files=all)
diff_after=$(git -C "$tmp_git" diff --name-only)
dirty_after=$(cat "$tmp_git/apps/api/a.py")
head_after=$(git -C "$tmp_git" rev-parse HEAD)
log_after=$(git -C "$tmp_git" log --format=%H%x09%s)

[[ "$status_before" == "$status_after" ]] || fail "git status changed across aggregation"
[[ "$diff_before" == "$diff_after" ]] || fail "tracked diff changed across aggregation"
[[ "$dirty_before" == "$dirty_after" ]] || fail "a dirty file's contents changed"
[[ "$head_before" == "$head_after" ]] || fail "HEAD moved across aggregation"
[[ "$log_before" == "$log_after" ]] || fail "commit history changed across aggregation"
echo "$status_after" | grep -q "apps/api/untracked.py" || fail "untracked user file disappeared"
echo "$git_out" | grep -qx "## aaaaaaaaaaaa" || fail "relative --root did not aggregate"
echo "$git_out" | grep -qx "SKIPPED_INCOMPLETE .omo/tidy/bbbbbbbbbbbb/suggestions.md" \
  || fail "relative --root did not report the incomplete path"
echo "✓ dirty, staged, and untracked state plus history are untouched"

echo ""
echo "=== Test 11: production EXIT trap cleans the fixture root under SIGTERM ==="
tmp_probe=$(mktemp -d)
probe_control=$(mktemp -d)
probe_ready="$probe_control/ready"
probe_wait="$probe_control/wait"
probe_output="$probe_control/output"
probe_sentinel="$tmp_probe/probe_sentinel"
mkfifo "$probe_ready" "$probe_wait"
exec 8<> "$probe_ready"
exec 9<> "$probe_wait"

TIDY_AGG_PROBE_ROOT="$tmp_probe" \
TIDY_AGG_PROBE_READY="$probe_ready" \
TIDY_AGG_PROBE_WAIT="$probe_wait" \
bash "$script_dir/tidy-aggregate.test.sh" >"$probe_output" 2>&1 &
probe_pid=$!

IFS= read -r probe_ready_line <&8
if [[ "$probe_ready_line" != "ready" || ! -d "$probe_sentinel" ]]; then
  kill "$probe_pid" 2>/dev/null || true
  wait "$probe_pid" 2>/dev/null || true
  exec 8>&-
  exec 9>&-
  rm -rf "$probe_control"
  fail "probe did not create its sentinel and signal readiness"
fi

if ! kill -TERM "$probe_pid" 2>/dev/null; then
  exec 8>&-
  exec 9>&-
  wait "$probe_pid" 2>/dev/null || true
  rm -rf "$probe_control"
  fail "could not deliver SIGTERM to the probe subprocess"
fi

printf 'stop\n' >&9
wait "$probe_pid"
probe_exit=$?
exec 8>&-
exec 9>&-

if [[ "$probe_exit" -ne 143 ]]; then
  rm -rf "$probe_control"
  fail "probe exited $probe_exit instead of 143"
fi

if [[ -e "$probe_sentinel" || -d "$tmp_probe" ]]; then
  rm -rf "$probe_control"
  fail "production cleanup left the probe fixture root behind"
fi

rm -rf "$probe_control"
tmp_probe=""
echo "✓ the real EXIT trap removed the probe fixture root"

echo ""
echo "All tests passed!"
