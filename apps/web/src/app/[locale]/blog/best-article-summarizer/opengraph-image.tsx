import { generateBlogOgImage } from "@/components/seo/blog-og-image";

export const runtime = "edge";
export const alt = "Best Article Summarizer Tools in 2026 — AI-Powered Comparison";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return generateBlogOgImage("Best Article Summarizer Tools in 2026 — AI-Powered Comparison");
}
