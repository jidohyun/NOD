import { generateBlogOgImage } from "@/components/seo/blog-og-image";

export const runtime = "edge";
export const alt = "Web Clipper Chrome Extension Guide — Best Tools for Saving Articles";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return generateBlogOgImage("Web Clipper Chrome Extension Guide — Best Tools for Saving Articles");
}
