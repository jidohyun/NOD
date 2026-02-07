# Backend Agent - Error Recovery Playbook

When you encounter a failure, find the matching scenario and follow the recovery steps.
Do NOT stop or ask for help until you have exhausted the playbook.

---

## Import / Module Not Found

**Symptoms**: `ModuleNotFoundError`, `ImportError`, `No module named X`

1. Check the import path — typo? wrong package name?
2. Verify the dependency exists in `pyproject.toml` or `requirements.txt`
3. If missing: note it in your result as "requires `pip install X`" — do NOT install yourself
4. If it's a local module: check the directory structure with `get_symbols_overview`
5. If the path changed: use `search_for_pattern("class ClassName")` to find the new location

---

## Test Failure

**Symptoms**: `pytest` returns FAILED, assertion errors

1. Read the full error output — which test, which assertion, expected vs actual
2. `find_symbol("test_function_name")` to read the test code
3. Determine: is the test wrong or is the implementation wrong?
   - Test expects old behavior → update test
   - Implementation has a bug → fix implementation
4. Re-run the specific test: `pytest path/to/test.py::test_name -v`
5. After fix, run full test suite to check for regressions
6. **3회 실패 시**: 다른 접근 방식 시도. 현재 시도를 progress에 기록하고 대안 구현

---

## Database Migration Error

**Symptoms**: `alembic upgrade head` fails, `IntegrityError`, duplicate column

1. Read the error — is it a conflict with existing migration?
2. Check current DB state: `alembic current`
3. If migration conflicts: `alembic downgrade -1` then fix migration script
4. If schema mismatch: compare model with actual DB schema
5. **절대 하지 말 것**: `alembic stamp head` (데이터 손실 위험)

---

## Authentication / JWT Error

**Symptoms**: 401/403 responses, `InvalidTokenError`, `ExpiredSignatureError`

1. Check: is the secret key consistent between encode and decode?
2. Check: is the algorithm specified (`HS256` vs `RS256`)?
3. Check: is the token being sent in the correct header format? (`Bearer {token}`)
4. Check: is token expiry set correctly? (access: 15min, refresh: 7day)
5. Test with a manually created token to isolate the issue

---

## N+1 Query / Slow Response

**Symptoms**: API response > 500ms, many similar SQL queries in logs

1. Enable SQL logging: `echo=True` on engine
2. Count queries for a single request
3. If N+1: add `joinedload()` or `selectinload()` to the query
4. If slow single query: check indexes with `EXPLAIN ANALYZE`
5. If still slow: consider caching with Redis

---

## Rate Limit / Quota Error (Gemini API)

**Symptoms**: `429`, `RESOURCE_EXHAUSTED`, `rate limit exceeded`

1. **즉시 멈춤** — 추가 API 호출 하지 말 것
2. 현재까지 작업을 `progress-{agent-id}.md`에 저장
3. `result-{agent-id}.md`에 Status: `quota_exceeded` 기록
4. 남은 작업 목록을 명시하여 orchestrator가 나중에 재시도할 수 있게 함

---

## Serena Memory 접근 불가

**Symptoms**: `write_memory` / `read_memory` 실패, timeout

1. 1회 재시도 (일시적 오류일 수 있음)
2. 2회 연속 실패 시: 로컬 파일로 대체
   - progress → `/tmp/progress-{agent-id}.md`로 작성
   - result → `/tmp/result-{agent-id}.md`로 작성
3. result에 `memory_fallback: true` 플래그 추가

---

## 일반 원칙

- **3회 실패**: 같은 접근 3번 실패하면 반드시 다른 방법 시도
- **막힘**: 5턴 이상 진전 없으면 현재 상태 저장하고 result에 `Status: blocked` 기록
- **범위 초과**: 다른 에이전트 영역의 문제 발견 시, result에 기록만 하고 직접 수정하지 말 것
