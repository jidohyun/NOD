---
url: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
captured_at: 2026-08-09
claims:
  - id: c1
    text: "표준 RAG는 질의마다 원문에서 지식을 처음부터 재합성하며, 질의 간 지식 축적이 없다"
  - id: c2
    text: "Karpathy의 LLM Wiki 패턴은 Raw sources(불변) → Wiki(LLM 유지) → Schema(설정) 3계층과 Ingest/Query/Lint 3연산으로 구성된다"
relations:
  - claim: c1
    type: supports
    target: null
    note: "NOD의 존재 이유 — '읽기가 복리로 쌓이는 변환'이라는 전제를 RAG 비판 형태로 독립 진술"
  - claim: c2
    type: qualifies
    target: null
    note: "NOD 설계에 대한 조건부 수정 — 아티클당 자산이 최종 산물인 NOD와 달리, LLM이 유지하는 합성 위키 페이지가 산물. B 단계 '자산 위 매칭' 설계의 대안: '자산 위 합성 레이어'"
---

## Context

A0 다섯 번째(마지막) 자산 — 아이디어 문서형. Karpathy의 LLM Wiki gist. NOD와 같은 문제(지식 축적)를 다루는 인접 설계라 relation 필드가 처음으로 실질 작동한 자산.

## Evidence

> (c1) "the LLM is rediscovering knowledge from scratch on every question. There's no accumulation"
> (c2) "a structured, interlinked collection of markdown files" — Raw sources / Wiki / Schema 3계층, Ingest / Query / Lint 3연산 정의부

## 기준 적용 메모 (A0 검증용)

- 제외: "인간 큐레이션 + LLM 유지보수가 이상적"(제안), "LLMs don't get bored"(수사), Memex 유사성(해석)
- **발견 1 (structures 4번째, 극단):** 이 글은 가치의 90%가 구조물(3계층·3연산·index/log 규약). c2는 구조물을 "저자의 패턴은 X로 구성된다"는 메타 claim으로 우회 수록 — 이 탈출구를 무제한 허용하면 규칙 2가 무력화됨. **메타 claim 허용 조건은 v1.1 필수 결정 항목.**
- **발견 2:** relation이 자산↔자산이 아니라 자산↔내 설계 결정을 가리킴 — target의 범위 확장 신호.
