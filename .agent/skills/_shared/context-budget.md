# Context Budget Management

Context windows are finite. Especially with Flash-tier models, unnecessary loading directly degrades performance.
Follow this guide to use context efficiently.

---

## Core Principles

1. **No full file reading** — Read only needed functions/classes
2. **No duplicate reading** — Don't re-read files already read
3. **Lazy resource loading** — Load only needed resources at the time of need
4. **Maintain records** — Note read files and symbols in progress

---

## File Reading Strategy

### When Using Serena MCP (Recommended)

```
❌ Bad: read_file("app/api/todos.py")          ← entire file 500 lines
✅ Good: find_symbol("create_todo")              ← that function 30 lines
✅ Good: get_symbols_overview("app/api")          ← function list only
✅ Good: find_referencing_symbols("TodoService")  ← usage only
```

### When Reading Files Without Serena

```
❌ Bad: Read entire file at once
✅ Good: Check first 50 lines (import + class definition) → read only needed functions additionally
```

---

## Resource Loading Budget

### Flash-tier Models (128K context)

| Category | Budget | Notes |
|----------|--------|-------|
| SKILL.md | ~800 tokens | Auto-loaded |
| execution-protocol.md | ~500 tokens | Always loaded |
| Task resource 1 | ~500 tokens | Selected by difficulty |
| Task resource 2 | ~500 tokens | Complex only |
| error-playbook.md | ~800 tokens | Only on error |
| **Total resource budget** | **~3,100 tokens** | ~2.4% of total |
| **Working budget** | **~125K tokens** | All remaining |

### Pro-tier Models (1M+ context)

| Category | Budget | Notes |
|----------|--------|-------|
| Resource budget | ~5,000 tokens | Can load generously |
| Working budget | ~1M tokens | Large files possible |

Pro has less budget pressure, but unnecessary loading still distracts attention.

---

## Tracking Read Files (Record in progress)

Agents record read files/symbols when updating progress:

```markdown
## Turn 3 Progress

### Files Read
- app/api/todos.py: create_todo(), update_todo() (find_symbol)
- app/models/todo.py: Todo class (find_symbol)
- app/schemas/todo.py: entire file (short file, 40 lines)

### Files Not Yet Read
- app/services/todo_service.py (will read next turn)
- tests/test_todos.py (reference after implementation)

### Work Performed
- Added priority field to TodoCreate schema
```

This way:
- No duplicate reading of same files
- Clear what to do next turn
- Orchestrator can understand agent state

---

## Large File Handling Strategy

### Files Over 500 Lines

1. Understand structure with `get_symbols_overview`
2. Read only needed symbols with `find_symbol`
3. Never read entire file

### Complex Components (React/Flutter)

1. First read only component's props/state definitions
2. Read render/build method only when modification needed
3. Skip style portions unless they're modification targets

### Test Files

1. Read only after implementation complete (unnecessary before)
2. Check existing test patterns only (first 1-2 test functions)
3. Write remaining tests following the pattern

---

## Context Overflow Signs & Responses

| Sign | Meaning | Response |
|------|---------|----------|
| Forgetting previously read code | Context window exhausted | Note key info in progress, make re-referenceable |
| Reading same file repeatedly | Poor tracking | Check "Files Read" list in progress |
| Output suddenly becomes short | Output tokens insufficient | Write only essentials, omit extra explanation |
| Ignoring instructions | SKILL.md content forgotten | Re-reference execution-protocol essentials only |
