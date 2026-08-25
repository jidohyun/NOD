#!/usr/bin/env bash
set -euo pipefail

create_git_fixture() {
  local root=$1
  local remote="$root/remote.git"
  local work="$root/work"
  local hash_probe zero_oid base_oid local_oid

  mkdir -p "$root"
  git init --bare --quiet "$remote"
  git clone --quiet "$remote" "$work"
  git -C "$work" config user.name "NOD Quality Fixture"
  git -C "$work" config user.email "quality-fixture@invalid.example"

  printf '%s\n' "base" >"$work/fixture.txt"
  git -C "$work" add fixture.txt
  git -C "$work" commit --quiet -m "test: fixture base"
  git -C "$work" push --quiet -u origin HEAD:main
  base_oid=$(git -C "$work" rev-parse HEAD)

  printf '%s\n' "update" >>"$work/fixture.txt"
  git -C "$work" add fixture.txt
  git -C "$work" commit --quiet -m "test: fixture update"
  local_oid=$(git -C "$work" rev-parse HEAD)

  hash_probe=$(git -C "$work" hash-object --stdin </dev/null)
  printf -v zero_oid '%*s' "${#hash_probe}" ''
  zero_oid=${zero_oid// /0}

  jq -n \
    '{schema_version: 1, phase: "pre-push", classification: "no_ref_updates", refs: [], affected_paths: [], surfaces: [], selected: [], skipped: [], blockers: []}' \
    >"$root/no_ref_plan.json"
  jq -n \
    --arg local_oid "$local_oid" \
    --arg remote_oid "$base_oid" \
    '{schema_version: 1, phase: "pre-push", classification: "planned", refs: [{local_ref: "refs/heads/main", local_oid: $local_oid, remote_ref: "refs/heads/main", remote_oid: $remote_oid, update_type: "update"}], affected_paths: ["fixture.txt"], surfaces: ["quality"], selected: ["contract_validation"], skipped: ["secret_scan"], blockers: []}' \
    >"$root/update_plan.json"

  jq -n \
    --arg root "$root" \
    --arg remote "$remote" \
    --arg work "$work" \
    --arg zero_oid "$zero_oid" \
    --arg base_oid "$base_oid" \
    --arg local_oid "$local_oid" \
    '{root: $root, remote: $remote, work: $work, zero_oid: $zero_oid, base_oid: $base_oid, local_oid: $local_oid}'
}

if [[ ${BASH_SOURCE[0]} == "$0" ]]; then
  fixture_root=$(mktemp -d "${TMPDIR:-/tmp}/nod-quality-fixture.XXXXXX")
  cleanup_fixture() {
    local status=$?
    trap - EXIT
    rm -rf -- "$fixture_root"
    return "$status"
  }
  trap cleanup_fixture EXIT

  create_git_fixture "$fixture_root" >/dev/null
  rm -rf -- "$fixture_root"
  trap - EXIT
  jq -n --arg root "$fixture_root" '{root: $root, cleaned: true}'
fi
