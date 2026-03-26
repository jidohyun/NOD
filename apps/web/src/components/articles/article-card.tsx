"use client";

import { RotateCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ArticleListItem } from "@/lib/api/articles";
import { Link } from "@/lib/i18n/routing";

export interface ArticleCardProps {
  article: ArticleListItem & { concepts?: string[] };
  onRetry?: (id: string) => void;
  isRefreshing?: boolean;
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

const STATUS_STYLES: Record<string, { className: string; labelKey: string }> = {
  pending: {
    className:
      "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800",
    labelKey: "statusPending",
  },
  processing: {
    className:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800",
    labelKey: "statusProcessing",
  },
  analyzing: {
    className:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800",
    labelKey: "statusAnalyzing",
  },
  analyzed: {
    className:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800",
    labelKey: "statusCompleted",
  },
  completed: {
    className:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800",
    labelKey: "statusCompleted",
  },
  failed: {
    className:
      "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800",
    labelKey: "statusFailed",
  },
};

const CONTENT_TYPE_STYLES: Record<string, { labelKey: string; className: string }> = {
  tech_blog: {
    labelKey: "typeTechBlog",
    className:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800",
  },
  academic_paper: {
    labelKey: "typePaper",
    className:
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
  },
  general_news: {
    labelKey: "typeNews",
    className:
      "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-700",
  },
  github_repo: {
    labelKey: "typeGitHub",
    className:
      "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700",
  },
  official_docs: {
    labelKey: "typeDocs",
    className:
      "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800",
  },
  video_podcast: {
    labelKey: "typeVideo",
    className:
      "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-400 dark:border-pink-800",
  },
  patch_note: {
    labelKey: "typePatchNote",
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
  },
};

export function ArticleCard({ article, onRetry, isRefreshing }: ArticleCardProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const openContentLabel = t("openContent");

  const dateLocale = DATE_LOCALE_MAP[locale] || "en-US";
  const formattedDate = new Date(article.created_at).toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const hasSummary = (article.summary_preview?.trim() ?? "") !== "";
  const hasConcepts = (article.concepts?.length ?? 0) > 0;

  const effectiveStatus =
    hasSummary && (article.status === "processing" || article.status === "failed")
      ? "analyzed"
      : article.status;

  const isPending =
    effectiveStatus === "pending" ||
    effectiveStatus === "analyzing" ||
    effectiveStatus === "processing";
  const statusStyle = STATUS_STYLES[effectiveStatus];
  const statusLabel = statusStyle
    ? t(
        statusStyle.labelKey as
          | "statusPending"
          | "statusProcessing"
          | "statusAnalyzing"
          | "statusCompleted"
          | "statusFailed"
      )
    : effectiveStatus;

  return (
    <article className="group relative cm-doodle-border cm-sketch-shadow h-full cursor-pointer bg-white/95 dark:bg-cm-surface/95 p-5 transition-all hover:-translate-y-1 hover:border-nod-gold/35">
      <Link
        href={`/articles/${article.id}`}
        aria-label={article.title || openContentLabel}
        className="absolute inset-0 z-10 block"
      />

      <div className="space-y-4">
        <div className="space-y-3">
          <h3 className="font-creative-display text-lg leading-snug font-black text-cm-text transition-colors group-hover:text-nod-gold">
            {article.title}
          </h3>

          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-creative-body font-black ${statusStyle?.className ?? "bg-gray-100 text-gray-800 border-gray-200"}`}
            >
              {isPending ? (
                <span className="h-2 w-2 animate-pulse rounded-full bg-current opacity-60" />
              ) : null}
              {statusLabel}
            </span>

            {(() => {
              const rawCt = article.content_type || "general_news";
              const isNodChangelog =
                article.url?.includes("nod-archive.com") && article.url?.includes("/changelog/");
              const ct = isNodChangelog ? "patch_note" : rawCt;
              const ctStyle = CONTENT_TYPE_STYLES[ct] || CONTENT_TYPE_STYLES.general_news;
              return (
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-creative-body font-black ${ctStyle.className}`}
                >
                  {t(
                    ctStyle.labelKey as
                      | "typeTechBlog"
                      | "typePaper"
                      | "typeNews"
                      | "typeGitHub"
                      | "typeDocs"
                      | "typeVideo"
                      | "typePatchNote"
                  )}
                </span>
              );
            })()}
          </div>
        </div>

        <p className="font-creative-body text-sm leading-relaxed text-cm-text/65">
          {isPending
            ? t(effectiveStatus === "pending" ? "pendingAnalysis" : "analyzingArticle")
            : hasSummary
              ? article.summary_preview
              : t("noSummary")}
        </p>

        {hasConcepts ? (
          <div data-testid="concepts-section" className="flex flex-wrap gap-2">
            {article.concepts?.map((concept) => (
              <Badge
                key={concept}
                variant="outline"
                className="border-cm-text/20 bg-cm-bg/70 font-creative-body text-[11px] font-bold text-cm-text"
              >
                {concept}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t border-dashed border-cm-text/15 pt-3">
          <p className="font-creative-body text-xs font-bold text-cm-text/45">{formattedDate}</p>
        </div>

        {isPending ? (
          <div className="flex items-center gap-2 font-creative-body text-xs font-black text-blue-600">
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            {t("summaryInProgress")}
          </div>
        ) : null}

        {effectiveStatus === "failed" && onRetry ? (
          <div className="relative z-20 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRetry(article.id)}
              disabled={isRefreshing}
              className="cm-doodle-border border-red-200 bg-white dark:bg-cm-surface font-creative-body text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              {t("retryAnalysis")}
            </Button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
