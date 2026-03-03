import type { MetadataRoute } from "next";
import { env } from "@/config/env";
import { locales } from "@/lib/i18n/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = env.NEXT_PUBLIC_SITE_URL;

  const paths: Array<{
    path: string;
    lastModified: Date;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "", lastModified: new Date("2026-03-03"), changeFrequency: "weekly", priority: 1 },
    {
      path: "/blog",
      lastModified: new Date("2026-02-16"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      path: "/blog/chrome-web-clipper",
      lastModified: new Date("2026-02-10"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      path: "/blog/web-clipper-guide",
      lastModified: new Date("2026-02-10"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      path: "/blog/best-article-summarizer",
      lastModified: new Date("2026-02-16"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      path: "/blog/free-article-summarizer",
      lastModified: new Date("2026-02-16"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      path: "/blog/what-is-semantic-search",
      lastModified: new Date("2026-02-16"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      path: "/blog/research-article-summarizer",
      lastModified: new Date("2026-02-16"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      path: "/pricing",
      lastModified: new Date("2026-02-10"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  return paths.flatMap(({ path, lastModified, changeFrequency, priority }) => {
    const defaultUrl = `${baseUrl}${path}`;
    const languages = Object.fromEntries(
      locales.map((locale) => [
        locale,
        locale === "ko" ? `${baseUrl}${path}` : `${baseUrl}/${locale}${path}`,
      ])
    );

    return {
      url: defaultUrl,
      lastModified,
      changeFrequency,
      priority,
      alternates: { languages },
    };
  });
}
