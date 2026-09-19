repo: jidohyun/NOD
branch: main

## Last sync
date: 2026-09-13T10:16:25Z
### Updated in this project
- 저장소 랜딩 구조(components/landing/*)를 참고해 전체 랜딩 landing-full.html 추가 (Phase 1 범위, 문구 새로 작성)
- 섹션 구성: Nav · Hero · Product preview · CTA · Footer

## Sync history
### 2026-09-13T09:36:08Z
- 로고·아이콘 4종을 assets/ 로 복사하고 Brand 컴포넌트가 실제 로고를 사용
- NanumSquareRound 웹폰트 4종을 assets/fonts/ 로 복사, 한글 폰트 스택에 연결
- docs/design.md, packages/design-tokens/src/tokens.ts 는 참고만 함 (DESIGN.md 시각 방향 유지)

## Screen map
| Project screen | Repo files |
| --- | --- |
| ui_kits/nod-web/Landing.jsx, Library.jsx, Header.jsx | (로컬 폴더 nod/apps/nod/public/app.js, index.html — GitHub에는 apps/web/src 로 재구성됨, 미대응) |
| ui_kits/nod-extension/Options.jsx | (로컬 폴더 nod/apps/nod/extension/options.html — GitHub apps/extension/src, 미대응) |
| ui_kits/nod-web/LandingFull.jsx, landing-full.html | apps/web/src/app/[locale]/page.tsx, apps/web/src/components/landing/{hero,features,how-it-works,cta,footer}.tsx (구조 참고; 문구·범위는 DESIGN.md Phase 1) |
| components/navigation/Brand.jsx, assets/nod-*.png | apps/web/public/brand/* |
| tokens/fonts.css, assets/fonts/* | apps/web/public/fonts/NanumSquareRound*.woff2 |
