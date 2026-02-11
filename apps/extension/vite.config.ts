import { defineConfig, loadEnv } from "vite";
import fs from "fs";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { resolve } from "path";

const isContentScript = process.env.BUILD_TARGET === "content-script";

function generateManifest(mode: string) {
  const isDev = mode === "development";

  const manifest = {
    manifest_version: 3,
    name: isDev ? "NOD - Article Analyzer (Dev)" : "NOD - Article Analyzer",
    version: "0.1.0",
    description: isDev
      ? "[DEV] Save and analyze articles with AI-powered summarization"
      : "Save and analyze articles with AI-powered summarization",
    permissions: ["activeTab", "storage", "scripting"],
    host_permissions: isDev
      ? ["http://localhost:8000/*"]
      : ["https://api.nod-archive.com/*"],
    action: {
      default_popup: "src/popup/index.html",
      default_icon: {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      }
    },
    background: {
      service_worker: "service-worker.js",
      type: "module"
    },
    content_scripts: [
      {
        matches: ["<all_urls>"],
        js: ["content-script.js"],
        run_at: "document_idle"
      }
    ],
    externally_connectable: {
      matches: isDev
        ? ["http://localhost:3000/*"]
        : ["https://nod-archive.com/*"]
    },
    icons: {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  };

  return JSON.stringify(manifest, null, 2);
}

export default defineConfig(({ mode }) => {
  if (!isContentScript) {
    const manifestContent = generateManifest(mode);
    const manifestPath = resolve(__dirname, "dist", "manifest.json");
    if (!fs.existsSync(resolve(__dirname, "dist"))) {
      fs.mkdirSync(resolve(__dirname, "dist"), { recursive: true });
    }
    fs.writeFileSync(manifestPath, manifestContent);
  }

  return {
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: "icons/*", dest: "icons" },
      ],
    }),
  ],
  base: "./",
  define: {
    __DEV__: mode === "development",
    __MODE__: JSON.stringify(mode),
  },
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
    minify: mode === "production",
    sourcemap: mode === "development",
  },
  };
});
