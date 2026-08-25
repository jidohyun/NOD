# Lessons

운영 교훈 축적 파일. 계약·프롬프트·훅·스키마를 바꾸기 전에 읽는다.

작성 규약 (charness recent-lessons 축약판):
- 교훈마다 **사건**(무슨 일이 있었나, 커밋/이슈/세션 날짜)과 **비용**(시간·토큰·
  재작업)을 명시한다. 근거 없는 교훈은 등록하지 않는다.
- 같은 교훈이 재발하면 새 항목 대신 기존 항목에 재발 기록을 append한다 — 재발
  횟수가 중요도 신호다.
- 수동 큐레이션: 파일이 ~20개 항목을 넘으면 오래되고 재발 없는 항목부터 정리한다.

---

### 2026-08-12 실행 경계는 설정에서 확정

- 사건: 정적 하네스 초안이 `apps/worker`를 JS/TS로 분류하고 CI 검증 workflow가
  없다고 기록했으나, 실제 `apps/worker/pyproject.toml`,
  `.github/workflows/review.yml`, `deploy-{api,web,worker}.yml`,
  `deploy-mobile.yml`과 대조하면서 사실과 다른 부분을 발견했다.
- 비용: 부정확한 검증 안내를 유지할 위험과 문서 재검토 1회(시간·토큰은 측정하지 않음).
- 교훈: 실행 도구·검증 범위·CI 상태는 문서 기억이 아니라 `mise.toml`,
  앱 manifest, workflow 파일을 같은 변경에서 대조해 확정한다.

### 2026-08-24 pre-push 입력은 한 번 보존하고 모든 소비자에게 전달

- 사건: Todo 8 mise surface probe에서 실제 `mise run`은 remote 인자와 여러 stdin
  줄을 보존했지만, planner·secret scan·handoff가 같은 stream을 각각 소비해야 하므로
  root orchestration에서 입력 fan-out 계약이 필요했다.
- 비용: 누락된 두 번째 ref가 false green을 만드는 위험과 integration 재검토 1회
  (시간·토큰은 측정하지 않음).
- 교훈: pre-push stdin은 첫 소비 전에 한 번 보존하고 모든 contract CLI에 동일한
  record set을 전달하며, 임의 history 또는 scanner fallback을 추가하지 않는다.

## 템플릿

### YYYY-MM-DD 한 줄 요약

- 사건: (무슨 일이, 어디서 — 커밋/파일/세션)
- 비용: (시간/토큰/재작업)
- 교훈: (다음 세션이 따를 행동 규칙 한 문장)
- 재발: (없으면 생략)
