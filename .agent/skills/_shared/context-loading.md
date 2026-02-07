# Dynamic Context Loading Guide

Agents should not read all resources at once, but load only needed resources based on task type.
This saves context window and prevents confusion from irrelevant information.

---

## Loading Order (Common to All Agents)

### Always Load (Required)
1. `SKILL.md` — Auto-loaded (provided by Antigravity)
2. `resources/execution-protocol.md` — Execution protocol

### Load at Task Start
3. `../_shared/difficulty-guide.md` — Difficulty assessment (Step 0)

### Load Based on Difficulty
4. **Simple**: Implement immediately without additional loading
5. **Medium**: `resources/examples.md` (reference similar examples)
6. **Complex**: `resources/examples.md` + `resources/tech-stack.md` + `resources/snippets.md`

### Load During Execution as Needed
7. `resources/checklist.md` — Load at Step 4 (Verify)
8. `resources/error-playbook.md` — Load only when error occurs
9. `../_shared/common-checklist.md` — Final verification for Complex tasks
10. `../_shared/serena-memory-protocol.md` — Only in CLI mode

---

## Task Type → Resource Mapping by Agent

### Backend Agent

| Task Type | Required Resources |
|-----------|-------------------|
| Create CRUD API | snippets.md (route, schema, model, test) |
| Implement Auth | snippets.md (JWT, password) + tech-stack.md |
| DB Migration | snippets.md (migration) |
| Performance Optimization | examples.md (N+1 example) |
| Modify Existing Code | examples.md + Serena MCP |

### Frontend Agent

| Task Type | Required Resources |
|-----------|-------------------|
| Create Component | snippets.md (component, test) + component-template.tsx |
| Implement Form | snippets.md (form + Zod) |
| API Integration | snippets.md (TanStack Query) |
| Styling | tailwind-rules.md |
| Page Layout | snippets.md (grid) + examples.md |

### Mobile Agent

| Task Type | Required Resources |
|-----------|-------------------|
| Create Screen | snippets.md (screen, provider) + screen-template.dart |
| API Integration | snippets.md (repository, Dio) |
| Navigation | snippets.md (GoRouter) |
| Offline Feature | examples.md (offline example) |
| State Management | snippets.md (Riverpod) |

### Debug Agent

| Task Type | Required Resources |
|-----------|-------------------|
| Frontend Bug | common-patterns.md (Frontend section) |
| Backend Bug | common-patterns.md (Backend section) |
| Mobile Bug | common-patterns.md (Mobile section) |
| Performance Bug | common-patterns.md (Performance section) + debugging-checklist.md |
| Security Bug | common-patterns.md (Security section) |

### QA Agent

| Task Type | Required Resources |
|-----------|-------------------|
| Security Review | checklist.md (Security section) |
| Performance Review | checklist.md (Performance section) |
| Accessibility Review | checklist.md (Accessibility section) |
| Full Audit | checklist.md (full) + self-check.md |

### PM Agent

| Task Type | Required Resources |
|-----------|-------------------|
| New Project Plan | examples.md + task-template.json + api-contracts/template.md |
| Feature Addition Plan | examples.md + Serena MCP (understand existing structure) |
| Refactoring Plan | Serena MCP only |

---

## Orchestrator Exclusive: When Constructing Subagent Prompts

When Orchestrator constructs subagent prompts, reference the mapping above to
include only resource paths matching the task type in the prompt.

```
Prompt Construction:
1. Core Rules section from agent's SKILL.md
2. execution-protocol.md
3. Resources matching task type (see tables above)
4. error-playbook.md (always include — recovery is essential)
5. Serena Memory Protocol (CLI mode)
```

This maximizes subagent context efficiency by not loading unnecessary resources.
