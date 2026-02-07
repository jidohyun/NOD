# PM Agent - Error Recovery Playbook

When you encounter a failure during planning, follow these recovery steps.

---

## Requirements Ambiguous

**Symptoms**: User request is vague ("좋은 앱 만들어줘", "Make it better")

1. Break down what you DO understand
2. List specific assumptions you're making
3. Create plan based on reasonable assumptions
4. Mark assumptions clearly: `⚠️ Assumption: [description]`
5. **절대 하지 말 것**: 모호한 채로 태스크를 생성 — 에이전트가 방향을 잃음

---

## Existing Codebase Unknown

**Symptoms**: Planning for an existing project but don't know the architecture

1. Use Serena: `get_symbols_overview("src/")` or `get_symbols_overview("app/")`
2. Look for framework indicators: `package.json`, `pyproject.toml`, `pubspec.yaml`
3. Check for existing patterns: `search_for_pattern("@app.get|@app.post")` (FastAPI)
4. If Serena unavailable: note in plan "architecture assumptions — verify before execution"

---

## Task Decomposition Too Granular or Too Coarse

**Self-check**:
- Each task should take 1 agent, 10-20 turns
- If a task needs < 5 turns: merge with a related task
- If a task needs > 30 turns: split into sub-tasks
- If unsure: err on the side of fewer, larger tasks

---

## Dependency Deadlock

**Symptoms**: Task A depends on B, B depends on A (circular)

1. Identify the cycle
2. Break it by defining an API contract or shared interface first
3. Create a priority-0 task: "Define API contracts" (no dependencies)
4. Both tasks then depend on the contract, not on each other

---

## Tech Stack Decision Unclear

**Symptoms**: Multiple valid options, no clear winner

1. Check existing codebase — consistency wins over "better" tech
2. If greenfield: use the project's default stack (see SKILL.md tech-stack references)
3. Default choices:
   - Frontend: Next.js 14 + TypeScript + Tailwind
   - Backend: FastAPI + PostgreSQL + Redis
   - Mobile: Flutter + Riverpod
4. Note decision rationale in plan: `tech_decision: { choice: "X", reason: "Y" }`

---

## Serena Memory / Quota Issues

동일: backend-agent 플레이북의 해당 섹션 참조.

---

## 일반 원칙

- **계획은 코드가 아님**: 완벽하지 않아도 됨. 에이전트가 실행 중 조정할 수 있음
- **막힘**: 5턴 이상 진전 없으면 현재 상태 저장, `Status: blocked`
- **코드 작성 금지**: PM은 계획만 — 구현은 다른 에이전트에게 위임
