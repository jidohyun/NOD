import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { SharedArticleView } from "@/components/articles/shared-article-view";
import { env } from "@/config/env";
import type { SharedArticle } from "@/lib/api/articles";
import { resolveSharedMetadataImage, resolveSharedMetadataUrl } from "./metadata-utils";

interface SharedArticlePageProps {
  params: Promise<{ locale: string; shareId: string }>;
  searchParams: Promise<{ token?: string }>;
}

const baseMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

function getSiteOrigin(): string {
  if (env.NEXT_PUBLIC_SITE_URL) {
    return env.NEXT_PUBLIC_SITE_URL;
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  return "https://nod-archive.com";
}

function getAbsoluteUrl(path: string): string {
  const origin = getSiteOrigin();
  return new URL(path, origin).toString();
}

export async function generateMetadata({
  params,
  searchParams,
}: SharedArticlePageProps): Promise<Metadata> {
  const { locale, shareId } = await params;
  const { token } = await searchParams;

  if (!shareId) {
    return baseMetadata;
  }

  const tokenParam = token ? `token=${encodeURIComponent(token)}` : "";
  const sharePath = tokenParam
    ? `/${locale}/share/${shareId}?${tokenParam}`
    : `/${locale}/share/${shareId}`;

  try {
    const apiUrl = tokenParam
      ? `/_proxy/api/articles/share/by-slug/${encodeURIComponent(shareId)}?${tokenParam}`
      : `/_proxy/api/articles/share/by-slug/${encodeURIComponent(shareId)}`;
    const response = await fetch(getAbsoluteUrl(apiUrl), {
      cache: "no-store",
    });

    if (!response.ok) {
      return baseMetadata;
    }

    const shared = (await response.json()) as SharedArticle;

    const title = shared.title;
    const description = shared.summary;
    const siteOrigin = getSiteOrigin();
    const safeToken = token ?? "";
    const url = resolveSharedMetadataUrl(shared, { siteOrigin, locale, shareId, token: safeToken });
    const image = resolveSharedMetadataImage(shared, {
      siteOrigin,
      locale,
      shareId,
      token: safeToken,
    });

    return {
      title,
      description,
      alternates: {
        canonical: sharePath,
      },
      openGraph: {
        title,
        description,
        type: "article",
        url,
        locale,
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  } catch {
    return baseMetadata;
  }
}

export default async function SharedArticlePage({ params, searchParams }: SharedArticlePageProps) {
  const { locale, shareId: shareKey } = await params;
  const { token = "" } = await searchParams;
  setRequestLocale(locale as Locale);

  return <SharedArticleView shareId={shareKey} token={token} />;
}
