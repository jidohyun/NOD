# Reasoning Templates

Use these templates by filling in the blanks when multi-step reasoning is required.
To avoid losing direction, proceed to the next step **after completing each step**.

---

## 1. Debugging Reasoning (Debug Agent, Backend/Frontend/Mobile Agent)

Repeat the loop below when finding bug causes. If unresolved after max 3 iterations, record `Status: blocked`.

```
=== Hypothesis #{N} ===

Observation: {error message, symptoms, reproduction conditions}
Hypothesis: "{phenomenon} is caused by {suspected cause}"
Verification Method: {how to confirm — code reading, logs, tests, etc.}
Verification Result: {what was actually confirmed}
Verdict: Correct / Incorrect

If correct → Move to fix stage
If incorrect → Write new hypothesis #{N+1}
```

**Example:**
```
=== Hypothesis #1 ===
Observation: "Cannot read property 'map' of undefined" in TodoList
Hypothesis: "todos is undefined when .map() is called before API response"
Verification Method: Check initial value of todos in TodoList component
Verification Result: No initial value in useState() → undefined
Verdict: Correct → Set default value of todos to []
```

---

## 2. Architecture Decision (PM Agent, Backend Agent)

Fill in this matrix when technical choices or design decisions are needed.

```
=== Decision: {what needs to be chosen} ===

Options:
  A: {Option A}
  B: {Option B}
  C: {Option C} (if any)

Evaluation Criteria and Scores (1-5):
| Criterion           | A | B | C | Weight |
|---------------------|---|---|---|--------|
| Performance         |   |   |   | {H/M/L} |
| Implementation Complexity |   |   |   | {H/M/L} |
| Team Familiarity    |   |   |   | {H/M/L} |
| Scalability         |   |   |   | {H/M/L} |
| Existing Code Consistency |   |   |   | {H/M/L} |

Conclusion: {option}
Reason: {1-2 line rationale}
Tradeoff: {why giving up advantages of unchosen options}
```

**Example:**
```
=== Decision: State Management Library ===

Options:
  A: Zustand
  B: Redux Toolkit
  C: React Context

| Criterion           | A | B | C | Weight |
|---------------------|---|---|---|--------|
| Performance         | 4 | 4 | 3 | M     |
| Implementation Complexity | 5 | 3 | 4 | H     |
| Team Familiarity    | 3 | 5 | 5 | M     |
| Scalability         | 4 | 5 | 2 | M     |
| Existing Code Consistency | 2 | 5 | 3 | H |

Conclusion: Redux Toolkit
Reason: Existing code uses RTK, team familiarity is highest
Tradeoff: Giving up Zustand's simplicity but ensuring consistency
```

---

## 3. Cause-Effect Chain (Debug Agent)

Use when tracing execution flow step-by-step in complex bugs.

```
=== Execution Flow Trace ===

1. [Entry Point]   {file:function} - {input value}
2. [Call]          {file:function} - {passed value}
3. [Processing]    {file:function} - {transformation/logic}
4. [Failure Point] {file:function} - {something different from expected happens here}
   - Expected: {expected behavior}
   - Actual: {actual behavior}
   - Cause: {why different}
5. [Result]        {error message or incorrect output}
```

**Example:**
```
1. [Entry Point]   pages/todos.tsx:TodoPage - user accesses /todos
2. [Call]          hooks/useTodos.ts:useTodos - fetchTodos() called
3. [Processing]    api/todos.ts:fetchTodos - GET /api/todos request
4. [Failure Point] hooks/useTodos.ts:23 - data returned as undefined
   - Expected: data = [] (empty array)
   - Actual: data = undefined (before fetch complete)
   - Cause: initialData not set in useQuery
5. [Result]        undefined.map() in TodoList → TypeError
```

---

## 4. Refactoring Judgment (All Implementation Agents)

Use when deciding "should I fix it or leave it as is" when modifying code.

```
=== Refactoring Judgment ===

Current Code Problem: {what is the problem}
Relation to Task: Directly related / Indirectly related / Unrelated

Directly related → Fix it
Indirectly related → Record in result, fix only within current task scope
Unrelated → Record only in result (never fix)
```

---

## 5. Performance Bottleneck Analysis (Debug Agent, QA Agent)

Systematically find bottlenecks for "it's slow" reports.

```
=== Performance Bottleneck Analysis ===

Measurements:
  - Total response time: {ms}
  - DB query time: {ms} ({N} queries)
  - Business logic: {ms}
  - Serialization/Rendering: {ms}

Bottleneck Location: {stage taking longest time}
Cause: {N+1 query / heavy computation / large response / missing index / ...}
Solution: {specific fix method}
Expected Improvement: {X}ms → {Y}ms
```

---

## Usage Rules

1. **When to use**: Required for Complex difficulty tasks, recommended for Medium
2. **Where to record**: Record reasoning process in `progress-{agent-id}.md`
3. **If can't fill blanks**: First collect that information (Serena, code reading, log checking)
4. **If unresolved after 3 iterations**: `Status: blocked` + include reasoning so far in result
