# TODOs

## Evaluation quality

- [ ] Expand the discussion-quality eval suite as the Reddit rollout lands, before/alongside broader multi-source expansion to X / HN.
  - Keep the current Reddit rollout lightweight: a small golden eval is enough for now.
  - Treat the long-term moat as the quality rubric, not the harness code.
  - Add source-specific checks for the failure modes that make discussion summaries feel generic, especially:
    - missing the insider-perspective takeaway
    - flattening real conflict / disagreement into shallow consensus
    - summarizing tone without preserving the concrete stakes behind the thread
  - Goal: preserve discussion-summary quality as source coverage expands, since regressions here are subtle and easy to miss without explicit eval cases.
