# Dogfood Contract

This file freezes the representative behavior before maintenance edits. It is
the preserve baseline for this skill, not a promise that a suggestion is safe
to apply.

## Change declaration

- mode: `preserve`
- preserved behavior: select recent eligible commits, review only eligible
  app-local paths, write complete per-commit advisory artifacts, aggregate them,
  and stop without changing product files.
- improvement target: clarify trigger ownership, reviewer boundaries, and the
  evidence-backed stop contract; selector and aggregator output contracts stay
  unchanged.

## Representative prompt

> 최근 커밋 5개 중 안전한 tidying 후보만 추천해줘. 코드 직접 수정·커밋·PR은
> 하지 말고 결과만 보여줘.

## Expected output

The skill should:

1. select non-merge, non-tidying commits with
   `scripts/tidy-target-commits.sh 5 [branch]`;
2. snapshot dirty paths once and exclude dirty, drifted, out-of-scope, and
   forbidden paths;
3. fan out one reviewer per eligible commit;
4. write only `.omo/tidy/<12-char-short-sha>/suggestions.md` artifacts, ending
   each complete artifact with `<!-- AGENT_COMPLETE -->`;
5. aggregate with `scripts/tidy-aggregate.sh --root .omo/tidy`;
6. report complete artifacts and explicit skip/no-op lines, then stop.

It must not edit product code, tests, configuration, docs, hooks, CI, the Git
index, history, or any file outside `.omo/tidy/`.
The final response must include the aggregate output and target-level skips,
then end with the exact line `TIDYING_RUN_COMPLETE`.

## Acceptance evidence

The baseline acceptance commands are:

```sh
bash scripts/skill-contract.test.sh
bash scripts/tidy-target-commits.test.sh
bash scripts/tidy-aggregate.test.sh
```

The static contract check and both fixture suites must pass before and after
maintenance. The revised skill also gets one fresh-context dogfood run with
the representative prompt, and its transcript must show the same advisory-only
stop boundary.

## Trigger boundaries

These prompts do not belong to this skill:

- “최근 커밋 5개를 전체 코드 리뷰해서 버그도 찾아줘” — use a full review or
  debugging workflow, not a narrow tidying pass.
- “최근 커밋에서 tidying 후보를 적용하고 커밋해줘” — this skill may report
  candidates only; applying, staging, or committing is a separate explicit
  workflow.
