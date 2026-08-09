# NOD Claim 작성 기준 v1

> 연구 근거 기반. A0 수동 작성 체크리스트이자, A 단계 LLM 추출 프롬프트의 원천 문서.

## 정의

**claim = 출처 하나로 참/거짓을 판정할 수 있는, 홀로 해석 가능한 최소 진술.**
(SciFact의 "atomic verifiable statement … verified from a single source" + Molecular Facts의 decontextuality/minimality 결합)

## 규칙 5개

1. **원자적이되 molecular 수준으로.** 극한 원자 분해는 맥락을 잃어 오판을 만든다.
   기준: 홀로 해석 가능한가(decontextuality) + 그러기 위한 추가 정보는 최소인가(minimality).
   - ✗ "그 방법은 효과적이다"
   - ✓ "3~5개의 보정된 LLM 판정자가 20~30개의 노이지한 판정자보다 낫다"
2. **검증 가능한 것만, 단 의견 속 사실은 건진다.** 의견·당위("~해야 한다")는 claim이 아니다.
   그러나 의견 문장 안에 박힌 검증 가능한 사실을 통째로 버리는 것이 대표적 실수 — 껍질을 벗기고 사실만 추출.
3. **복합 주장은 쪼갠다.** "A하고 B한다"는 claim 2개. 단 규칙 1의 하한선까지만.
4. **중요한가는 묻지 않는다.** check-worthiness는 본질적으로 주관적 — 정의에 넣으면 판단 일관성이 무너진다(합의 α 0.46).
   무엇을 남길지의 선택은 relation·note의 몫. claim은 checkable하기만 하면 된다.
5. **모호하면 뽑지 않는다.** 해석이 여럿인 문장은 확신되는 해석일 때만 추출 (Claimify의 Disambiguation 게이트).

## 실패 모드 체크리스트

- [ ] 개인 경험 진술을 claim으로 넣지 않았는가 (사실이어도 공개 증거로 검증 불가)
- [ ] 수사의문문 속 주장을 놓치지 않았는가
- [ ] (LLM) 원문에 없는 정보가 주입되지 않았는가 → **역검증: 각 claim이 Evidence 인용에서 entail되는가**
- [ ] 동어반복·중복 claim이 없는가

## 스키마와의 연결

- claim 1~3개 상한 = SciFact 어노테이션 프로토콜(citance당 최대 3개)과 일치
- `(cN)` Evidence 앵커 = entailment 역검증 장치 — claim마다 반드시 원문 인용이 있어야 한다

## 출처

- SciFact — Wadden et al., EMNLP 2020. https://arxiv.org/abs/2004.14974
- Molecular Facts — Gunjal & Durrett, Findings of EMNLP 2024. https://arxiv.org/abs/2406.20079
- VeriScore — Song, Kim, Iyyer, Findings of EMNLP 2024. https://arxiv.org/abs/2406.19276
- Claimify — Metropolitansky & Larson (MSR), 2025. https://arxiv.org/abs/2502.10855
- AFaCTA — Ni et al., ACL 2024. https://arxiv.org/abs/2402.11073
- Full Fact annotation schema — Konstantinovskiy et al., 2018. https://arxiv.org/abs/1809.08193
- FActScore — Min et al., EMNLP 2023. https://aclanthology.org/2023.emnlp-main.741/
- DnDScore — Wanner et al., 2024. https://arxiv.org/abs/2412.13175
- Decomposition Dilemmas — Hu et al., 2024. https://arxiv.org/abs/2411.02400
- ClaimBuster — Hassan et al., KDD 2017. https://dl.acm.org/doi/10.1145/3097983.3098131
