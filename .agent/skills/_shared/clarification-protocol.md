# Clarification Protocol

When requirements are ambiguous, "assuming and proceeding" usually leads to the wrong direction.
Follow this protocol to secure clear requirements before execution.

---

## Required Confirmation Items

If any of the items below are unclear, **do not assume** — explicitly document them.

### Common to All Agents
| Item | Confirmation Question | Default (when assuming) |
|------|----------------------|------------------------|
| Target Users | Who will use this service? | General web users |
| Core Features | What are the 3 must-have features? | Infer from task description |
| Tech Stack | Are there specific framework constraints? | Project default stack |
| Authentication | Is login required? | Include JWT auth |
| Scope | Is this MVP or full feature? | MVP |

### Backend Agent Additional Confirmations
| Item | Confirmation Question | Default |
|------|----------------------|---------|
| DB Choice | PostgreSQL? MongoDB? SQLite? | PostgreSQL |
| API Style | REST? GraphQL? | REST |
| Auth Method | JWT? Session? OAuth? | JWT (access + refresh) |
| File Upload | Required? Size limit? | Not required |

### Frontend Agent Additional Confirmations
| Item | Confirmation Question | Default |
|------|----------------------|---------|
| SSR/CSR | Server-side rendering needed? | Next.js App Router (SSR) |
| Dark Mode | Support required? | Supported |
| i18n | Multi-language support? | Not required |
| Existing Design System | UI library to use? | shadcn/ui |

### Mobile Agent Additional Confirmations
| Item | Confirmation Question | Default |
|------|----------------------|---------|
| Platform | iOS only? Android only? Both? | Both |
| Offline | Offline support needed? | Not required |
| Push Notifications | Required? | Not required |
| Minimum OS | iOS/Android minimum version? | iOS 14+, Android API 24+ |

---

## Response by Ambiguity Level

### Level 1: Slightly Ambiguous (Core is clear, details missing)
Example: "Create a TODO app"

**Response**: Apply defaults and record assumptions in result
```
⚠️ Assumptions:
- JWT authentication included
- PostgreSQL database
- REST API
- MVP scope (CRUD only)
```

### Level 2: Considerably Ambiguous (Core features unclear)
Example: "Create a user management system"

**Response**: Narrow down to 3 core features and proceed
```
⚠️ Interpreted scope (3 core features):
1. User registration + login (JWT)
2. Profile management (view/edit)
3. Admin user list (admin role only)

NOT included (would need separate task):
- Role-based access control (beyond admin/user)
- Social login (OAuth)
- Email verification
```

### Level 3: Highly Ambiguous (Direction itself unclear)
Example: "Make a good app", "Improve this"

**Response**: Do not proceed, record clarification request in result
```
❌ Cannot proceed: Requirements too ambiguous

Questions needed:
1. What is the app's primary purpose?
2. Who are the target users?
3. What are the 3 must-have features?
4. Are there existing designs or wireframes?

Status: blocked (awaiting clarification)
```

---

## PM Agent Exclusive: Requirements Specification Framework

When PM Agent receives an ambiguous request, use this framework to clarify:

```
=== Requirements Specification ===

Original Request: "{user's original text}"

1. Core Goal: {define in one sentence}
2. User Stories:
   - "As a {user}, I want to {action} so that {benefit}"
   - (minimum 3)
3. Feature Scope:
   - Must-have: {list}
   - Nice-to-have: {list}
   - Out-of-scope: {list}
4. Technical Constraints:
   - {existing code / stack / compatibility}
5. Success Criteria:
   - {measurable conditions}
```

---

## Application in Subagent Mode

CLI subagents cannot ask questions directly to users.
Therefore:

1. **Level 1**: Apply defaults + record assumptions → proceed
2. **Level 2**: Narrow and interpret scope + document → proceed
3. **Level 3**: `Status: blocked` + question list → do not proceed

When Orchestrator receives a Level 3 result, it forwards the questions to the user,
and after receiving answers, re-runs the agent.
