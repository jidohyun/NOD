# Workflow Guide - Examples

## Example 1: Full-Stack TODO App

**Input**: "JWT 인증이 있는 TODO 앱을 만들어줘"

**Workflow**:
```
Step 1: PM Agent plans the project
  -> 5 tasks: auth API, CRUD API, login UI, todo UI, QA review

Step 2: Spawn Priority 1 agents in Agent Manager
  - Backend Agent: "JWT authentication API + TODO CRUD"
  - Frontend Agent: "Login/Register UI"
  (Both run in parallel - no dependencies)

Step 3: Monitor progress
  - Check Agent Manager inbox for questions
  - Verify API contracts align between backend/frontend

Step 4: Spawn Priority 2 after P1 completes
  - Frontend Agent: "TODO List UI" (uses backend API contracts from P1)

Step 5: Spawn Priority 3
  - QA Agent: "Security + Performance review of all deliverables"

Step 6: Address QA findings
  - Re-spawn agents for CRITICAL/HIGH issues
  - Verify fixes
```

## Example 2: Adding Feature to Existing App

**Input**: "블로그에 댓글 기능을 추가해줘"

**Workflow**:
```
Step 1: PM Agent analyzes existing codebase and plans
  -> 2 tasks: Comments API, Comment Section UI

Step 2: Spawn Backend Agent first (API-first)
  - "Comments API with nested replies, pagination"

Step 3: After backend completes, spawn Frontend Agent
  - "Comment section UI using the new API endpoints"
  (Sequential because frontend depends on API contracts)

Step 4: QA review
  - Security: XSS in comments, rate limiting
  - Performance: Pagination, N+1 queries
```

## Example 3: When to Use Orchestrator Instead

**User**: "자동으로 실행해줘" / "Run everything automatically"

**Response**:
```
"You want fully automated execution. Let me switch to the
orchestrator skill instead, which will:
1. Spawn CLI subagents automatically
2. Coordinate via Serena Memory
3. Monitor progress and handle retries
4. Return unified results

Use workflow-guide when you want manual control.
Use orchestrator when you want hands-off automation."
```
