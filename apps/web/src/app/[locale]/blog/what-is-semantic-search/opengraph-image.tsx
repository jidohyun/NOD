import {
  generateBlogOgImage,
  ogContentType,
  ogRuntime,
  ogSize,
} from "@/components/seo/blog-og-image";

export const runtime = ogRuntime;
export const alt = "What Is Semantic Search? How AI Understands Meaning (2026 Guide)";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return generateBlogOgImage("What Is Semantic Search? How AI Understands Meaning (2026 Guide)");
}
