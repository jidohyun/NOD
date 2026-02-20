import type { NextConfig } from "next";

import createNextIntlPlugin from "next-intl/plugin";
import { env } from "./src/config/env";

const withNextIntl = createNextIntlPlugin("./src/lib/i18n/request.ts");

const isDev = env.NEXT_PUBLIC_ENABLE_DEVTOOLS === "true";
const isDevEnv = process.env.NODE_ENV !== "production";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.paddle.com https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      `connect-src 'self' https:${isDevEnv ? " http://localhost:*" : ""}`,
      "frame-src https://*.paddle.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.md": { loaders: [], as: "*.js" },
    },
  },
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  reactCompiler: true,
  devIndicators: isDev ? undefined : false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  logging: isDev
    ? {
        fetches: {
          fullUrl: true,
        },
      }
    : undefined,
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    typedEnv: true,
  },
  serverExternalPackages: ["esbuild", "esbuild-wasm", "@esbuild/darwin-arm64"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/_proxy/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        ],
      },
    ];
  },
  async rewrites() {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return [
      {
        source: "/_proxy/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
