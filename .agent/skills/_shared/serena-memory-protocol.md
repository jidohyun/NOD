# Serena Memory Protocol (CLI Mode)

When running as a CLI subagent via `gemini -p "..." --approval-mode=yolo`, follow this protocol:

## On Start
1. `read_memory("task-board.md")` to confirm your assigned task
2. `write_memory("progress-{agent-id}.md", initial progress entry)` with Turn 1 status

## During Execution
- Every 3-5 turns: `edit_memory("progress-{agent-id}.md")` to append a new turn entry
- Include: action taken, current status, files created/modified

## On Completion
- `write_memory("result-{agent-id}.md")` with final result including:
  - Status: `completed` or `failed`
  - Summary of work done
  - Files created/modified
  - Acceptance criteria checklist

## On Failure
- Still create `result-{agent-id}.md` with Status: `failed`
- Include detailed error description and what remains incomplete
