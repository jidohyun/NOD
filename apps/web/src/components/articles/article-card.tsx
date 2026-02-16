"use client";

import { RefreshCw, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ArticleListItem } from "@/lib/api/articles";

export interface ArticleCardProps {
  article: ArticleListItem & { concepts?: string[] };
  onRefresh?: (id: string) => void;
  onRetry?: (id: string) => void;
  isRefreshing?: boolean;
}

const DATE_LOCALE_MAP: Record<string, string> = {
  ko: "ko-KR",
  en: "en-US",
  ja: "ja-JP",
};

const STATUS_STYLES: Record<string, { className: string; labelKey: string }> = {
  pending: {
    className: "bg-amber-100 text-amber-800 border-amber-200",
    labelKey: "statusPending",
  },
  processing: {
    className: "bg-blue-100 text-blue-800 border-blue-200",
    labelKey: "statusProcessing",
  },
  analyzing: {
    className: "bg-blue-100 text-blue-800 border-blue-200",
    labelKey: "statusAnalyzing",
  },
  analyzed: {
    className: "bg-green-100 text-green-800 border-green-200",
    labelKey: "statusCompleted",
  },
  completed: {
    className: "bg-green-100 text-green-800 border-green-200",
    labelKey: "statusCompleted",
  },
  failed: {
    className: "bg-red-100 text-red-800 border-red-200",
    labelKey: "statusFailed",
  },
};

export function ArticleCard({ article, onRefresh, onRetry, isRefreshing }: ArticleCardProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  const dateLocale = DATE_LOCALE_MAP[locale] || "en-US";
  const formattedDate = new Date(article.created_at).toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const hasSummary = (article.summary_preview?.trim() ?? "") !== "";
  const hasConcepts = (article.concepts?.length ?? 0) > 0;

  // Derive effective status: if summary exists, analysis succeeded
  const effectiveStatus = hasSummary && article.status === "failed" ? "analyzed" : article.status;

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
    <Card role="article" className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="space-y-2">
          <Link href={`/articles/${article.id}`} className="text-xl font-semibold hover:underline">
            {article.title}
          </Link>
          <div className="flex gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyle?.className ?? "bg-gray-100 text-gray-800 border-gray-200"}`}
            >
              {isPending ? (
                <span className="h-2 w-2 animate-pulse rounded-full bg-current opacity-60" />
              ) : null}
              {statusLabel}
            </span>
            <Badge variant="outline">{article.source}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {isPending
              ? t(effectiveStatus === "pending" ? "pendingAnalysis" : "analyzingArticle")
              : hasSummary
                ? article.summary_preview
                : t("noSummary")}
          </p>
          <p className="text-xs text-muted-foreground">{formattedDate}</p>
          {hasConcepts ? (
            <div data-testid="concepts-section" className="flex flex-wrap gap-2">
              {article.concepts?.map((concept) => (
                <Badge key={concept} variant="outline" className="text-xs">
                  {concept}
                </Badge>
              ))}
            </div>
          ) : null}

          {effectiveStatus === "processing" && onRefresh && (
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRefresh(article.id)}
                disabled={isRefreshing}
                className="text-xs"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? t("refreshing") : t("checkStatus")}
              </Button>
            </div>
          )}

          {effectiveStatus === "failed" && onRetry && (
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRetry(article.id)}
                disabled={isRefreshing}
                className="text-xs border-red-200 hover:bg-red-50"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                {t("retryAnalysis")}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
