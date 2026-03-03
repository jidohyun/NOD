import {
  generateBlogOgImage,
  ogContentType,
  ogRuntime,
  ogSize,
} from "@/components/seo/blog-og-image";

export const runtime = ogRuntime;
export const alt = "Web Clipper Chrome Extension Guide — Best Tools for Saving Articles";
export const size = ogSize;
export const contentType = ogContentType;

export default function Image() {
  return generateBlogOgImage("Web Clipper Chrome Extension Guide — Best Tools for Saving Articles");
}
