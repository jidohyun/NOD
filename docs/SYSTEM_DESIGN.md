# System Design

This document defines the core system design rules for this project.

## 1. Core Principle

- Do not over-apply design patterns.
- Prefer practical structure over theoretically perfect architecture.
- Favor designs that are easy to trace in code, easy to change, and easy to explain to another engineer.
- Introduce abstraction only when it solves a real problem that already exists in this codebase.

## 2. Project Context

- This repository is a TypeScript frontend monorepo built with Yarn workspaces and Turborepo.
- The main runtimes are:
  - `apps/web` for the Next.js advertiser app
  - `apps/web-creator` for the Vite + React creator app
  - `apps/extension` for the Chrome extension
  - `packages/ui` for shared UI, theme, providers, and frontend primitives
- Design decisions should match this reality. Do not import backend or enterprise architecture habits that make the frontend harder to understand.

## 3. TypeScript And Module Design

- Use TypeScript directly and keep types explicit where they improve readability.
- Prefer simple native TypeScript constructs over elaborate type systems.
- Reuse existing interfaces, utility types, and shared contracts before creating new ones.
- Avoid type-level cleverness that makes the runtime behavior harder to understand.
- Avoid introducing generic wrappers, adapters, or helper layers unless they reduce repeated complexity across multiple call sites.

## 4. Architecture Style

- Aim for a practical, moderately layered frontend architecture.
- Keep a clear separation of concerns, but stop before the codebase becomes fragmented.
- Prefer a structure that mirrors how the repository already works:
  - UI in components
  - shared UI and providers in `packages/ui`
  - network access in runtime-local API modules
  - server state through TanStack Query
  - app state through context, hooks, and local component state
- Keep boundaries explicit:
  - runtime-specific concerns stay in their app workspace
  - shared concerns go to `packages/ui` only when they are truly shared
  - extension backend access flows through the background layer

In short, prefer a design that is balanced and maintainable, not one that is architecturally impressive on paper.

## 5. Runtime Boundaries

- Do not create direct app-to-app imports between `apps/web`, `apps/web-creator`, and `apps/extension`.
- Do not move runtime-specific routing, auth policy, analytics, or messaging logic into `packages/ui`.
- Keep API clients runtime-local:
  - `apps/web/src/config/axios.ts`
  - `apps/web-creator/src/config/axios.ts`
  - `apps/extension/src/background/api-client.ts`
- Treat the Chrome extension as a separate runtime with its own constraints. Popup and content code should communicate through background messaging rather than bypassing that boundary.

## 6. Composition Over Pattern Hunting

- Use object-oriented ideas such as encapsulation and abstraction when they improve clarity.
- Encapsulate stateful or side-effectful behavior behind clear module, hook, or service boundaries.
- Expose small, understandable interfaces and hide incidental implementation details.
- Prefer composition, hooks, modules, and focused helpers over inheritance-heavy designs.
- Treat inheritance as a rare tool, not a default reuse strategy.
- Use classes only when they clearly model stateful behavior or error semantics better than functions and modules.
- Do not introduce base classes, strategy hierarchies, service locators, factories, or manager objects unless there is a concrete, repeated need.
- Avoid wrapping well-understood libraries just to satisfy an abstract pattern.
- If a plain function, hook, context, or module is enough, use that.

## 7. File And Feature Organization

- Keep related logic close together.
- Split files when it improves readability, ownership, or reuse.
- Do not split one cohesive behavior into many tiny files just to simulate layering.
- Prefer existing repository conventions such as:
  - `src/api/*` for backend-facing logic
  - `src/context/*` for app-scoped providers
  - `src/components/*` for UI
  - `packages/ui/src/*` for reusable UI primitives and shared frontend helpers
- Use barrel exports where a feature already uses them, but do not add barrels that hide ownership or make navigation harder.

## 8. Abstraction Rules

Create a new abstraction only when at least one of these is true:

- the same behavior is duplicated in multiple places
- a runtime boundary needs a stable interface
- a shared UI or helper is used by more than one workspace
- a complex flow becomes easier to test and reason about after extraction

Do not create a new abstraction when:

- it is only preparing for hypothetical future reuse
- it adds naming without reducing complexity
- it forces readers to jump across many files to understand one behavior
- it mirrors a textbook pattern more than an actual need in this repository

## 9. Data Flow Expectations

- Prefer the existing API-module pattern over ad hoc fetch logic inside components.
- Prefer TanStack Query for server state rather than custom caching layers.
- Keep provider trees intentional and close to app entry points.
- In SSR-sensitive areas, follow existing hydration rules rather than inventing alternate client/server guards.
- For extension features, keep the data flow understandable: UI entry -> messaging -> background -> API client.

## 10. Maintainability Standard

Good design in this repository means:

- another engineer can find the ownership of a feature quickly
- the runtime boundary is obvious
- the data flow is easy to trace
- shared code is shared for a real reason
- the number of files and abstractions stays proportional to the problem size

Bad design in this repository usually looks like:

- too many thin wrapper layers
- generic names such as `BaseService`, `Manager`, or `Factory` without a strong reason
- premature cross-workspace shared modules
- tiny files with little standalone value
- architectural ceremony that exceeds the complexity of the feature

## 11. Decision Rule

Before adding a new layer, abstraction, or pattern, ask:

1. Does this solve a current problem in this codebase?
2. Does this make the runtime boundary clearer?
3. Does this reduce duplication or confusion for future changes?
4. Would a simpler component, hook, module, or function work just as well?

If the simpler option works, choose the simpler option.
