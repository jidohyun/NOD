# NOD

NOD는 개인 링크 보관함입니다. Manifest V3 브라우저 확장이 현재 페이지를 저장하고, 웹 앱에서 로그인한 사용자가 자신의 링크를 목록·검색·원문 열기·삭제할 수 있습니다.

Phase 1은 URL, 제목, 출처, 저장 시각만 보관합니다. 본문을 수집하거나 AI 분석을 하지 않습니다.

## 현재 구현

현재 제품은 [`apps/nod`](apps/nod) 하나입니다.

- Cloudflare Worker + D1 API와 사용자 데이터
- public vanilla HTML, CSS, JavaScript 웹 앱
- `apps/nod/extension`의 Manifest V3 확장

HTML(구조), CSS(스타일), JavaScript(동작)를 분리해 유지합니다. 디자인이 확정되기 전에는 스타일 고도화, UI 프레임워크, 불필요한 UI 추상화를 추가하지 않습니다.

## 로컬 실행
Bun과 Node.js 22 이상이 필요합니다.

모든 명령은 `apps/nod`에서 실행합니다.

```bash
bun install --frozen-lockfile
bun run db:local
bun run dev
```

로컬 주소는 `http://localhost:8787`입니다.

```bash
bun run check # JavaScript 구문 검사
bun run build # Wrangler 배포 dry-run; 원격 배포는 하지 않음
```

Google OAuth 설정은 Git에서 제외된 `apps/nod/.dev.vars`에 둡니다. 자격증명 값은 읽거나, 커밋하거나, 문서에 적지 마세요. 별도 개발 환경에는 각자 승인된 설정이 필요합니다.

## 확장 로드

Chromium 계열 브라우저의 확장 관리 페이지에서 개발자 모드를 켠 뒤 `apps/nod/extension`을 압축 해제된 확장으로 로드합니다. 로컬 사용 시 확장 옵션의 서비스 주소를 `http://localhost:8787`로 지정합니다.

## 상태와 운영

제품 계약은 [결정 기록](docs/decisions.md), 확인된 동작과 한계는 [handoff](docs/handoff.md)를 따릅니다. 원격 배포와 DNS 전환은 아직 완료되지 않았습니다.

커밋, push, 배포는 사용자 또는 저장소 소유자의 명시적 승인이 있을 때만 합니다. 로컬 변경이나 검사 성공은 그 승인이 아닙니다.

## 라이선스

[MIT](LICENSE)
