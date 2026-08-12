import { generateBlogOgImage } from "@/components/seo/blog-og-image";

export const runtime = "edge";
export const alt = "What Is Semantic Search? How AI Understands Meaning (2026 Guide)";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return generateBlogOgImage("What Is Semantic Search? How AI Understands Meaning (2026 Guide)");
}
