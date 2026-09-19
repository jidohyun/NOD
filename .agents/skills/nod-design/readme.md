# NOD Design System

NOD는 나중에 다시 볼 웹페이지를 저장하고 찾아 여는 **개인 링크 라이브러리**다. Manifest V3 브라우저 확장으로 현재 탭을 저장하고, 웹앱에서 로그인한 사용자 자신의 링크를 조회·검색·열기·삭제한다. Phase 1은 URL·제목·출처·저장 시각만 다룬다 (본문 수집, AI 요약, 태그, 폴더, 공유, 읽음 상태 없음).

이 디자인 시스템은 저장소의 `DESIGN.md`를 기준 사양으로 삼아 토큰·컴포넌트·화면을 구현한 것이다. 현재 배포 코드(`apps/nod/public/styles.css`, 청록 계열)는 확정 브랜드가 아니며(`docs/design-context.md`), DESIGN.md의 크림·머스터드·손그림 방향이 기준이다.

## Sources

- 로컬 저장소 `nod/` (사용자 경로 `/Users/dnp-jidohyun/Developer/nod`)
  - `DESIGN.md` — 디자인 가이드 원본 (색·타이포·형태·간격·컴포넌트·아이콘·모션·적용 범위)
  - `docs/design-context.md`, `docs/decisions.md` — 제품 배경과 Phase 1 계약
  - `apps/nod/public/index.html`, `app.js`, `styles.css` — 현재 웹앱 화면 구조와 문구 (UI kit 문구는 여기서 그대로 가져옴)
  - `apps/nod/extension/options.html`, `options.css` — 확장 프로그램 설정 화면 (영어)
- GitHub `jidohyun/NOD` (main) — 로컬 폴더보다 범위가 넓은 저장소(apps/web·mobile·extension·api, packages/design-tokens). 여기서 **로고**(`apps/web/public/brand/`)와 **NanumSquareRound 웹폰트**(`apps/web/public/fonts/`)를 가져왔다. `packages/design-tokens`(shadcn형 OKLCH 회색+라임)와 `docs/design.md`(지식 diff 제품 설계)는 DESIGN.md의 시각 방향과 다르므로 참고만 했다.
- DESIGN.md가 참조한 원본 HTML(Creative Mind Map / Productivity Canvas)은 저장소에 없어 확인하지 못했다.

## Products represented

- **NOD 웹앱** (한국어) — 비로그인 랜딩, 로그인 후 라이브러리(목록·검색·삭제·더 보기·확장 연결 해제), 상태: 로딩·빈 화면·검색 결과 없음·조회 실패·삭제 결과·세션 만료.
- **NOD Save 확장 프로그램 설정** (영어) — 서비스 주소, 계정 연결, 마지막 활동.

## CONTENT FUNDAMENTALS

- 언어: 웹앱은 **한국어 존댓말(~하세요, ~입니다)**, 확장 설정은 영어. 전체 언어 정책은 미결정.
- 톤: 조용하고 직접적. 비유(씨앗 심기 등)는 소개문에서만 절제해 사용. 조작 문구는 직접적인 동사 — "저장", "검색", "다시 시도", "더 보기", "삭제", "연결 해제".
- 예시 문구 (app.js 원문): "읽고 싶은 순간을 놓치지 마세요.", "NOD는 나중에 다시 볼 웹페이지를 조용히 모아두는 개인 링크 라이브러리입니다.", "아직 저장한 링크가 없어요", "링크를 삭제하지 못했습니다. 다시 시도해 주세요."
- 제목은 친근한 반말형 어미(~없어요)도 쓰지만 안내·오류 본문은 존댓말로 구체적인 다음 행동을 알려준다.
- 상태 메시지는 항상 아이콘 + 문구. 색만으로 의미를 전달하지 않는다.
- 이모지 사용 안 함. 숫자 스텝은 노란 원형 배지.
- Phase 1에 없는 기능(AI 인사이트, 태그, 사용자 수 등)은 문구로도 등장시키지 않는다.

## VISUAL FOUNDATIONS

- **방향**: 따뜻한 종이 위 손그림. 크림 바탕(#FFFDFA), 머스터드 브랜드(#E8B931), 차콜 잉크(#4A4A4A). 민트·라벤더·코랄·세이지는 작은 영역의 보조색.
- **색 규칙**: 텍스트는 명시적 색(ink / #6B665C / #80620B). 투명도는 장식·구획에만. 노란 바탕 위 글자는 차콜. 상태색은 초록/노랑/빨강 bg-text 쌍 (`--status-*`).
- **타이포**: Fredoka(브랜드·제목 500–700), Quicksand(본문·UI 400–700), 한글은 **NanumSquareRound**(L/R/B/EB, 저장소 웹폰트) — 폰트 스택에서 라틴 뒤에 놓여 한글 글리프만 담당. 본문 16px/1.6, 링크 제목 18px/1.4, 메타 12–14px/1.5. 10px 레이블 금지. 제목 한글은 `word-break: keep-all`.
- **형태**: 카드·주요 CTA는 손그림 모서리(`--radius-doodle`)와 2–3px 차콜 테두리. 입력·작은 조작은 12px 일반 모서리. 패널 24px, 알약 999px. 유기형·블롭 라디우스는 장식 배경.
- **그림자**: 블러 없는 평면 오프셋 — sketch 4px, sketch-large 8px, hover는 6px 노란 오프셋. 발광 없음.
- **기울기**: 장식 카드 ±1–1.5°, 큰 프레임 ±3°, 작은 메모 최대 ±6°. 입력·목록·중요 조작은 수평.
- **배경**: 페이지에만 20px 도트 패턴(두 번째 레이어 10px 이동, 낮은 불투명도). 카드와 입력은 단색. 그라디언트·이미지·텍스처 없음.
- **간격**: 4·8·12·16·24·32·40·48·64·96·128. 좌우 여백 모바일 24 / 데스크톱 40. 랜딩 max 1280(12열, 히어로 7:5), 앱 본문 1152. 카드 내부 24, 설명 카드 40. 사이드바 채택 시 256.
- **상호작용**: hover 150–300ms, 그림자·색 변화 위주, 카드 이동 ≤4px. 주요 버튼 hover는 차콜 배경 + 흰 글자 + 노란 오프셋 그림자. pressed는 2px 이동 + 그림자 제거. focus-visible은 차콜 2px 외곽선, 2px 간격. 링크 행 hover는 테두리 강조.
- **모션**: 랜딩 장식만 6초 부유(20px, 2°). 목록·작업 화면은 정적. reduced-motion에서 모두 정지.
- **비활성/로딩**: opacity 0.55, 스피너는 아이콘 자리에 들어가 폭이 흔들리지 않음.
- **다크 모드**: 미설계 (라이트만).

## ICONOGRAPHY

- **Material Symbols Outlined** (Google Fonts CDN, `tokens/fonts.css`에서 로드). 기본 24px, 보조 20px, 장식 32–48px. wght 400, FILL 0(상태 배지만 FILL 1). `Icon` 컴포넌트로 사용.
- 이모지·유니코드 기호 아이콘 사용 안 함 (현재 코드의 "↗ ⌕ ×" 문자 아이콘은 Material Symbols로 교체).
- **로고**: `assets/nod-logo.png`(밝은 배경), `assets/nod-logo-dark-bg.png`(어두운 배경), `assets/nod-icon.png`(정방형 마크), `assets/nod-favicon-32.png`. GitHub 저장소 `apps/web/public/brand/`에서 복사. `Brand` 컴포넌트가 사용.

## Index

- `styles.css` — @import 진입점 → `tokens/` (fonts, colors, typography, spacing, shape, motion, base)
- `guidelines/` — 파운데이션 카드: 색(brand/accent/text/status), 타이포(brand/body/scale), 간격·레이아웃, 형태(radii/shadows/dots), 모션, 아이콘, 워드마크
- `components/actions/` — Icon, Button(primary·secondary·mint·plain·text), IconButton
- `components/forms/` — TextInput (검색·레이블·힌트·오류)
- `components/navigation/` — Brand, NavItem
- `components/display/` — LinkRow, InfoCard, Badge
- `components/feedback/` — Notice(시작 안내), StatusMessage, EmptyState(빈/검색 없음/오류·재시도), SkeletonRow
- `ui_kits/nod-web/` — 랜딩 → 라이브러리 클릭스루 (`index.html`, 상태별 `library*.html`), 전체 랜딩 페이지 (`landing-full.html`)
- `ui_kits/nod-extension/` — 확장 설정 화면
- `_cards/load.js` — 카드·UI kit 미리보기용 개발 로더 (Babel + esm.sh). 번들 소비자는 사용하지 않음.
- `SKILL.md` — 에이전트 스킬 진입점

## Intentional additions

- `Icon` — Material Symbols 래퍼 (DESIGN.md §7 아이콘 규격 적용).
- `StatusMessage`, `SkeletonRow` — DESIGN.md §9의 필수 상태(로딩·성공/실패)를 표현하기 위한 최소 요소.
- `--text-secondary`, `--text-accent`, 상태색 값은 DESIGN.md가 명시한 "가독성 보완 제안값"이며 실제 렌더링 대비 검증 대상.

## 미결정 (DESIGN.md 그대로)

실제 제품 이미지, 전체 언어 정책. (한글 서체와 로고는 GitHub 저장소 자산으로 채움 — 정식 확정 여부는 사용자 확인 필요.)
