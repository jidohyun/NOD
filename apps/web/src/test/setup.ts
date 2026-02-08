import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

// Next.js 16 ships `next/navigation.js` but Node ESM can't resolve `next/navigation`.
// Some deps (e.g. next-intl navigation helpers) import `next/navigation`, so we provide
// a virtual module for tests.
vi.mock(
  "next/navigation",
  () => ({
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),
    usePathname: () => "/",
    useSearchParams: () => new URLSearchParams(),
    notFound: () => {
      throw new Error("notFound() called");
    },
    redirect: (to: string) => {
      throw new Error(`redirect(${to}) called`);
    },
    permanentRedirect: (to: string) => {
      throw new Error(`permanentRedirect(${to}) called`);
    },
  }),
  { virtual: true }
);
