# AGENTS.md - Web Blog Routing Guidance

This document provides specific guidance for AI agents operating within the `apps/web/src/app/[locale]/blog/` directory. It focuses on blog content routing and how to add new blog pages without duplicating post-leaf documentation. It supplements `apps/web/src/app/[locale]/AGENTS.md`.

## 1. Blog Content Routing

The `blog` directory handles the display of blog posts.
*   **`page.tsx`**: Renders the main blog listing page, typically displaying a list of recent posts.
*   [slug]/page.tsx: This dynamic segment handles individual blog post pages (e.g., /en/blog/my-first-post).

## 2. Adding New Blog Pages

To add a new blog post:
1.  Create a new folder under `apps/web/src/app/[locale]/blog/` with the desired slug (e.g., `my-new-post`).
2.  Inside this new folder, create a `page.tsx` file containing the content for the blog post.
3.  **DO NOT** create an `AGENTS.md` file within individual blog post leaf folders (e.g., apps/web/src/app/[locale]/blog/my-new-post/AGENTS.md). All guidance for blog posts is covered by this `AGENTS.md` file.

## 3. Further Guidance

For general locale-prefixed route conventions, refer to `apps/web/src/app/[locale]/AGENTS.md`. For web application commands, refer to `apps/web/AGENTS.md`.


