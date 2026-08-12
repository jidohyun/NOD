# NOD Web Design System

## Visual Identity

NOD uses a **warm, playful** design language with organic shapes and hand-drawn-style borders. The aesthetic balances creative whimsy with functional clarity.

## Fonts

| Token | Family | Usage |
|-------|--------|-------|
| `font-creative-display` | Fredoka | Headlines, display text, section titles |
| `font-creative-body` | Quicksand | Body copy, interface text, buttons |
| `font-sans` | Inter | Utility/fallback |
| `font-display` | Space Grotesk | Landing page headings |
| `font-mono` | JetBrains Mono | Code blocks |

Korean locale (`lang="ko"`) overrides all fonts to **NanumSquareRound**.

## Colors

### Brand

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `nod-gold` | `#e8b931` | same | Primary accent, tags, CTAs |
| `nod-gold-muted` | `#c49a1c` | same | Hover/pressed gold |

### Surfaces

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `cm-bg` | `#fffdfa` | `#111114` | Page background |
| `cm-surface` | `#ffffff` | `#18181b` | Card/section background |
| `cm-surface-raised` | `#f8f7f4` | `#1e1e22` | Elevated surface |
| `cm-text` | `#4a4a4a` | `#e4e4e7` | Primary text |
| `cm-text-light` | `#6b6b6b` | `#a1a1aa` | Secondary text |

### Accents

| Token | Usage |
|-------|-------|
| `cm-mint` | Success, positive states |
| `cm-coral` | Warning, attention states |
| `cm-lavender` | Decorative accents |

## Custom Utilities

### `.cm-doodle-border`
Organic, hand-drawn-style border with asymmetric radius.
```
border-width: 2px
border-radius: 255px 15px 225px 15px / 15px 225px 15px 255px
```
Used on: Cards, sections, buttons throughout dashboard.

### `.cm-sketch-shadow`
Offset shadow for a sketched/paper look.
```
box-shadow: 8px 8px 0px rgba(0,0,0,0.05)  /* light */
box-shadow: 8px 8px 0px rgba(0,0,0,0.3)   /* dark */
```

### `.cm-organic-shape`
Asymmetric border-radius for decorative blobs.
```
border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%
```

## Component Patterns

### Dashboard Button (action buttons)
```html
<button class="inline-flex items-center gap-1.5
  cm-doodle-border border-2 border-cm-text/20
  bg-white dark:bg-cm-surface
  px-3 py-1.5
  font-creative-body text-xs font-black text-cm-text
  transition-colors
  hover:bg-cm-bg dark:hover:bg-cm-surface-raised
  disabled:opacity-50">
  {icon + text}
</button>
```
Mobile: hide text with `hidden md:inline`, keep icon visible. Touch target min 44px.

### Dashboard Card (content section)
```html
<section class="cm-doodle-border border-2 border-cm-text/18
  bg-white/95 dark:bg-cm-surface/95 p-6">
  <h2 class="font-creative-display text-2xl font-black text-cm-text">
    {title}
  </h2>
  {content}
</section>
```

### Page Container (article detail, dashboard)
```html
<div class="rounded-[2rem] border-2 border-cm-text/10 bg-cm-bg p-6 lg:p-8">
  {dot-pattern background + content}
</div>
```

### Status Badge
```html
<span class="inline-flex items-center rounded-full border
  px-2.5 py-0.5 text-xs font-black
  {color classes per status}">
  {label}
</span>
```

## Spacing Scale

Base unit: 16px. Uses Tailwind defaults with `packages/design-tokens` overrides:
`xs:4 sm:8 md:12 base:16 lg:20 xl:24 2xl:32 3xl:48`

## Radius Scale

`sm:6px md:8px lg:10px xl:14px` + `rounded-[2rem]` for page containers.

## Responsive Breakpoints

Standard Tailwind: `sm:640 md:768 lg:1024 xl:1280`.
Key patterns:
- Buttons: icon-only on mobile (`hidden md:inline` for text)
- Layout: `flex-col` → `lg:flex-row` for header areas
- Padding: `p-6` → `lg:p-8` for containers

## Animations

| Class | Effect | Duration |
|-------|--------|----------|
| `animate-cm-float` | Gentle vertical float | 6s |
| `animate-cm-float-reverse` | Reverse float | 7s |
| `animate-cm-wiggle` | Subtle rotation wiggle | 3s |

## Key Files

- **CSS tokens & utilities:** `src/app/globals.css`
- **Design tokens package:** `packages/design-tokens/src/tokens.ts`
- **Font setup:** `src/app/layout.tsx`
- **Theme logic:** `src/lib/theme/theme.ts`
