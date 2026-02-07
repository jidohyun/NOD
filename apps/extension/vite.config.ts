import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { resolve } from "path";

// Content script needs separate build with IIFE format
const isContentScript = process.env.BUILD_TARGET === "content-script";

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: "manifest.json", dest: "." },
        { src: "icons/*", dest: "icons" },
      ],
    }),
  ],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: !isContentScript,
    rollupOptions: isContentScript
      ? {
          input: {
            "content-script": resolve(__dirname, "src/content/content-script.ts"),
          },
          output: {
            entryFileNames: "[name].js",
            format: "iife",
          },
        }
      : {
          input: {
            popup: resolve(__dirname, "src/popup/index.html"),
            "service-worker": resolve(__dirname, "src/background/service-worker.ts"),
          },
          output: {
            entryFileNames: "[name].js",
            chunkFileNames: "[name].js",
            assetFileNames: "[name].[ext]",
          },
        },
    minify: false,
  },
});
