# NOD 개인정보 처리방침 (Privacy Policy) 법적 요구사항 종합 리서치

> **작성일**: 2026-03-25
> **목적**: NOD SaaS 서비스 개인정보 처리방침 작성/개선을 위한 법률 리서치
> **주의**: 본 문서는 법률 정보 제공 목적이며, 정식 법률 자문을 대체하지 않습니다.

---

## 1. 한국 개인정보보호법 필수 기재 사항 (법 제30조)

**법적 근거**: 개인정보 보호법 제30조(개인정보 처리방침의 수립 및 공개), 시행령 제31조

### 제30조 제1항 필수 기재사항 목록

| 호 | 기재사항 | NOD 적용 내용 |
|---|---------|-------------|
| 1호 | 개인정보의 처리 목적 | 회원 관리, 콘텐츠 분석/요약, AI 기반 검색, 구독/결제 관리, 서비스 개선 |
| 2호 | 개인정보의 처리 및 보유 기간 | 회원 탈퇴 시까지, 법령에 따른 보존 기간 별도 명시 필요 |
| 3호 | 개인정보의 제3자 제공 | Google Gemini API, OpenAI API, Paddle(결제), Supabase(인증), Langfuse(AI 관측), Sentry(오류 추적), Google Analytics |
| 3의2호 | 파기절차 및 파기방법 | DB 삭제(CASCADE), 백업 보유 기간(prod: 30일, dev: 7일) |
| 3의3호 | 민감정보 공개 가능성 | 공유 게시물 공개 설정 (`is_public`) 관련 |
| 4호 | 개인정보처리의 위탁 | AI 처리(Google/OpenAI), 결제(Paddle), 인프라(GCP), 인증(Supabase), 모니터링(Sentry, Langfuse, Grafana) |
| 4의2호 | 가명정보 처리 | 임베딩 벡터가 가명정보에 해당할 수 있음 -- 검토 필요 |
| 5호 | 정보주체 권리/의무 및 행사방법 | 열람, 정정/삭제, 처리정지 요구권 및 행사 절차 |
| 6호 | 개인정보 보호책임자 | 성명, 부서, 연락처(전화, 이메일) |
| 7호 | 자동 수집 장치 | Google Analytics, Supabase 세션 쿠키 |
| 8호 | 대통령령으로 정한 사항 | 시행령 제31조 참조 |

### 시행령 제31조 추가 기재사항

- **개인정보의 안전성 확보 조치** (기술적/관리적/물리적 조치)
- **개인정보 국외 이전** 관련 사항
- **개인정보 처리방침의 변경에 관한 사항**: 시행일, 변경 이력

### 2025년 4월 개정 작성지침 주요 변경사항

- **자동화된 의사결정 기재 필수화**: 법 제37조의2 시행(2024.3.15)에 따라, 자동화된 결정의 유무/처리 절차/사용되는 주요 개인정보 유형을 구체적으로 명시. NOD의 AI 요약/분류 기능이 해당.
- **동의 구분 명확화**: 동의 없이 처리 가능한 항목과 명시적 동의 필요 항목 구분
- **14세 미만 아동**: 법정대리인 동의 획득 방법 필수 기재 (권장→필수로 변경)
- **행태정보**: 수집/이용/제공 및 거부 사항 구체화 (브라우저 확장으로서 특히 관련)

**Source**: [개인정보 보호법 제30조 - CaseNote](https://casenote.kr), [개인정보 처리방침 작성지침(2025.4.) - 개인정보보호위원회](https://www.privacy.go.kr), [2025 작성지침 개정 분석 - Lexology](https://www.lexology.com)

---

## 2. 크롬 확장 프로그램 특화 개인정보 이슈

### NOD 확장 프로그램 현재 권한 (manifest v3)

```json
{
  "permissions": ["activeTab", "storage", "scripting", "alarms"],
  "host_permissions": ["https://api.nod-archive.com/*"],
  "content_scripts": [{ "matches": ["<all_urls>"], "run_at": "document_idle" }]
}
```

### Chrome Web Store 개인정보 정책 요구사항

| 요구사항 | NOD 적용 사항 |
|---------|-------------|
| **Privacy Policy URL 필수** | Developer Dashboard에 처리방침 URL 등록 필수 |
| **Data Disclosure 작성** | 수집하는 데이터 유형(웹 콘텐츠, URL, 인증정보) 공개 |
| **Limited Use Policy 준수** | `<all_urls>` content script는 사용자 대면 기능에 필수적인 범위로만 |
| **Prominent Disclosure** | Chrome Web Store 페이지와 UI에 데이터 수집 범위 명확 설명 |
| **보안 전송 필수** | HTTPS 전송 (현재 충족) |
| **암호화 저장** | 로컬 storage 내 개인/민감 데이터 암호화 |

### 특별 주의사항

- **`<all_urls>` content script**: 모든 웹페이지에 주입되므로, Limited Use Policy에 따라 "사용자 대면 기능에 필수적인 범위"로만 제한
- **광고 목적 데이터 사용 완전 금지**: Chrome Web Store 정책상 맞춤형 광고나 데이터 브로커 전송/판매 금지

**Source**: [Chrome Web Store Privacy Policies](https://developer.chrome.com/docs/webstore/program-policies/privacy), [Limited Use Policy](https://developer.chrome.com/docs/webstore/program-policies/limited-use)

---

## 3. AI/ML 서비스 관련 개인정보 이슈

### NOD의 AI 데이터 흐름

NOD는 사용자 아티클 콘텐츠를 AI API(기본: Google Gemini, 대안: OpenAI)에 전송하여 요약, 핵심 포인트 추출, 콘텐츠 분류, 임베딩 생성을 수행합니다.

### AI API 제공자별 데이터 처리

| 항목 | Google Gemini API (기본) | OpenAI API (대안) |
|------|------------------------|------------------|
| 전송 데이터 | 아티클 본문, 제목, URL | 동일 |
| 전송 목적 | 요약 생성, 개념 추출, 임베딩 생성 | 동일 |
| 데이터 학습 여부 | **유료 API**: 학습 미사용. 55일 남용 감지 로깅 | 유료 API: 기본 학습 미사용 |
| 데이터 보유 기간 | 유료 API: 55일 | 30일 |
| 이전 국가 | 미국 | 미국 |

**중요**: Google Gemini API **무료 티어** 사용 시 Google이 AI 모델 개선에 데이터를 사용할 수 있음. 유료 API에서만 학습 제외.

### 자동화된 의사결정 (법 제37조의2)

NOD에서 해당하는 자동화된 의사결정:
- `content_type` 자동 분류
- AI 기반 콘텐츠 요약 및 핵심 포인트 추출
- 유사 아티클 검색을 위한 벡터 임베딩(cosine similarity)
- `root_concept_label`/`root_concept_norm` 자동 개념 추출

기재 필요사항:
1. 자동화된 결정의 존재 여부 및 유형
2. 자동화된 결정의 기준과 절차
3. 사용되는 주요 개인정보 유형
4. 정보주체의 설명 요구권 및 거부권/이의제기권

### Langfuse (AI 관측성)

Langfuse 클라우드(`https://cloud.langfuse.com`)에 AI 호출 데이터가 전송됨. AI 프롬프트/응답 데이터를 포함할 수 있으므로 위탁처리 또는 제3자 제공으로 고지 필요.

**Source**: [Gemini API Data Governance](https://docs.cloud.google.com/gemini/docs/discover/data-governance), [생성형 AI 개인정보 처리 안내서 - 개인정보보호위원회](https://www.pipc.go.kr)

---

## 4. 국제 개인정보보호 규정

NOD는 8개 언어(ko, en, ja, zh-CN, es, fr, de, pt-BR)를 지원하므로 다음 규정 준수 필요.

### GDPR (EU/EEA)

| 요구사항 | NOD 적용 |
|---------|---------|
| **적법한 처리 근거** (Art. 6) | 동의, 계약 이행, 정당한 이익 중 선택 |
| **DPO 지정** (Art. 37) | 초기 스타트업은 선택적이나 연락처 제공 권장 |
| **DPIA** (Art. 35) | AI 분류/요약에 대해 실시 필요 가능 |
| **국외 이전** (Chapter V) | 한국→미국 이전 시 SCC 필요 |
| **정보주체 권리** (Art. 15-22) | 접근권, 정정권, 삭제권, 이동권, 반대권 등 |
| **동의 관리** | 쿠키 배너/동의 관리 도구 필요 |
| **DPA 체결** | 모든 벤더와 Data Processing Agreement 필수 |

### CCPA/CPRA (캘리포니아)

| 요구사항 | NOD 적용 |
|---------|---------|
| **적용 기준** | 연 매출 $26.6M+ 또는 5만명+ 캘리포니아 소비자 |
| **Do Not Sell or Share** | 옵트아웃 링크 필수 |
| **데이터 보유 기간** | 구체적 기간 명시 필요 |
| **소비자 권리** | 알 권리, 삭제권, 옵트아웃, 비차별권 |
| **위반 시 벌금** | 의도적 위반 건당 $7,988 |

### APPI (일본)

| 요구사항 | NOD 적용 |
|---------|---------|
| **역외 적용** | 일본 이용자 개인정보 처리 시 적용 |
| **국외이전** | 동의 획득 또는 적정성 인정 국가 이전 |
| **이용 목적 특정** | 구체적 이용 목적 특정, 취득 시 통지/공표 |
| **벌칙** | 2024년 개정으로 대폭 강화 |

### 개인정보 국외이전 현황 (한국법 기준, 법 제28조의8)

| 이전받는 자 | 이전 국가 | 이전 목적 | 이전 항목 |
|-----------|---------|---------|---------|
| Google Cloud (GCP) | 한국(asia-northeast3) | 인프라 호스팅 | 모든 서비스 데이터 |
| Google (Gemini API) | 미국 | AI 요약/분석 | 아티클 콘텐츠, 제목, URL |
| OpenAI | 미국 | AI 요약/분석 (대안) | 아티클 콘텐츠, 제목, URL |
| Paddle | 영국/미국 | 결제 처리 | 이메일, 결제 정보 |
| Supabase | 미국 | 사용자 인증 | 이메일, OAuth 토큰 |
| Langfuse | 독일/EU | AI 관측성 | AI 호출 로그 |
| Sentry | 미국 | 오류 추적 | 오류 로그, 사용자 식별 정보 |
| Grafana Cloud | EU/미국 | 모니터링 | 메트릭스, 로그 |

---

## 5. 결제/구독 관련 개인정보

### Paddle (Merchant of Record)

| 항목 | 내용 |
|------|-----|
| **PCI DSS** | Paddle이 인증 유지. NOD는 카드 정보 직접 미보유 |
| **NOD가 보유하는 결제 정보** | `paddle_subscription_id`, `paddle_customer_id`, 구독 기간, 상태, 플랜 |
| **인증** | SOC 1, SOC 2 Type 2, PCI-DSS, GDPR, CCPA 준수 |

### 구독 관리를 위한 정보 보유

| 보유 정보 | 보유 기간 | 근거 |
|----------|---------|-----|
| 구독 ID/고객 ID | 구독 유지 + 법정 보유 기간 | 계약 이행 |
| 사용량 기록(`UsageRecord`) | 월별, 서비스 이용 기간 | 서비스 제공 |
| 프로모 코드 이용 기록 | 서비스 이용 기간 | 부정 사용 방지 |

---

## 6. 기술적/관리적 보호 조치

### NOD의 현재 기술적 보호 조치

| 조치 항목 | NOD 현재 상태 | 법적 요건 | 충족 여부 |
|----------|-------------|---------|----------|
| 비밀번호 암호화 | bcrypt 일방향 해시 | 일방향 암호화 필수 | 충족 |
| 토큰 암호화 | JWE(A256KW + A256GCM) | 인증정보 암호화 | 충족 |
| 전송 구간 암호화 | HTTPS (Cloud Run + CDN) | 네트워크 암호화 필수 | 충족 |
| DB 접근 제어 | Private VPC, 외부 접근 차단 | 접근 권한 관리 | 충족 |
| 접속 로그 | DB 로그만 존재 | 접속 기록 6개월+ 보관 | 부분 충족 |
| 백업 | 자동 백업 (prod: PITR + 30일) | 백업/복구 조치 | 충족 |
| 비밀 관리 | Google Secret Manager | 접근 권한 관리 | 충족 |
| 네트워크 분리 | VPC + Private Service Access | 접근 통제 | 충족 |

### 추가 필요 조치

| 조치 | 필요 사항 |
|------|---------|
| 개인정보 접속 기록 관리 | 개인정보취급자별 접속 기록 최소 1년(5만명 이상 시 2년) 보관 필요 |
| 개인정보 영향평가 | AI 기반 프로파일링/분류 기능에 대해 DPIA 실시 권장 |
| 내부 관리 계획 | 개인정보 내부관리계획 수립/시행 필수 (5만명 이상 또는 민감정보 처리 시) |

---

## 7. NOD 수집 개인정보 항목 정리

| 구분 | 항목 | 수집 방법 | 근거 |
|------|------|---------|------|
| **필수 (회원)** | 이메일, 이름, 프로필 이미지, 비밀번호 해시 | 회원가입/OAuth | 계약 이행 |
| **필수 (서비스)** | URL, 아티클 제목, 아티클 본문 콘텐츠 | 확장 프로그램/웹 앱 | 계약 이행 |
| **자동 생성** | AI 요약, 핵심 포인트, 개념 태그, 콘텐츠 분류, 임베딩 벡터 | AI 처리 | 계약 이행 |
| **서비스 이용** | 사용량 기록, 구독 정보, 프로모 이용 기록 | 자동 기록 | 계약 이행 |
| **소셜 활동** | 공유 링크, 댓글, 공감, 닉네임 | 사용자 입력 | 동의 |
| **기기/접속** | IP 주소, User-Agent, 확장 프로그램 버전 | 자동 수집 | 정당한 이익 |
| **OAuth 정보** | 소셜 로그인 제공자(Google/GitHub/Facebook/Kakao)의 ID, 이메일, 이름, 프로필 | OAuth 연동 | 동의 |
| **분석** | Google Analytics 데이터 | 쿠키/자동 수집 | 동의 |

---

## 8. 권장 처리방침 구조

```
1. 개인정보의 처리 목적
2. 처리하는 개인정보의 항목 및 수집 방법
3. 개인정보의 처리 및 보유 기간
4. 개인정보의 제3자 제공
5. 개인정보의 처리 위탁
6. 개인정보의 국외 이전
7. 개인정보의 파기절차 및 방법
8. 정보주체의 권리/의무 및 행사 방법
9. 자동화된 의사결정에 관한 사항            ← 2025 신규 강조
10. 개인정보 자동 수집 장치의 설치/운영 및 거부
11. 행태정보의 수집/이용/제공 및 거부        ← 크롬 확장 특화
12. 개인정보의 안전성 확보 조치
13. 개인정보 보호책임자
14. 개인정보 처리방침의 변경
15. 정보주체의 권익침해 구제방법

[부록] 크롬 확장 프로그램 데이터 수집 상세
[부록] 국제 이용자를 위한 추가 고지사항 (GDPR/CCPA/APPI)
```

---

## 9. 핵심 권고사항

1. **다국어 처리방침 제공**: 최소 한국어 + 영어 필수
2. **계층적 고지(Layered Notice)**: 핵심 지점(회원가입, 아티클 저장, 확장 설치, 결제)에서 요약 고지 제공
3. **시각적 표현 활용**: 2025 작성지침에서 표, 아이콘, 인포그래픽 활용 권장
4. **버전 관리**: 변경 이력 관리, 변경 시 시행일 7일 전(중요 변경 30일 전) 공지
5. **KISA 자가점검 도구 활용**: 누락 항목 확인

---

## Sources

- [개인정보 보호법 제30조 - CaseNote](https://casenote.kr)
- [개인정보 처리방침 작성지침(2025.4.) - 개인정보보호위원회](https://www.privacy.go.kr)
- [Gemini API Data Governance - Google Cloud](https://docs.cloud.google.com/gemini/docs/discover/data-governance)
- [생성형 AI 개인정보 처리 안내서 - 개인정보보호위원회](https://www.pipc.go.kr)
- [Chrome Web Store Privacy Policies](https://developer.chrome.com/docs/webstore/program-policies/privacy)
- [Chrome Web Store Limited Use Policy](https://developer.chrome.com/docs/webstore/program-policies/limited-use)
- [Paddle Privacy Policy](https://www.paddle.com/legal/privacy)
- [SaaS Privacy Compliance 2025](https://secureprivacy.ai/blog/saas-privacy-compliance-requirements-2025-guide)
- [CCPA Compliance 2025](https://secureprivacy.ai/blog/ccpa-privacy-policy-requirements-2025)
- [개인정보의 안전성 확보조치 기준 안내서(2024.10.)](https://www.privacy.go.kr)

---

## Version Notes

- **개인정보 보호법**: 2024.3.15 시행 개정법 기준 (자동화된 의사결정 포함)
- **개인정보 처리방침 작성지침**: 2025.4 개정판 (최신)
- **안전성 확보조치 기준**: 2023-6호, 2025.10.31 개정 시행 예정
- **GDPR**: 현행 (2018 시행)
- **CCPA/CPRA**: 2026.1.1 시행 규정 포함
- **APPI**: 2024.4 시행규칙 개정 반영
- **Chrome Web Store 정책**: 2025년 현행

---

## 관련 프로젝트 파일

- `apps/api/src/users/model.py` -- 사용자 데이터 모델
- `apps/api/src/articles/model.py` -- 아티클/공유/댓글 데이터 모델
- `apps/api/src/subscriptions/model.py` -- 구독/결제/프로모 데이터 모델
- `apps/api/src/lib/config.py` -- 서비스 설정 (AI 제공자, 외부 서비스 연동)
- `apps/api/src/lib/auth.py` -- 인증/암호화 구현
- `apps/extension/vite.config.ts` -- 확장 프로그램 manifest (권한 정의)
- `apps/web/src/config/env.ts` -- 웹 앱 환경 변수
- `apps/infra/variables.tf` -- 인프라 변수
- `apps/infra/database.tf` -- 데이터베이스 인프라
