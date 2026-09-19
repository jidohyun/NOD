# NOD web app UI kit

Recreation of `apps/nod/public` (index.html + app.js) restyled per DESIGN.md. Copy is verbatim from app.js.

- `index.html` — interactive: landing → Google 로그인 → 라이브러리. Query params: `?screen=library&state=ready|loading|error|notice`.
- `landing-scroll.html` / `LandingScroll.jsx` + `scroll.js` + `landing-fonts.css` — 에세이형 랜딩. 히어로(220vh 핀): read-later 군더더기 12개가 스크롤 진행 0–0.8에서 하나씩 벗겨지고 0.8–1.0에서 URL·제목·출처·저장 시각 4줄만 정착(손그림 테두리 + 노랑). 이후 "하지 않는 것"(취소선 목록 5열 / 큰 숫자 7열) → 제품 화면 크롭(검색 + 3행) → 마무리 CTA(손그림 버튼) → 푸터. 랜딩 전용 서체: Gmarket Sans Bold(제목) + Pretendard(본문), Fredoka는 워드마크·숫자만. 잉크 #1A1A1A.
- `landing-full.html` / `LandingFull.jsx` — 전체 랜딩(Nav · Hero · 라이브러리 미리보기 · CTA · Footer). Phase 1 범위, 스크롤 reveal만. 문구는 새로 작성.
- `Landing.jsx` — 비로그인 홈 (hero 7:5, 확장 안내 카드, 부유 장식).
- `Library.jsx` — 저장한 링크 목록, 검색, 상태줄, 빈 화면/검색 결과 없음/오류·재시도, 더 보기, 확장 연결 안내와 연결 해제.
- `Header.jsx` — 브랜드 워드마크, 계정 정보, 로그아웃.
- `App.jsx` — fake state machine + sample data.

Not in Phase 1 (intentionally absent): tags, folders, AI summaries, thumbnails, read status.
