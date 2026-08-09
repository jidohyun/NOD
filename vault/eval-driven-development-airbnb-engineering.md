---
url: https://medium.com/airbnb-engineering/eval-driven-development-lessons-from-evaluating-genai-at-scale-e817e5ae5788
captured_at: 2026-08-09
claims:
  - id: c1
    text: "3~5개의 잘 보정된 LLM 판정자가, 각각 하나의 정확성 차원만 겨냥할 때, 20~30개의 노이지한 판정자보다 낫다"
  - id: c2
    text: "보정되지 않은 LLM 판정자는 거짓 확신을 주기 때문에 판정자가 없는 것보다 나쁘다"
  - id: c3
    text: "다단계 에이전트 시스템에서 최종 출력만 평가하는 것은 불충분하다 — 올바른 최종 답이 망가진 추론 경로를 가릴 수 있다"
relations:
  - claim: c1
    type: qualifies
    target: null
    note: "'eval은 많을수록 좋다'는 통념을 수정 — 개수가 아니라 보정이 병목. NOD 설계의 '고정 아티클 3개 eval 셋' 결정과 방향 일치"
  - claim: c2
    type: new
    target: null
    note: "없는 것보다 나쁘다는 강한 형태는 처음 접함. NOD A단계 eval 만들 때 보정(사람 라벨과 대조) 단계를 넣어야 한다는 뜻"
  - claim: c3
    type: supports
    target: null
    note: "에이전트 파이프라인 디버깅 경험과 일치 — 결과가 맞아도 경로가 운빨인 경우"
---

## Context

A0 첫 실전 자산. GeekNews 상위(p14)에서 발견. NOD 자체가 LLM 추출 파이프라인 + eval 셋을 계획하고 있어, 설계 결정(eng-review 5A: 고정 3개 eval)과 직접 맞닿는 글.

## Evidence

> (c1) "3–5 well-calibrated LLM-as-judge evaluators beat 20–30 noisy ones. Each should target one specific correctness dimension."
> (c2) "A virtual judge that hasn't been calibrated is worse than no judge at all, because it gives you false confidence."
> (c3) "Evaluating only the final output is insufficient: a correct final answer can mask a broken reasoning path."

## 기준 적용 메모 (A0 검증용)

- 제외: "평가에 프로젝트 노력의 상당 부분을 써라"(당위, 규칙 2), "데이터 탐색이 어떤 프레임워크보다 품질에 기여한다"(비교 대상이 모호해 검증 불가, 규칙 5)
- c1은 원문이 이미 molecular — 쪼개면(3~5개가 낫다 / 각자 한 차원) decontextuality가 깨져서 유지 (규칙 1·3)
