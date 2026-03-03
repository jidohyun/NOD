import { generateBlogOgImage } from "@/components/seo/blog-og-image";

export const runtime = "edge";
export const alt = "Research Article Summarizer — AI Tools for Academic Papers (2026)";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return generateBlogOgImage("Research Article Summarizer — AI Tools for Academic Papers (2026)");
}
