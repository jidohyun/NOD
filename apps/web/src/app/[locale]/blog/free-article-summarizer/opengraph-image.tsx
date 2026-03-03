import {
  generateBlogOgImage,
  ogContentType,
  ogRuntime,
  ogSize,
} from "@/components/seo/blog-og-image";

export const runtime = ogRuntime;
export const alt = "Free Article Summarizer Tools — No Sign-Up Required (2026)";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return generateBlogOgImage("Free Article Summarizer Tools — No Sign-Up Required (2026)");
}
