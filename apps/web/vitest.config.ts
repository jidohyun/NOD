import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  ssr: {
    noExternal: ["next-intl"],
  },
  resolve: {
    // Next.js 16 publishes `navigation.js` at the package root, but Node's ESM resolver
    // can't resolve the extensionless `next/navigation` subpath without an `exports` map.
    // Some dependencies (e.g. next-intl navigation helpers) import `next/navigation`.
    alias: {
      "@": resolve(__dirname, "./src"),
      "next/navigation": resolve(__dirname, "./src/test/shims/next-navigation.ts"),
      "@workspace/graph-physics": resolve(__dirname, "../../packages/graph-physics/src/index.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    env: {
      SKIP_ENV_VALIDATION: "true",
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
      NEXT_PUBLIC_API_URL: "http://localhost:8000",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    },
  },
});
