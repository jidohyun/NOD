import { defineConfig, loadEnv } from "vite";
import fs from "fs";
import { execSync } from "child_process";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { resolve } from "path";

const isContentScript = process.env.BUILD_TARGET === "content-script";

function getGitCommit(): string {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
}

function generateManifest(mode: string) {
  const isDev = mode === "development";
  const commit = getGitCommit();
  const versionName = isDev ? `0.1.0-dev-${commit}` : `0.1.0-${commit}`;

  const manifest: Record<string, unknown> = {
    manifest_version: 3,
    name: isDev ? "NOD - Article Analyzer (Dev)" : "NOD - Article Analyzer",
    version: "0.1.0",
    version_name: versionName,
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
    },
    web_accessible_resources: [
      {
        resources: ["config.json"],
        matches: ["<all_urls>"]
      }
    ]
  };

  return JSON.stringify(manifest, null, 2);
}

function generateManifestPlugin(mode: string) {
  return {
    name: "generate-manifest",
    closeBundle() {
      if (isContentScript) return;

      const isDev = mode === "development";
      const outDir = isDev ? "dist/dev" : "dist/prod";
      const manifestContent = generateManifest(mode);
      const manifestPath = resolve(__dirname, outDir, "manifest.json");
      fs.writeFileSync(manifestPath, manifestContent);

      const configSrc = resolve(__dirname, "config", `config.${mode}.json`);
      const configDest = resolve(__dirname, outDir, "config.json");
      if (fs.existsSync(configSrc)) {
        fs.copyFileSync(configSrc, configDest);
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";
  const outDir = isDev ? "dist/dev" : "dist/prod";

  return {
    plugins: [
      react(),
      generateManifestPlugin(mode),
      viteStaticCopy({
        targets: [
          { src: "icons/*.png", dest: "icons" },
          { src: "src/popup/theme-init.js", dest: "src/popup" },
        ],
      }),
    ],
  base: "./",
  define: {
    __DEV__: mode === "development",
    __MODE__: JSON.stringify(mode),
  },
  build: {
    outDir: isDev ? "dist/dev" : "dist/prod",
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
