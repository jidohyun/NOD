import {
  generateBlogOgImage,
  ogContentType,
  ogRuntime,
  ogSize,
} from "@/components/seo/blog-og-image";

export const runtime = ogRuntime;
export const alt = "Chrome Web Clipper: The Complete Guide to Saving Web Content (2026)";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return generateBlogOgImage("Chrome Web Clipper: The Complete Guide to Saving Web Content (2026)");
}
