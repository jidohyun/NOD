#!/usr/bin/env bash
set -euo pipefail

# Deterministic aggregator for tidying suggestion artifacts.
#
# Reads only <root>/<12-char-short-sha>/suggestions.md, groups complete
# artifacts by commit, reports every skipped path explicitly, and emits a
# deterministic no-op when nothing is complete.
#
# Read-only by construction: this script never writes, stages, commits, or
# deletes anything. It only reads under <root> and prints to stdout.
#
# Usage: tidy-aggregate.sh [--root <artifact-root>]
#
# Options:
#   --root <artifact-root>  Artifact root to read (default: .omo/tidy)
#   --help                  Print usage and exit 0
#
# Output (stable, LC_ALL=C byte ordering):
#   AGGREGATE_ROOT <root>
#   ## <short-sha>                  one heading per complete artifact
#   ARTIFACT <path>
#   <artifact body, verbatim>
#   SKIPPED_INCOMPLETE <path>       artifact exists but lacks the final sentinel
#   SKIPPED_MISSING <path>          commit directory without suggestions.md
#   SKIPPED_MALFORMED <path>        entry that is not a 12-hex-char directory
#   COMPLETE_COUNT <n>
#   SKIPPED_COUNT <n>
#   NO_OP no complete artifact under <root>    only when COMPLETE_COUNT is 0
#
# Exit codes:
#   0 - Success, including the deterministic no-op result
#   1 - Invalid usage (unknown option, missing value, extra argument)
#   2 - Artifact root does not exist or is not a directory

SENTINEL='<!-- AGENT_COMPLETE -->'
DEFAULT_ROOT='.omo/tidy'

show_help() {
  cat <<'EOF'
Usage: tidy-aggregate.sh [--root <artifact-root>]

Aggregate tidying suggestion artifacts deterministically. Read-only.

Options:
  --root <artifact-root>  Artifact root to read (default: .omo/tidy)
  --help                  Print this usage and exit 0

Reads only:
  <artifact-root>/<12-char-short-sha>/suggestions.md

An artifact is COMPLETE only when suggestions.md exists, is non-empty, and its
final line is exactly:
  <!-- AGENT_COMPLETE -->

Everything else is reported, never silently dropped:
  SKIPPED_INCOMPLETE <path>   suggestions.md without the exact final sentinel
  SKIPPED_MISSING <path>      commit directory with no suggestions.md
  SKIPPED_MALFORMED <path>    entry that is not a 12-hex-char directory

When no artifact is complete, the aggregator prints a single deterministic
no-op line and exits 0:
  NO_OP no complete artifact under <artifact-root>

Exit codes:
  0 - Success, including the no-op result
  1 - Invalid usage
  2 - Artifact root missing or not a directory

This script never writes, edits, stages, or commits anything. Aggregation is
advisory output and the flow stops here.
EOF
}

root="$DEFAULT_ROOT"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h)
      show_help
      exit 0
      ;;
    --root)
      if [[ $# -lt 2 ]]; then
        echo "error: --root requires an artifact root argument" >&2
        exit 1
      fi
      root="$2"
      shift 2
      ;;
    --root=*)
      root="${1#--root=}"
      if [[ -z "$root" ]]; then
        echo "error: --root requires an artifact root argument" >&2
        exit 1
      fi
      shift
      ;;
    -*)
      echo "error: unknown option: $1" >&2
      echo "run with --help for usage" >&2
      exit 1
      ;;
    *)
      echo "error: unexpected argument: $1" >&2
      echo "run with --help for usage" >&2
      exit 1
      ;;
  esac
done

if [[ ! -d "$root" ]]; then
  echo "error: artifact root is not a directory: $root" >&2
  exit 2
fi

# Deterministic traversal: byte-ordered, depth-1 entries only. LC_ALL=C keeps
# the order independent of the caller's locale, and the plain `for` loop over a
# sorted list keeps it independent of filesystem order.
entries=$(LC_ALL=C ls -1 "$root" 2>/dev/null | LC_ALL=C sort || true)

complete_count=0
skipped_count=0
complete_output=""
skipped_output=""

while IFS= read -r entry; do
  [[ -n "$entry" ]] || continue
  entry_path="$root/$entry"

  # Only a 12-hex-char directory is a commit artifact directory. Anything else
  # (run summaries, scratch notes, a stray file, a wrong-length name) is
  # reported rather than silently ignored.
  if [[ ! -d "$entry_path" ]] || ! [[ "$entry" =~ ^[0-9a-f]{12}$ ]]; then
    skipped_output="${skipped_output}SKIPPED_MALFORMED ${entry_path}
"
    skipped_count=$((skipped_count + 1))
    continue
  fi

  artifact="$entry_path/suggestions.md"

  if [[ ! -f "$artifact" ]]; then
    skipped_output="${skipped_output}SKIPPED_MISSING ${artifact}
"
    skipped_count=$((skipped_count + 1))
    continue
  fi

  # Complete means: non-empty and final line exactly equal to the sentinel.
  # An empty file, a truncated body, or a sentinel followed by anything is
  # incomplete and contributes nothing.
  if [[ ! -s "$artifact" ]] || [[ "$(tail -n 1 "$artifact")" != "$SENTINEL" ]]; then
    skipped_output="${skipped_output}SKIPPED_INCOMPLETE ${artifact}
"
    skipped_count=$((skipped_count + 1))
    continue
  fi

  complete_output="${complete_output}## ${entry}
ARTIFACT ${artifact}
$(cat "$artifact")
"
  complete_count=$((complete_count + 1))
done <<EOF
$entries
EOF

printf 'AGGREGATE_ROOT %s\n' "$root"

if [[ -n "$complete_output" ]]; then
  printf '%s' "$complete_output"
fi

if [[ -n "$skipped_output" ]]; then
  printf '%s' "$skipped_output"
fi

printf 'COMPLETE_COUNT %s\n' "$complete_count"
printf 'SKIPPED_COUNT %s\n' "$skipped_count"

if [[ "$complete_count" -eq 0 ]]; then
  printf 'NO_OP no complete artifact under %s\n' "$root"
fi

# Advisory output ends here. Applying a suggestion is a separate, user-directed
# step under the P1 gate in ../references/rollout-gates.md.
exit 0
