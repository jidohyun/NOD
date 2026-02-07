# QA Agent - Error Recovery Playbook

When you encounter a failure during review, follow these recovery steps.
Do NOT stop or ask for help until you have exhausted the playbook.

---

## Automated Tool Fails to Run

**Symptoms**: `npm audit`, `bandit`, `lighthouse` command errors

1. Check: is the tool installed? Note missing tool in result
2. Check: are you in the correct directory?
3. If `npm audit`: try `npm audit --production` to skip devDependencies
4. If `bandit`: check Python path — may need `python -m bandit`
5. If `lighthouse`: requires a running server — note if server not available
6. **도구 없으면**: 수동 리뷰로 대체, result에 `tool_unavailable: ["tool_name"]` 기록

---

## False Positive Suspected

**Symptoms**: Finding looks like a vulnerability but might be safe

1. Trace the data flow — does user input actually reach the dangerous operation?
2. Check: is there validation/sanitization upstream?
3. Check: is the framework handling this automatically? (e.g., ORM prevents SQL injection)
4. If uncertain: mark severity as `MEDIUM` with note "verify manually"
5. **절대 하지 말 것**: 확신 없이 CRITICAL로 마킹 — 잘못된 경보는 신뢰를 떨어뜨림

---

## Cannot Access Source Code

**Symptoms**: Serena `find_symbol` returns nothing, file not found

1. Check: correct file path? Use `search_for_pattern` with broader terms
2. Check: is the code in a different directory or monorepo?
3. Use `get_symbols_overview` on parent directories to find the structure
4. If truly inaccessible: review what you CAN access and note gaps in report

---

## Performance Metrics Unavailable

**Symptoms**: Can't run Lighthouse, no APM data, no load test results

1. Check if dev server is running for Lighthouse
2. If no server: review code statically for performance anti-patterns:
   - N+1 queries (loops with DB calls)
   - Missing pagination
   - Large bundle imports
   - No code splitting
3. Report findings with `static_analysis_only: true` flag
4. Recommend specific metrics to measure when environment is available

---

## Scope Too Large

**Symptoms**: Full audit requested but codebase has 100+ files

1. Prioritize: auth/security-critical files first
2. Use pattern search to find high-risk areas:
   - `search_for_pattern("password|secret|token|api_key")`
   - `search_for_pattern("execute|eval|innerHTML")`
3. Review critical paths: auth flow, payment, data mutation
4. Note in report: `scope_coverage: "critical paths only, full audit requires more"`

---

## Rate Limit / Quota Error

**Symptoms**: `429`, `RESOURCE_EXHAUSTED`, `rate limit exceeded`

1. **즉시 멈춤** — 추가 API 호출 하지 말 것
2. 현재까지 작업을 `progress-{agent-id}.md`에 저장
3. `result-{agent-id}.md`에 Status: `quota_exceeded` 기록
4. 남은 작업 목록을 명시

---

## Serena Memory 접근 불가

1. 1회 재시도
2. 2회 연속 실패: 로컬 파일 `/tmp/progress-{agent-id}.md` 사용
3. result에 `memory_fallback: true` 플래그 추가

---

## 일반 원칙

- **오탐 방지**: 확신 없는 finding은 severity 낮추고 "verify manually" 표시
- **막힘**: 5턴 이상 진전 없으면 현재 상태 저장, `Status: blocked`
- **수정 금지**: QA는 리포트만 — 코드 수정은 해당 에이전트에게 위임
