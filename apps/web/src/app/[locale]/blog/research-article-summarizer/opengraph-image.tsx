import {
  generateBlogOgImage,
  ogContentType,
  ogRuntime,
  ogSize,
} from "@/components/seo/blog-og-image";

export const runtime = ogRuntime;
export const alt = "Research Article Summarizer — AI Tools for Academic Papers (2026)";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return generateBlogOgImage("Research Article Summarizer — AI Tools for Academic Papers (2026)");
}
