import { ImageResponse } from "next/og";
import {
  formatOgDescription,
  formatOgHeadline,
} from "@/app/[locale]/share/[shareId]/og-text-utils";
import type { SharedArticle } from "@/lib/api/articles";

const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 630;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.nod-archive.com";

function buildApiUrl(shareId: string, token: string | null): string {
  const path = UUID_RE.test(shareId)
    ? `/api/articles/share/${encodeURIComponent(shareId)}`
    : `/api/articles/share/by-slug/${encodeURIComponent(shareId)}`;
  const apiUrl = new URL(path, API_BASE_URL);
  if (token) {
    apiUrl.searchParams.set("token", token);
  }
  apiUrl.searchParams.set("no_track", "true");
  return apiUrl.toString();
}

function getArticleHost(articleUrl: string | null | undefined): string | null {
  if (!articleUrl) return null;
  try {
    return new URL(articleUrl).host;
  } catch {
    return null;
  }
}

const CONTENT_TYPE_GRADIENTS: Record<string, { from: string; to: string }> = {
  tech_blog: { from: "#2563eb", to: "#3730a3" },
  general_news: { from: "#4b5563", to: "#1e293b" },
  discussion: { from: "#f97316", to: "#c2410c" },
  academic_paper: { from: "#9333ea", to: "#5b21b6" },
  official_docs: { from: "#0d9488", to: "#065f46" },
  video_podcast: { from: "#db2777", to: "#9f1239" },
  github_repo: { from: "#334155", to: "#111827" },
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  tech_blog: "Tech Blog",
  general_news: "News",
  discussion: "Discussion",
  academic_paper: "Paper",
  official_docs: "Docs",
  video_podcast: "Video",
  github_repo: "GitHub",
};

function renderFallbackImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "64px",
        background: "linear-gradient(135deg, #334155 0%, #111827 100%)",
        color: "#f9fafb",
      }}
    >
      <div style={{ display: "flex", fontSize: 70, fontWeight: 900, color: "#E8B931" }}>NOD</div>
      <div
        style={{ display: "flex", marginTop: 18, fontSize: 40, fontWeight: 700, lineHeight: 1.25 }}
      >
        Shared Article
      </div>
    </div>,
    { width: IMAGE_WIDTH, height: IMAGE_HEIGHT }
  );
}

function renderSharedImage(shared: SharedArticle) {
  const headline = formatOgHeadline(shared.title);
  const description = formatOgDescription(shared.summary);
  const articleHost = getArticleHost(shared.url);
  const gradient = CONTENT_TYPE_GRADIENTS[shared.content_type] ?? {
    from: "#334155",
    to: "#111827",
  };
  const contentLabel = CONTENT_TYPE_LABELS[shared.content_type] ?? null;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        padding: "42px 48px 62px",
        background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
        color: "#ffffff",
      }}
    >
      {/* Content type badge */}
      {contentLabel ? (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 18px",
              borderRadius: "9999px",
              background: "rgba(255,255,255,0.15)",
              fontSize: 19,
              lineHeight: 1.1,
              fontWeight: 700,
              color: "rgba(255,255,255,0.75)",
            }}
          >
            {contentLabel}
          </div>
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "center",
          paddingBottom: "18px",
        }}
      >
        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: 52,
            lineHeight: 1.15,
            fontWeight: 900,
            maxWidth: "1100px",
          }}
        >
          {headline}
        </div>

        {/* Summary */}
        <div
          style={{
            display: "flex",
            marginTop: "18px",
            fontSize: 24,
            lineHeight: 1.55,
            fontWeight: 400,
            maxWidth: "1080px",
            color: "rgba(255, 255, 255, 0.55)",
          }}
        >
          {description}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            marginTop: "26px",
            paddingTop: "16px",
            borderTop: "1.5px solid rgba(255,255,255,0.1)",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {/* biome-ignore lint/performance/noImgElement: OG image JSX (ImageResponse) doesn't support next/image */}
            <img
              src="https://nod-archive.com/brand/nod-icon.png"
              alt="NOD"
              width={32}
              height={32}
              style={{ borderRadius: 4, opacity: 0.8 }}
            />
            <div
              style={{
                display: "flex",
                fontSize: 22,
                lineHeight: 1.1,
                fontWeight: 700,
                color: "rgba(255,255,255,0.55)",
              }}
            >
              NOD
            </div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              lineHeight: 1.1,
              color: "rgba(255,255,255,0.35)",
            }}
          >
            {articleHost ?? "nod-archive.com"}
          </div>
        </div>
      </div>
    </div>,
    { width: IMAGE_WIDTH, height: IMAGE_HEIGHT }
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const shareId = url.searchParams.get("shareId")?.trim();
  const token = url.searchParams.get("token")?.trim();

  if (!shareId) {
    const image = renderFallbackImage();
    image.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return image;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(buildApiUrl(shareId, token ?? null), {
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      const image = renderFallbackImage();
      image.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
      return image;
    }

    const shared = (await response.json()) as SharedArticle;
    const image = renderSharedImage(shared);
    image.headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=2592000");
    return image;
  } catch {
    const image = renderFallbackImage();
    image.headers.set("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
    return image;
  } finally {
    clearTimeout(timeout);
  }
}
