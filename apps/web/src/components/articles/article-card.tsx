"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ArticleListItem } from "@/lib/api/articles";

export interface ArticleCardProps {
  article: ArticleListItem & { concepts?: string[] };
}

const DATE_LOCALE_MAP: Record<string, string> = {
  ko: "ko-KR",
  en: "en-US",
  ja: "ja-JP",
};

export function ArticleCard({ article }: ArticleCardProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  const dateLocale = DATE_LOCALE_MAP[locale] || "en-US";
  const formattedDate = new Date(article.created_at).toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const hasSummary = article.summary_preview && article.summary_preview.trim() !== "";
  const hasConcepts = article.concepts && article.concepts.length > 0;

  return (
    <Card role="article" className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="space-y-2">
          <Link
            href={`/articles/${article.id}`}
            className="text-xl font-semibold hover:underline"
          >
            {article.title}
          </Link>
          <div className="flex gap-2">
            <Badge variant="secondary">{article.status}</Badge>
            <Badge variant="outline">{article.source}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {hasSummary ? article.summary_preview : t("noSummary")}
          </p>
          <p className="text-xs text-muted-foreground">{formattedDate}</p>
          {hasConcepts && (
            <div data-testid="concepts-section" className="flex flex-wrap gap-2">
              {article.concepts!.map((concept) => (
                <Badge key={concept} variant="outline" className="text-xs">
                  {concept}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
