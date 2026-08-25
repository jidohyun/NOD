#!/usr/bin/env bash
# Exercises split-commit.sh in a throwaway repository: group isolation, the
# unassigned-change guard, and rollback when a commit is rejected.
set -euo pipefail

script=$(cd "$(dirname "$0")" && pwd)/split-commit.sh
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
failures=0

check() {
    if [[ $2 == "$3" ]]; then
        echo "ok   - $1"
    else
        echo "FAIL - $1: expected [$3], got [$2]"
        failures=$((failures + 1))
    fi
}

new_repo() {
    rm -rf "$work/repo" && mkdir -p "$work/repo" && cd "$work/repo"
    git init --quiet -b main
    git config user.email t@example.com && git config user.name test
    mkdir -p docs code
    echo base > docs/keep.md && echo base > code/old.txt
    git add -A && git commit --quiet -m "base"
}

# Given three disjoint groups of pending changes
new_repo
echo new > docs/added.md
echo changed > code/old.txt
mkdir -p tmp && echo scratch > tmp/note.txt
cat > "$work/plan.txt" <<PLAN
# comment line
== docs: add a note
docs/added.md
== code: change old
code/old.txt
== chore: add scratch
tmp
PLAN

# When the plan runs
"$script" "$work/plan.txt" >/dev/null

# Then each group became its own commit, in order, with only its own files
check "three commits created" "$(git rev-list --count HEAD)" "4"
check "commit order preserved" "$(git log --format=%s -3 | tr '\n' '|')" "chore: add scratch|code: change old|docs: add a note|"
check "group 1 touched only its path" "$(git show --name-only --format= HEAD~2 | tr -d '\n')" "docs/added.md"
check "group 2 touched only its path" "$(git show --name-only --format= HEAD~1 | tr -d '\n')" "code/old.txt"
check "group 3 touched only its path" "$(git show --name-only --format= HEAD | tr -d '\n')" "tmp/note.txt"
check "worktree clean afterwards" "$(git status --porcelain | wc -l | tr -d ' ')" "0"
check "no stash left behind" "$(git stash list | wc -l | tr -d ' ')" "0"

# Given a pending change that no group claims
new_repo
echo new > docs/added.md
echo orphan > docs/orphan.md
printf '== docs: add a note\ndocs/added.md\n' > "$work/plan2.txt"

# When the plan runs, it refuses rather than leaving the change behind
set +e
output=$("$script" "$work/plan2.txt" 2>&1)
status=$?
set -e
check "unassigned change refused" "$status" "1"
check "unassigned change named" "$(grep -c 'docs/orphan.md' <<<"$output")" "1"
check "nothing committed on refusal" "$(git rev-list --count HEAD)" "1"

# Given a hook that rejects the first commit
new_repo
mkdir -p .git/hooks
printf '#!/bin/sh\nexit 1\n' > .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
echo new > docs/added.md
echo changed > code/old.txt
printf '== docs: add a note\ndocs/added.md\n== code: change old\ncode/old.txt\n' > "$work/plan3.txt"

# When the gate rejects, the tree is restored instead of half-committed
set +e
"$script" "$work/plan3.txt" >/dev/null 2>&1
status=$?
set -e
check "rejected commit aborts" "$status" "1"
check "no commit made" "$(git rev-list --count HEAD)" "1"
check "both changes restored" "$(git status --porcelain | wc -l | tr -d ' ')" "2"
check "no stash left after abort" "$(git stash list | wc -l | tr -d ' ')" "0"

echo
[[ $failures -eq 0 ]] && echo "all checks passed" || { echo "$failures check(s) failed"; exit 1; }
