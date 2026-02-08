import { vi } from "vitest";

// Minimal `next/navigation` shim for Vitest.
// Next.js 16 doesn't provide a Node-ESM-resolvable `next/navigation` export.

export function useRouter() {
  return {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  };
}

export function usePathname() {
  return "/";
}

export function useSearchParams() {
  return new URLSearchParams();
}

export function redirect(to: string): never {
  throw new Error(`redirect(${to}) called`);
}

export function permanentRedirect(to: string): never {
  throw new Error(`permanentRedirect(${to}) called`);
}

export function notFound(): never {
  throw new Error("notFound() called");
}
