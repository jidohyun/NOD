#!/bin/bash
# poll-status.sh - Check the status of running subagents
#
# Usage: scripts/poll-status.sh <session-id> <agent-id-1> [agent-id-2] ...
#
# For each agent, outputs one of:
#   {agent-id}:completed  - Result file exists with completed status
#   {agent-id}:failed     - Result file exists with failed status
#   {agent-id}:running    - Process is still alive
#   {agent-id}:crashed    - Process died without producing a result file
#
# Exit code: 0 always (status is communicated via stdout)

set -uo pipefail

SESSION_ID="$1"
shift
AGENTS=("$@")

for agent in "${AGENTS[@]}"; do
  RESULT=".serena/memories/result-${agent}.md"
  PID_FILE="/tmp/subagent-${SESSION_ID}-${agent}.pid"

  if [ -f "$RESULT" ]; then
    STATUS=$(grep "^## Status:" "$RESULT" | head -1 | awk '{print $3}')
    echo "${agent}:${STATUS}"
  elif [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "${agent}:running"
  else
    echo "${agent}:crashed"
  fi
done
