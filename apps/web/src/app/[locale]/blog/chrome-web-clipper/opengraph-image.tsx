import { generateBlogOgImage } from "@/components/seo/blog-og-image";

export const runtime = "edge";
export const alt = "Chrome Web Clipper: The Complete Guide to Saving Web Content (2026)";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return generateBlogOgImage("Chrome Web Clipper: The Complete Guide to Saving Web Content (2026)");
}
