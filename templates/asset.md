---
# 자산 스키마 v1 — canonical 4필드 (설계서 2026-08-09 승인)
# 파일명 = URL 정규화 슬러그 (쿼리스트링·fragment·trailing slash 제거)
url: https://example.com/article
captured_at: 2026-08-09
claims:
  # 아티클이 주장하는 것, 1~3개. 요약이 아니라 "주장" — 참/거짓을 따질 수 있는 문장.
  - id: c1
    text: ""
relations:
  # 이 주장이 내 기존 지식과 어떤 관계인가. A0/A 단계에서 target은 비워도 됨(null).
  # type: new | supports | conflicts | qualifies
  - claim: c1
    type: new
    target: null   # 예: some-asset-slug#c1
    note: ""
---

## Context

<!-- 왜 이 글을 읽었나, 어떤 리서치 흐름에서 만났나. 2~3문장. -->

## Evidence

<!-- claim을 뒷받침하는 원문 인용. claim ID를 붙여 앵커. -->

> (c1) "원문 인용"
