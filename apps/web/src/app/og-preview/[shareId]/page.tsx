import { env } from "@/config/env";
import type { SharedArticle } from "@/lib/api/articles";

export const dynamic = "force-dynamic";

const CONTENT_TYPE_GRADIENTS: Record<string, { from: string; to: string }> = {
  tech_blog: { from: "#2563eb", to: "#3730a3" },
  general_news: { from: "#4b5563", to: "#1e293b" },
  academic_paper: { from: "#9333ea", to: "#5b21b6" },
  official_docs: { from: "#0d9488", to: "#065f46" },
  video_podcast: { from: "#db2777", to: "#9f1239" },
  github_repo: { from: "#334155", to: "#111827" },
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  tech_blog: "Tech Blog",
  general_news: "News",
  academic_paper: "Paper",
  official_docs: "Docs",
  video_podcast: "Video",
  github_repo: "GitHub",
};

function getApiBaseUrl(): string {
  return (
    env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://api.nod-archive.com"
      : "http://localhost:8000")
  );
}

function getDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

interface OgPreviewPageProps {
  params: Promise<{ shareId: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function OgPreviewPage({ params, searchParams }: OgPreviewPageProps) {
  const { shareId } = await params;
  const { token } = await searchParams;

  const apiBase = getApiBaseUrl();
  const apiUrl = new URL(`/api/articles/share/by-slug/${encodeURIComponent(shareId)}`, apiBase);
  if (token) apiUrl.searchParams.set("token", token);
  apiUrl.searchParams.set("no_track", "true");

  let shared: SharedArticle | null = null;
  try {
    const res = await fetch(apiUrl.toString(), { cache: "no-store" });
    if (res.ok) shared = await res.json();
  } catch {
    // fallback
  }

  const title = shared?.title ?? "Shared Article";
  const summary = shared?.summary ?? "";
  const contentType = shared?.content_type ?? "";
  const articleUrl = shared?.url ?? null;
  const gradient = CONTENT_TYPE_GRADIENTS[contentType] ?? { from: "#334155", to: "#111827" };
  const label = CONTENT_TYPE_LABELS[contentType] ?? null;
  const hostname = getDomain(articleUrl);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Quicksand:wght@400;500;700&family=Noto+Sans+KR:wght@400;500;700;900&display=swap"
      />
      <div style={{ width: 1200, height: 630, overflow: "hidden" }}>
        <div
          style={{
            width: 1200,
            height: 630,
            display: "flex",
            flexDirection: "column",
            padding: "40px 48px 36px",
            background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
            fontFamily: "'Fredoka', 'Noto Sans KR', sans-serif",
            color: "#ffffff",
            overflow: "hidden",
          }}
        >
          {/* Badge */}
          {label ? (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <span
                style={{
                  padding: "6px 16px",
                  borderRadius: "9999px",
                  background: "rgba(255,255,255,0.15)",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.75)",
                  backdropFilter: "blur(8px)",
                  fontFamily: "'Quicksand', 'Noto Sans KR', sans-serif",
                }}
              >
                {label}
              </span>
            </div>
          ) : null}

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Title + Summary block */}
          <div style={{ marginBottom: 16 }}>
            <p
              style={{
                fontSize: 48,
                fontWeight: 900,
                lineHeight: 1.15,
                fontFamily: "'Fredoka', 'Noto Sans KR', sans-serif",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {title}
            </p>
            {summary ? (
              <p
                style={{
                  marginTop: 16,
                  fontSize: 22,
                  fontWeight: 400,
                  lineHeight: 1.55,
                  color: "rgba(255,255,255,0.55)",
                  fontFamily: "'Quicksand', 'Noto Sans KR', sans-serif",
                  display: "-webkit-box",
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {summary}
              </p>
            ) : null}
          </div>

          {/* Bottom bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1.5px solid rgba(255,255,255,0.1)",
              paddingTop: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/nod-icon.png"
                alt="NOD"
                width={32}
                height={32}
                style={{ borderRadius: 4, opacity: 0.8 }}
              />
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.55)",
                  fontFamily: "'Quicksand', 'Noto Sans KR', sans-serif",
                }}
              >
                NOD
              </span>
            </div>
            {hostname ? (
              <span
                style={{
                  fontSize: 18,
                  color: "rgba(255,255,255,0.35)",
                  fontFamily: "'Quicksand', 'Noto Sans KR', sans-serif",
                }}
              >
                {hostname}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
