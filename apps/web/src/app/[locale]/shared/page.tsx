"use client";

import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  Eye,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Share2,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiClient } from "@/lib/api-client";

interface MyShareLink {
  share_id: string;
  article_id: string;
  article_title: string;
  article_url: string | null;
  share_slug: string;
  canonical_share_url: string;
  public_url: string | null;
  view_count: number;
  empathy_count: number;
  comment_count: number;
  summary_preview: string | null;
  concepts: string[];
  content_type: string | null;
  thumbnail_url: string | null;
  created_at: string;
  expires_at: string | null;
}

const DATE_LOCALE_MAP: Record<string, string> = {
  ko: "ko-KR",
  en: "en-US",
  ja: "ja-JP",
  es: "es-ES",
  "pt-BR": "pt-BR",
  "zh-CN": "zh-CN",
  de: "de-DE",
  fr: "fr-FR",
};

const CONTENT_TYPE_STYLES: Record<string, { label: string; className: string }> = {
  tech_blog: {
    label: "Tech Blog",
    className:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
  },
  general_news: {
    label: "News",
    className:
      "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-700",
  },
  discussion: {
    label: "Discussion",
    className:
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800",
  },
  academic_paper: {
    label: "Paper",
    className:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
  },
  official_docs: {
    label: "Docs",
    className:
      "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800",
  },
  video_podcast: {
    label: "Video",
    className:
      "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-400 dark:border-pink-800",
  },
  github_repo: {
    label: "GitHub",
    className:
      "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700",
  },
};

const CONTENT_TYPE_GRADIENTS: Record<string, string> = {
  tech_blog: "from-blue-600 to-indigo-800",
  general_news: "from-gray-600 to-slate-800",
  discussion: "from-orange-500 to-red-700",
  academic_paper: "from-purple-600 to-violet-800",
  official_docs: "from-teal-600 to-emerald-800",
  video_podcast: "from-pink-600 to-rose-800",
  github_repo: "from-slate-700 to-gray-900",
};

function getDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function ShareCardPlaceholder({
  title,
  contentType,
  domain,
  summaryPreview,
}: {
  title: string;
  contentType: string | null;
  domain: string | null;
  summaryPreview: string | null;
}) {
  const gradient = CONTENT_TYPE_GRADIENTS[contentType ?? ""] ?? "from-gray-700 to-slate-900";
  const hostname = getDomain(domain);
  const contentTypeStyle = contentType ? CONTENT_TYPE_STYLES[contentType] : undefined;

  return (
    <div
      className={`relative flex w-full flex-col bg-gradient-to-br ${gradient} p-5 transition-transform group-hover:scale-[1.01]`}
      style={{ aspectRatio: "1200 / 630" }}
    >
      {/* Content type badge top-right */}
      {contentTypeStyle ? (
        <div className="flex justify-end">
          <span className="rounded-full bg-white/15 px-3 py-1 font-creative-body text-xs font-bold text-white/75 backdrop-blur-sm">
            {contentTypeStyle.label}
          </span>
        </div>
      ) : null}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Title + Summary stacked together */}
      <div className="mb-4 space-y-3">
        <p className="line-clamp-3 font-creative-display text-2xl font-black leading-tight text-white sm:text-3xl">
          {title}
        </p>
        {summaryPreview ? (
          <p className="line-clamp-4 font-creative-body text-sm leading-relaxed text-white/55">
            {summaryPreview}
          </p>
        ) : null}
      </div>

      {/* Bottom bar: NOD icon + domain */}
      <div className="flex items-center justify-between border-t border-white/10 pt-3">
        <div className="flex items-center gap-2.5">
          <Image
            src="/brand/nod-icon.png"
            alt="NOD"
            width={28}
            height={28}
            className="h-7 w-7 rounded-sm opacity-80"
          />
          <span className="font-creative-body text-sm font-bold text-white/55">NOD</span>
        </div>
        {hostname && <span className="font-creative-body text-sm text-white/35">{hostname}</span>}
      </div>
    </div>
  );
}

export default function SharedPage() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const [shares, setShares] = useState<MyShareLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchShares = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { data } = await apiClient.get<MyShareLink[]>("/api/articles/my-shares");
      setShares(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load shared links";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchShares();
  }, [fetchShares]);

  function copyShareUrl(shareId: string, canonicalPath: string) {
    const fullUrl = `${window.location.origin}${canonicalPath}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(shareId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function revokeShare(articleId: string) {
    try {
      await apiClient.delete(`/api/articles/${articleId}/share-link`);
      setShares((prev) => prev.filter((s) => s.article_id !== articleId));
      // Clear localStorage cache so article-detail allows re-sharing
      window.localStorage.removeItem(`article-share-link:${articleId}`);
    } catch {
      // silently fail
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(DATE_LOCALE_MAP[locale] ?? "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl relative overflow-hidden rounded-[2rem] border-2 border-cm-text/10 bg-cm-bg p-6 lg:p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-65"
          style={{
            backgroundImage:
              "radial-gradient(rgba(232, 185, 49, 0.45) 1.1px, transparent 1.1px), radial-gradient(rgba(74, 74, 74, 0.2) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
            backgroundPosition: "0px 0px, 11px 11px",
          }}
        />
        <div className="relative space-y-7">
          <div>
            <div className="h-10 w-48 animate-pulse rounded bg-muted" />
            <div className="mt-6 h-4 w-64 animate-pulse rounded bg-muted" />
          </div>
          <div className="space-y-5">
            {["skeleton-1", "skeleton-2", "skeleton-3"].map((skeletonId) => (
              <div
                key={skeletonId}
                className="cm-doodle-border bg-white/95 p-5 dark:bg-cm-surface/95"
              >
                <div className="space-y-3">
                  <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl relative overflow-hidden rounded-[2rem] border-2 border-cm-text/10 bg-cm-bg p-6 lg:p-8">
      {/* Dotted background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-65"
        style={{
          backgroundImage:
            "radial-gradient(rgba(232, 185, 49, 0.45) 1.1px, transparent 1.1px), radial-gradient(rgba(74, 74, 74, 0.2) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          backgroundPosition: "0px 0px, 11px 11px",
        }}
      />

      <div className="relative space-y-7">
        {/* Header */}
        <header>
          <h1 className="font-creative-display text-[clamp(2rem,3.1vw,3.3rem)] font-black text-cm-text">
            {t("sidebar.nav.shared")}
          </h1>
          <div className="mt-3 h-1.5 w-32 -rotate-1 rounded-full bg-nod-gold/45" />
          <p className="mt-4 font-creative-body text-base italic text-cm-text/65">
            {shares.length === 0 && !error
              ? "No shared links yet. Share an article to see it here."
              : `${shares.length} shared link${shares.length !== 1 ? "s" : ""}`}
          </p>
        </header>

        {/* Error */}
        {error ? (
          <div className="cm-doodle-border flex items-center gap-3 bg-red-50/80 p-4 text-sm text-red-700 dark:bg-red-950/20 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="font-creative-body">{error}</span>
            <button
              type="button"
              onClick={fetchShares}
              className="ml-auto font-creative-body text-xs font-black underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* Empty state */}
        {shares.length === 0 && !error && (
          <div className="cm-doodle-border flex flex-col items-center gap-4 bg-white/95 py-8 text-center dark:bg-cm-surface/95 sm:py-16">
            <Share2 className="h-12 w-12 text-cm-text/20" />
            <p className="font-creative-body text-sm text-cm-text/50">
              Share an article from the content detail page to see it here.
            </p>
          </div>
        )}

        {/* Cards */}
        {shares.length > 0 && (
          <div className="space-y-5">
            {shares.map((share) => (
              <article
                key={share.share_id}
                className="group relative cm-doodle-border cm-sketch-shadow cursor-pointer bg-white/95 p-5 transition-all hover:-translate-y-0.5 hover:border-nod-gold/35 dark:bg-cm-surface/95"
              >
                {/* Full-card click target */}
                <a
                  href={share.public_url ?? share.canonical_share_url}
                  className="absolute inset-0 z-10"
                  aria-label={share.article_title}
                >
                  <span className="sr-only">{share.article_title}</span>
                </a>
                {/* Thumbnail */}
                <div className="mb-4 overflow-hidden rounded-xl">
                  {share.thumbnail_url ? (
                    <div className="relative w-full" style={{ aspectRatio: "1200 / 630" }}>
                      <Image
                        src={share.thumbnail_url}
                        alt={share.article_title}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 768px"
                        className="object-cover transition-transform group-hover:scale-[1.02]"
                      />
                    </div>
                  ) : (
                    <ShareCardPlaceholder
                      title={share.article_title}
                      contentType={share.content_type}
                      domain={share.article_url}
                      summaryPreview={share.summary_preview}
                    />
                  )}
                </div>
                <div className="space-y-4">
                  {/* Title + menu */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-3">
                      <h3 className="font-creative-display text-lg font-black leading-snug text-cm-text transition-colors group-hover:text-nod-gold">
                        {share.article_title}
                      </h3>

                      {/* Content type badge */}
                      {share.content_type && CONTENT_TYPE_STYLES[share.content_type] ? (
                        <div className="flex flex-wrap gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-creative-body font-black ${CONTENT_TYPE_STYLES[share.content_type].className}`}
                          >
                            {CONTENT_TYPE_STYLES[share.content_type].label}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="relative z-20 mt-1 shrink-0 rounded-md p-1.5 text-cm-text/40 hover:bg-cm-bg hover:text-cm-text"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => copyShareUrl(share.share_id, share.canonical_share_url)}
                        >
                          {copiedId === share.share_id ? (
                            <Check className="mr-2 h-4 w-4" />
                          ) : (
                            <Copy className="mr-2 h-4 w-4" />
                          )}
                          {copiedId === share.share_id ? "Copied!" : "Copy link"}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a
                            href={share.canonical_share_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open shared page
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => revokeShare(share.article_id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Revoke link
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Summary preview */}
                  {share.summary_preview ? (
                    <p className="font-creative-body text-sm leading-relaxed text-cm-text/65">
                      {share.summary_preview}
                    </p>
                  ) : null}

                  {/* Concepts */}
                  {share.concepts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {share.concepts.map((concept) => (
                        <span
                          key={concept}
                          className="inline-flex items-center rounded-full border border-cm-text/15 bg-cm-bg px-2.5 py-0.5 font-creative-body text-xs font-bold text-cm-text/60"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-dashed border-cm-text/15 pt-3">
                    <p className="font-creative-body text-xs font-bold text-cm-text/45">
                      {formatDate(share.created_at)}
                    </p>
                    <div className="flex items-center gap-3 font-creative-body text-xs text-cm-text/40">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {share.view_count}
                      </span>
                      {share.comment_count > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="h-3.5 w-3.5" />
                          {share.comment_count}
                        </span>
                      )}
                      {share.empathy_count > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5" />
                          {share.empathy_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
