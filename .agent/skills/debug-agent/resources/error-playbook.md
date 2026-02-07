# Debug Agent - Error Recovery Playbook

When you encounter a failure during debugging, follow these recovery steps.
Do NOT stop or ask for help until you have exhausted the playbook.

---

## Cannot Reproduce the Bug

**Symptoms**: Bug described by user but you can't trigger it

1. Re-read user's reproduction steps — are you following them exactly?
2. Check environment differences: browser, OS, node/python version
3. Check data-dependent: does it need specific DB state or test data?
4. Check timing: is it a race condition? Try adding delays or rapid repetition
5. **3회 시도 후**: result에 `Status: cannot_reproduce` 기록, 조건 목록 명시
   - 절대 "재현 불가"라고 바로 포기하지 말 것

---

## Fix Introduces New Failure

**Symptoms**: Original bug fixed but other tests break

1. Read the failing tests — are they testing the old (buggy) behavior?
2. If yes: update tests to reflect correct behavior
3. If no: your fix has side effects — revert and try a more targeted approach
4. `find_referencing_symbols("fixedFunction")` to check all callers
5. Consider: is the function contract changing? If so, update all callers

---

## Root Cause Unclear

**Symptoms**: You see the failure but can't trace why

1. Add logging at each step of the execution path
2. Binary search: is the bug before or after the midpoint?
3. `search_for_pattern("suspicious_pattern")` to find related code
4. Check git history: `git log --oneline -20 -- path/to/file` — when was it last changed?
5. Check: is it a dependency issue? Library version mismatch?
6. **5턴 진전 없음**: 현재 분석 결과를 progress에 기록, 다른 가설로 전환

---

## Bug Is in Another Agent's Domain

**Symptoms**: Frontend bug caused by backend API, or vice versa

1. Confirm: is the root cause really in the other domain?
2. Document the cross-domain issue clearly:
   - Which endpoint/component is wrong
   - What the correct behavior should be
   - Evidence (request/response logs, stack trace)
3. Record in result: `cross_domain_issue: {agent: "backend", description: "..."}`
4. **직접 수정하지 말 것** — 다른 에이전트의 코드를 건드리면 충돌 발생

---

## Performance Bug Hard to Measure

**Symptoms**: "It's slow" but no clear metric

1. Establish baseline: measure current response time / render time
2. Backend: enable SQL query logging, count queries, check `EXPLAIN ANALYZE`
3. Frontend: run Lighthouse, check React DevTools Profiler
4. Mobile: use Flutter DevTools performance tab
5. Profile before fixing — never optimize without data

---

## Test Cannot Be Written

**Symptoms**: Bug is real but hard to test (race condition, environment-specific)

1. Try: mock the timing / environment condition
2. Try: integration test instead of unit test
3. If truly untestable: document the manual reproduction steps
4. Add a comment in code explaining why the fix is correct
5. Note in result: `test_limitation: "reason why automated test is not feasible"`

---

## Rate Limit / Quota / Memory Fallback

동일: backend-agent 플레이북의 해당 섹션 참조.

---

## 일반 원칙

- **3회 실패**: 같은 접근 3번 실패하면 반드시 다른 방법 시도
- **막힘**: 5턴 이상 진전 없으면 현재 상태 저장, `Status: blocked`
- **범위 초과**: 다른 에이전트 영역은 기록만, 직접 수정 금지
