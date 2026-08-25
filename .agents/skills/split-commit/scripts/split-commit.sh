#!/usr/bin/env bash
# Commit a working tree in groups under the local quality harness.
#
# The harness refuses a commit whose staged surfaces overlap unstaged surfaces
# (plan.py DIRTY_WORKTREE), so each group is committed against a genuinely clean
# tree: everything not in the group is stashed first, then restored.
set -euo pipefail

usage() {
    echo "usage: split-commit.sh <plan-file> [--dry-run]" >&2
    echo "plan format: '== <commit subject>' starts a group; following lines are paths" >&2
    exit 2
}

[[ $# -ge 1 && $# -le 2 ]] || usage
plan_file=$1
dry_run=false
[[ ${2:-} == "--dry-run" ]] && dry_run=true
[[ ${2:-} == "" || $dry_run == true ]] || usage
[[ -f $plan_file ]] || { echo "no such plan file: $plan_file" >&2; exit 2; }

cd "$(git rev-parse --show-toplevel)"

# Parse the plan into parallel arrays: messages[i] and newline-delimited paths[i].
messages=()
paths=()
while IFS= read -r line || [[ -n $line ]]; do
    [[ -z $line || $line == \#* ]] && continue
    if [[ $line == "== "* ]]; then
        messages+=("${line#== }")
        paths+=("")
    else
        [[ ${#messages[@]} -gt 0 ]] || { echo "path before first '==' group: $line" >&2; exit 2; }
        paths[$((${#paths[@]} - 1))]+="$line"$'\n'
    fi
done < "$plan_file"
[[ ${#messages[@]} -gt 0 ]] || { echo "plan has no groups" >&2; exit 2; }

# Every pending change must belong to a group. An unassigned change would stay
# unstaged and trip DIRTY_WORKTREE on the surface it shares with a group.
# ponytail: rename entries are read as their destination path; good enough here.
changed=$(git status --porcelain --untracked-files=all | sed 's/^...//; s/.* -> //' | sed 's/^"\(.*\)"$/\1/')
all_paths=$(printf '%s' "${paths[@]}" | sed '/^$/d')
unassigned=""
while IFS= read -r change; do
    [[ -z $change ]] && continue
    covered=false
    while IFS= read -r group_path; do
        [[ -z $group_path ]] && continue
        if [[ $change == "$group_path" || $change == "$group_path"/* ]]; then covered=true; break; fi
    done <<< "$all_paths"
    [[ $covered == true ]] || unassigned+="$change"$'\n'
done <<< "$changed"
if [[ -n $unassigned ]]; then
    echo "these pending changes belong to no group:" >&2
    printf '%s' "$unassigned" >&2
    exit 1
fi

if [[ $dry_run == true ]]; then
    for index in "${!messages[@]}"; do
        echo "== ${messages[$index]}"
        printf '%s' "${paths[$index]}" | sed 's/^/   /'
    done
    exit 0
fi

# The stash records the index as well as the worktree. Staging before stashing
# therefore pushes the staged tree into the stash, and popping it after the
# commit conflicts with what was just committed. Stash first, stage second.
for index in "${!messages[@]}"; do
    rest=()
    for later in "${!messages[@]}"; do
        [[ $later -le $index ]] && continue
        while IFS= read -r group_path; do
            [[ -n $group_path ]] && rest+=("$group_path")
        done <<< "${paths[$later]}"
    done

    stashed=false
    if [[ ${#rest[@]} -gt 0 ]]; then
        before=$(git rev-parse --quiet --verify refs/stash || true)
        git stash push --include-untracked --quiet --message "split-commit rest" -- "${rest[@]}" >/dev/null 2>&1 || true
        after=$(git rev-parse --quiet --verify refs/stash || true)
        [[ $before != "$after" ]] && stashed=true
    fi

    group_paths=()
    while IFS= read -r group_path; do
        [[ -n $group_path ]] && group_paths+=("$group_path")
    done <<< "${paths[$index]}"
    git add -A -- "${group_paths[@]}"

    if ! git commit -m "${messages[$index]}"; then
        echo "gate rejected group $((index + 1)): ${messages[$index]}" >&2
        git reset --quiet
        [[ $stashed == true ]] && git stash pop --quiet
        exit 1
    fi
    echo "committed: $(git log --oneline -1)"
    [[ $stashed == true ]] && git stash pop --quiet
done

echo "done; pending changes: $(git status --porcelain | wc -l | tr -d ' ')"
