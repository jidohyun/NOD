import {
  generateBlogOgImage,
  ogContentType,
  ogRuntime,
  ogSize,
} from "@/components/seo/blog-og-image";

export const runtime = ogRuntime;
export const alt = "Best Article Summarizer Tools in 2026 — AI-Powered Comparison";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return generateBlogOgImage("Best Article Summarizer Tools in 2026 — AI-Powered Comparison");
}
