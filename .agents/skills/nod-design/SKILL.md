---
name: nod-design
description: Use this skill to generate well-branded interfaces and assets for NOD (personal link library — cream paper, mustard yellow, hand-drawn doodle borders, Fredoka/Quicksand, Material Symbols), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the readme.md file within this skill, and explore the other available files (tokens/, components/, ui_kits/, guidelines/). The source of truth is the repository's DESIGN.md; this skill implements it.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code (apps/nod — vanilla HTML/CSS/JS, no framework), map the CSS custom properties in tokens/ into the app's stylesheet and keep structure/style/behavior separate.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
Rules that must hold: Korean UI copy in 존댓말 with direct verbs; no emoji; icons from Material Symbols Outlined only; doodle borders on cards/CTAs but level, plain-radius inputs; text colors explicit (no alpha text); status = icon + words; nothing from outside Phase 1 (no tags, AI, thumbnails).
