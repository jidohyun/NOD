# Article Detail Share Layout Revamp Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reposition summary share UI so users read first, share second, while preserving owner control actions (generate/copy/revoke) and improving share discoverability during scroll.

**Architecture:** Keep existing API/data hooks in `apps/web/src/lib/api/articles.ts` unchanged. Implement layout-first refactor inside `apps/web/src/components/articles/article-detail.tsx` with minimal new abstraction. Add a small presentational share panel component only if needed for mobile/desktop parity and testability.

**Tech Stack:** Next.js App Router, React client components, Tailwind CSS, Vitest + Testing Library, next-intl.

---

## 0) Current Problem Summary

Current placement (`apps/web/src/components/articles/article-detail.tsx`) puts the share section before primary summary content blocks.

- Reading flow is interrupted by management actions.
- `Generate/Copy/Revoke` sit at the same visual level too early.
- Share controls are not persistent while reading long summaries.
- Destructive action (`Revoke`) is overexposed for first-run flow.

## 1) Target UX Outcomes (Success Criteria)

1. Users can reach and consume summary content without action-first interruption.
2. Share CTA remains discoverable even after scrolling.
3. Destructive action is clearly secondary.
4. Mobile and desktop preserve equivalent capability.

### KPI Targets (2-week post-release)

- `summary_read_depth` (>=50% scroll) +10%
- `share_generate_click_rate` +8%
- `share_copy_after_generate_rate` +12%
- `revoke_misclick_rate` -30%

## 2) Recommended Layout Direction (Chosen)

### Direction C (Recommended): Contextual + Persistent Hybrid

- Keep one compact share trigger near summary content.
- Add persistent share affordance while scrolling.
  - Desktop: right sticky rail panel.
  - Mobile: bottom sticky action bar.
- Move advanced actions into expandable panel.
- Keep `Revoke` hidden under secondary disclosure.

Why this direction:

- Preserves read-first narrative.
- Increases discoverability on long pages.
- Reduces cognitive load by progressive disclosure.

## 3) Wireframe-Level Placement Spec

### Desktop (`lg+`)

1. Header section: title/status/date/original link + edit/delete/restore actions only.
2. Summary content stack starts immediately after header.
3. Sticky rail on right side (`top: 96px`):
   - Primary CTA: `Share this summary`
   - On click: panel reveals URL block + `Copy`
   - Secondary accordion: `Advanced` -> `Regenerate`, `Revoke`
4. Inline summary end cap CTA (after key points):
   - `Share this summary` (same action state as rail)

### Mobile (`<lg`)

1. No right rail.
2. Sticky bottom bar with one primary button: `Share summary`.
3. Tap opens bottom sheet:
   - URL preview + Copy
   - Secondary row: Regenerate
   - Danger zone collapsed by default: Revoke
4. Inline end cap CTA remains (fallback if sticky hidden by browser UI).

## 4) Interaction Model

### Primary path

1. User reads summary.
2. User taps/clicks `Share this summary`.
3. If no link: generate + show loading state.
4. URL shown with `Copy` as primary next action.
5. Success toast/message confirms copy.

### Secondary path

- `Regenerate` available in advanced area.
- `Revoke` requires confirm step (`Confirm revoke`) before execute.

### Loading/Failure states

- Generate pending: disabled primary button + spinner + `Generating link...`
- Copy failure: inline error text and retry action.
- Revoke failure: keep panel open + error feedback.

## 5) Accessibility and UX Rules

- All actions keyboard reachable in logical order.
- Focus trap for mobile bottom sheet.
- `aria-expanded`/`aria-controls` for advanced disclosure.
- Color contrast >= WCAG AA for text/actions.
- Sticky CTA must not cover summary text or footer controls.

## 6) Concrete File-Level Execution Plan

### Task 1: Add failing tests for new placement and disclosure

**Files:**
- Modify: `apps/web/src/components/articles/__tests__/article-detail-share.test.tsx`
- Test: `apps/web/src/components/articles/__tests__/article-detail-share.test.tsx`

**Step 1: Write failing tests**

- `shows summary section before share primary controls in reading flow`
- `hides revoke action behind advanced disclosure by default`
- `shows copy after share link generation in panel`
- `renders mobile sticky share trigger`

**Step 2: Run tests to verify fail**

Run:

```bash
bun --cwd apps/web run test -- article-detail-share.test.tsx
```

Expected: At least 1 failure due to old layout assumptions.

### Task 2: Structural layout refactor (no behavior change yet)

**Files:**
- Modify: `apps/web/src/components/articles/article-detail.tsx`

**Step 1: Reorder sections**

- Move share section rendering below summary content blocks.
- Insert desktop sticky rail container and mobile sticky trigger shell.

**Step 2: Keep existing handlers/hook calls untouched**

- Reuse `handleGenerateShareLink`, `handleCopyShareLink`, `handleRevokeShareLink`.

**Step 3: Verify tests**

Run:

```bash
bun --cwd apps/web run test -- article-detail-share.test.tsx
```

Expected: tests still fail for disclosure behavior until Task 3.

### Task 3: Behavioral updates (progressive disclosure + safe revoke)

**Files:**
- Modify: `apps/web/src/components/articles/article-detail.tsx`
- Modify: `apps/web/src/config/messages/en.json`
- Modify: `apps/web/src/config/messages/ko.json`

**Step 1: Add disclosure state**

- `isSharePanelOpen`
- `isShareAdvancedOpen`
- optional `isRevokeConfirmOpen`

**Step 2: Gate revoke**

- Revoke button appears only in advanced section.
- Add explicit confirm action before mutation call.

**Step 3: Add/adjust i18n labels**

- `shareAdvanced`
- `shareRevokeConfirm`
- `shareGenerating`
- `shareOpenPanel`

**Step 4: Re-run tests**

```bash
bun --cwd apps/web run test -- article-detail-share.test.tsx
```

Expected: all tests pass.

### Task 4: Responsive polish and focus management

**Files:**
- Modify: `apps/web/src/components/articles/article-detail.tsx`

**Step 1: Desktop sticky behavior**

- `hidden lg:block` rail with `sticky top-24`.

**Step 2: Mobile sticky bar + sheet**

- `lg:hidden` fixed bottom CTA.
- Ensure safe-area padding.

**Step 3: Focus/accessibility wiring**

- Keyboard and screen-reader checks for expand/collapse flows.

### Task 5: Analytics instrumentation for outcome tracking

**Files:**
- Modify: `apps/web/src/components/articles/article-detail.tsx`
- Modify: `apps/web/src/lib/analytics.ts` (if new events required)

**Events:**

- `article_share_panel_opened`
- `article_share_link_generated`
- `article_share_link_copied`
- `article_share_link_regenerated`
- `article_share_link_revoked`
- `article_summary_scrolled_50`

### Task 6: Validation suite

**Files:**
- Test: `apps/web/src/components/articles/__tests__/article-detail-share.test.tsx`

**Run full relevant checks:**

```bash
bun --cwd apps/web run typecheck
bun --cwd apps/web run test -- article-detail-share.test.tsx
bun --cwd apps/web run test -- src/components/articles
```

Expected: all commands exit 0.

## 7) Rollout Strategy

1. Ship behind local feature flag (`sharePanelV2`) in component-level conditional.
2. Internal dogfooding for 2-3 days.
3. 50% rollout.
4. Compare KPIs vs baseline for 1 week.
5. Full rollout if no regression.

## 8) Risks and Mitigations

- Risk: Sticky UI obscures content on small devices.
  - Mitigation: add safe-area padding and hide on keyboard open.
- Risk: Extra state complexity in one file.
  - Mitigation: extract only a tiny presentational `SharePanel` subcomponent if readability drops.
- Risk: Translation drift.
  - Mitigation: add all new keys in `en.json` and `ko.json` in same PR.

## 9) Definition of Done

- Share actions no longer interrupt top-of-page summary reading flow.
- Sticky share affordance works desktop/mobile.
- Revoke is secondary and confirmed.
- All relevant tests, typecheck pass.
- Analytics events are emitted and visible.
