# Frontend Agent - Error Recovery Playbook

When you encounter a failure, find the matching scenario and follow the recovery steps.
Do NOT stop or ask for help until you have exhausted the playbook.

---

## TypeScript Compilation Error

**Symptoms**: `TS2322`, `TS2345`, `Type X is not assignable to type Y`

1. Read the error — which file, which line, which types conflict
2. Check: is the interface/type definition correct?
3. Check: is the API response type matching the expected shape?
4. If API mismatch: update the type to match actual response (don't cast with `as any`)
5. If generic issue: use explicit type parameter `<Type>` instead of inference
6. **절대 하지 말 것**: `@ts-ignore`, `as any` — 타입 문제를 해결하지 않고 숨기는 것

---

## Build Error

**Symptoms**: `next build` fails, `Module not found`, `SyntaxError`

1. Read the full error — which module, which file
2. If missing dependency: note in result as "requires `npm install X`" — do NOT install yourself
3. If import path wrong: use `search_for_pattern("export.*ComponentName")` to find actual path
4. If dynamic import issue: ensure component is client-side (`'use client'`)
5. Re-run build after fix to confirm

---

## Test Failure

**Symptoms**: `vitest` FAILED, `expect(X).toBe(Y)` assertion errors

1. Read the error — expected vs received, which test file
2. `find_symbol("ComponentName")` to check current implementation
3. Determine: test outdated or implementation wrong?
   - Test expects old behavior → update test
   - Component bug → fix component
4. Re-run the specific test: `npx vitest run path/to/test.ts`
5. **3회 실패 시**: 다른 접근 방식 시도. progress에 기록

---

## Hydration Mismatch (Next.js)

**Symptoms**: `Hydration failed`, `Text content does not match server-rendered HTML`

1. Find the component that renders differently on server vs client
2. Common causes:
   - `Date.now()` or `Math.random()` in render
   - Browser-only APIs (`window`, `localStorage`) without `useEffect`
   - Conditional rendering based on client-only state
3. Fix: wrap client-only code in `useEffect` + state, or use `'use client'`
4. If third-party component: wrap with `dynamic(() => import(...), { ssr: false })`

---

## API Integration Error

**Symptoms**: `Network Error`, `CORS`, `401 Unauthorized`, wrong data shape

1. **CORS**: Check backend CORS config — is frontend origin allowed?
2. **401**: Check token — is it in the header? is it expired?
3. **Wrong data**: Log `response.data` and compare with expected type
4. **Network Error**: Is the backend running? Correct port?
5. If backend isn't your responsibility: document the expected API contract in result

---

## Styling / Layout Broken

**Symptoms**: Component renders but looks wrong, responsive breakpoint fails

1. Check Tailwind classes — typo? wrong breakpoint prefix?
2. Check parent container — is it blocking layout? (`overflow-hidden`, fixed width)
3. Test at specific breakpoints: 320px, 768px, 1024px, 1440px
4. Use browser DevTools to inspect computed styles
5. If dark mode issue: check `dark:` variants applied

---

## Rate Limit / Quota Error (Gemini API)

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

- **3회 실패**: 같은 접근 3번 실패하면 반드시 다른 방법 시도
- **막힘**: 5턴 이상 진전 없으면 현재 상태 저장하고 `Status: blocked` 기록
- **범위 초과**: backend 문제 발견 시 result에 기록만, 직접 수정하지 말 것
