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
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    deps: {
      // Ensure Vite transforms next-intl so our `next/navigation` alias applies.
      inline: ["next-intl"],
    },
  },
});
