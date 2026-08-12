# Internal Promo Code Issuer Service Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 운영자가 프로모션 코드를 빠르고 안전하게 발급/조회/비활성화할 수 있는 내부용 발급기 서비스를 `apps/web` 내 Admin 화면으로 제공한다.

**Architecture:** 새 백엔드 서비스를 추가로 만들지 않고, 이미 운영 중인 `apps/api`의 admin promo endpoint를 단일 소스로 유지한다. `apps/web`에 admin 전용 페이지를 추가해 해당 endpoint를 호출하며, 권한은 API(`ADMIN_USER_IDS`)와 Web route guard를 함께 적용한다.

**Tech Stack:** Next.js App Router (`apps/web`), React Query, FastAPI (`apps/api`), existing promo schemas/endpoints, `ADMIN_USER_IDS` allowlist.

---

## 1) 배경과 문제

- 현재 사용자용 Billing 페이지에서는 promo redeem 입력이 가능하지만, 운영자용 발급 UI가 없다.
- 실제 발급은 `POST /api/subscriptions/promo/admin/codes`를 직접 호출해야 하므로 운영 부담이 크다.
- 결론: 내부 운영툴이 필요하지만, auth surface를 넓히지 않도록 기존 API 권한 체계를 재사용해야 한다.

---

## 2) 권장 접근 (Recommended)

### 옵션 비교

1. **옵션 A (권장): Web 내부 Admin 페이지 + 기존 API 재사용**
   - 장점: 구현 속도 빠름, 기존 인증/권한 체계 재사용, 리스크 낮음
   - 단점: 내부 운영툴이 Web 앱에 포함됨

2. 옵션 B: 별도 내부 백오피스 서비스 신설
   - 장점: 도메인 분리
   - 단점: 인증/배포/운영 복잡도 크게 증가 (MVP 과투자)

3. 옵션 C: CLI-only 운영
   - 장점: 구현 최소
   - 단점: 비개발 운영자 사용성 낮음

**최종 선택:** 옵션 A

---

## 3) 계약(Contract) 고정

기존 API 계약을 변경하지 않는다.

- `POST /api/subscriptions/promo/admin/codes`
- `GET /api/subscriptions/promo/admin/codes`
- `POST /api/subscriptions/promo/admin/codes/{promo_code_id}/disable`

권한/오류 정책 유지:

- 비관리자: `403 Admin permission required`
- 중복 코드: `409 promo_code_already_exists`
- 없는 코드 disable: `404 promo_code_not_found`

---

## 4) 설계

### 4.1 Web Admin UI

신규 경로(제안):

- `apps/web/src/app/[locale]/admin/promo-codes/page.tsx`

구성:

- 발급 폼: code, grant_days, expires_at, max_redemptions, per_user_limit, campaign_tag
- 코드 리스트: campaign_tag/is_active 필터, 상태 배지, 생성일, redeemed_count
- 액션: copy code, disable(확인 모달 + 사유 입력)

### 4.2 Web API Hook Layer

신규/확장 파일(제안):

- `apps/web/src/lib/api/subscriptions.ts`에 admin hooks 추가
  - `useAdminCreatePromoCode`
  - `useAdminListPromoCodes`
  - `useAdminDisablePromoCode`

### 4.3 Access Guard

이중 보호:

1. Web: admin route 접근 가드(비관리자 redirect 또는 404)
2. API: 기존 `_require_admin(user.id)` 강제 유지

---

## 5) 보안/운영 원칙

- 관리자 판정 소스는 단일화: `ADMIN_USER_IDS`
- mutating endpoint는 감사 로그 필수(발급/비활성화)
- disable은 idempotent 하게 유지
- 사용자에게는 발급용 endpoint 노출 금지(내부 메뉴/경로 분리)

---

## 6) 단계별 구현 계획

### Phase 1: UI 골격 + 조회

- admin route/page 추가
- promo code 리스트 + 필터 구현
- 비관리자 차단 동작 검증

### Phase 2: 발급/비활성화 액션

- create/disable mutation 연결
- 성공/실패 토스트 및 에러 맵핑
- disable 확인 모달

### Phase 3: 운영 편의

- 코드 복사 버튼
- campaign_tag quick filter
- 발급 성공 후 자동 목록 refresh

### Phase 4: 감사/가드 강화

- API audit log 필드 점검(actor/action/target/payload)
- 필요 시 Origin/Referer 검증(쿠키 인증 경로 기준)

---

## 7) 테스트 전략

### Web

- admin 페이지 렌더링
- 비관리자 접근 차단
- 발급 성공/중복(409) 에러 분기
- disable 성공/404 분기

### API

- 기존 promo admin API 테스트 유지 + regression 체크
- audit 기록 생성 여부 검증(가능한 범위)

검증 명령:

```bash
cd apps/web && bun run typecheck && bun run test
cd apps/api && uv run pytest tests/test_subscription_promotions_api.py -v
```

---

## 8) 릴리즈/롤백

- 릴리즈: admin 메뉴를 내부 사용자에게만 노출
- 모니터링: 발급 성공률, 403/409/404 비율, disable 이벤트량
- 롤백: Web admin route 숨김(또는 feature toggle off), API 계약은 그대로 유지

---

## 9) Definition of Done

- 운영자는 Web 내부 화면에서 코드를 발급/조회/비활성화 가능
- 비관리자 접근 차단(Web/API 모두)
- 기존 사용자 redeem 플로우 무중단
- 테스트/타입체크 통과
- 운영 가이드(발급 절차 + 오류 대응) 문서화 완료
