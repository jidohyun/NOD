# NOD Agent North Star

**한 문장: 하네스는 유능한 판단자를 브리핑하고, 틀린 답이 밖으로 새는 경계에만 이빨을 남긴다.**

이 문서가 이 레포의 에이전트 운영 판정 기준이다. 다른 문서·훅·규칙이 이 문서와
충돌하면 고칠 대상은 그 표면이다. (원본 사상: corca-ai/charness design-north-star,
1인 레포 blast radius에 맞게 재보정.)

## 판정 함수

- **가역 작업 = 판단에 맡긴다.** 틀려도 이 세션의 편집 가능한 상태 안에 머무는 작업
  (코드 편집, 문서 초안, vault 자산 초안, 로컬 테스트)은 짧은 원칙 + 에이전트 판단이
  기본값이다. 여기에 게이트를 추가하려면 판단만으로 실패하는 이유를 입증해야 한다.
- **비가역 경계 = 성공은 잠정적.** 틀린 성공이 통제 밖으로 전파되는 작업은, 주장을
  만든 것과 **다른 증거 채널**로 확인하기 전까지 완료가 아니다. green 하나를 완료로
  믿는 것(terminal trust)이 금지 대상이다.
- 애매하면 비가역으로 분류한다.

## NOD의 비가역 경계 목록

1. **main push** — main push가 관련 Actions workflow를 트리거한다. API/Web/Worker는
   각 deploy workflow가 lint·typecheck·test 후 배포하고, Mobile은 `deploy-mobile.yml`
   내 lint·test와 빌드/배포를 수행한다. Extension은 `extension-v*` tag 또는 수동
   workflow에서 typecheck·build·package를 수행한다. push 성공 ≠ 검증·배포 성공:
   push 후 관련 run 상태를 push exit code와 다른 채널(gh run watch / Actions
   페이지)로 확인한다.
2. **DB migration** — 스키마는 공유 이력이다. `mise run db:migrate` 선행 없이 런타임
   검증을 완료로 선언하지 않는다 (AGENTS.md Schema Discipline).
3. **vault 자산의 relation 확정** — relation의 최종 확정은 항상 사용자 몫이다.
   LLM/에이전트는 제안까지만 한다 (docs/design.md 확정 결정).
4. **검증기·훅·게이트 코드 수정 (proof surface)** — 게이트를 만든 저자와 그 게이트의
   테스트는 같은 blind spot을 공유하는 단일 관찰자다. verdict를 내리는 코드를 고친
   변경은 별도 컨텍스트의 fresh-eye 리뷰(다른 에이전트 또는 사용자) 1회를 거친다.

## Standing Approvals

- **vault 자산 append**: 무조건 승인. 자산은 가역(파일 수정으로 정정 가능)이고,
  기록하지 않은 발견이 유실되는 것이 제거하려는 실패다. 단 relation 확정은 위 3번.
- **main push**: 로컬 게이트와 관련 Actions run 확인을 전제로 한 조건부 승인.
  mise pre-push(브랜치명 + 변경 앱 테스트)가 통과하고, push 후 관련 CI/배포 run을
  별도 채널에서 확인하면 push한다. **조건이 승인의 전부다** — `--no-verify`,
  테스트 스코프 축소, 훅 약화로 green을 만드는 순간 승인은 철회되고 명시적
  재승인이 필요하다.
- **deploy 워크플로 수동 트리거 / infra(Terraform) apply**: 매번 승인.

## 실패 시그니처 (이 문서를 잘못 쓰고 있다는 신호)

- 비가역 경계의 확인을 "같은 proxy 재확인"으로 때웠다 (push exit code를 두 번 읽기).
- 가역 작업에 의례를 추가하며 "철저함"이라 불렀다 — 줄 수 증감은 성공 지표가 아니다.
- 게이트가 거부하자 게이트를 고쳐서 통과시켰다 — 거부는 승인 철회 신호다.
