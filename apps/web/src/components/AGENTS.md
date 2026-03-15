# AGENTS.md - Web Components Guidance

This document provides specific guidance for AI agents operating within the `apps/web/src/components/` directory. It focuses on component conventions and where design-system-like components reside, supplementing `apps/web/AGENTS.md`.

## 1. Component Organization

Components are organized into logical subdirectories to promote reusability and maintainability:

*   **`ui/`**: Contains generic, highly reusable UI primitives (e.g., Button, Input, Dialog, Card). These are often built using headless UI libraries like Radix UI and styled with Tailwind CSS.
*   analytics/: Houses components related to analytics, including specific charts, data displays, and reporting tools.
*   dashboard/: Contains components that define dashboard sections (e.g., `DashboardHeader`, `DashboardSidebar`, `DashboardMainContent`).
*   **Other directories**: May contain more complex, application-specific components (e.g., `dashboard/`).

## 2. Component Conventions

*   **Functional Components**: All components should be functional components using React Hooks.
*   **TypeScript**: Components are strongly typed using TypeScript for props and internal state.
*   **Styling**: Primarily uses Tailwind CSS for utility-first styling. clsx and tailwind-merge are used for conditional and conflict-free class merging.
*   **Props**: Clearly define component props with descriptive names and types.
*   **Composition**: Favor composition over inheritance. Utilize patterns like Compound Components and Render Props where appropriate for flexible APIs.
*   **Accessibility**: Ensure components are built with accessibility in mind (e.g., proper ARIA attributes, keyboard navigation).

## 3. Design System Components

Design-system-like components (e.g., Button, Input, Dialog) are located under the `ui/` subdirectory. When building new UI, agents should first check src/components/ui/ for existing primitives before creating new ones.

## 4. Further Guidance

For web application commands and general principles, refer to `apps/web/AGENTS.md`. For React best practices and performance optimization, consult the project's RTK.md (React Toolkit) or `AGENTS.md` in relevant parent directories.

