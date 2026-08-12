import { generateBlogOgImage } from "@/components/seo/blog-og-image";

export const runtime = "edge";
export const alt = "Free Article Summarizer Tools — No Sign-Up Required (2026)";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return generateBlogOgImage("Free Article Summarizer Tools — No Sign-Up Required (2026)");
}
