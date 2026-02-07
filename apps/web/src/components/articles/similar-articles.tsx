"use client";

import { useSimilarArticles } from "@/lib/api/articles";
import { useTranslations } from "next-intl";
import Link from "next/link";

export function SimilarArticles({ articleId }: { articleId: string }) {
  const t = useTranslations("dashboard");
  const { data: similar, isLoading } = useSimilarArticles(articleId);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">{t("loadingSimilar")}</div>;
  }

  if (!similar || similar.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="text-lg font-semibold mb-3">{t("similarArticles")}</h2>
      <div className="space-y-3">
        {similar.map((item) => (
          <Link
            key={item.id}
            href={`/articles/${item.id}`}
            className="block rounded-md border p-3 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-medium line-clamp-1">{item.title}</h3>
              <span className="shrink-0 text-xs font-medium text-primary">
                {t("similarity", { percent: Math.round(item.similarity * 100) })}
              </span>
            </div>
            {item.summary_preview && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {item.summary_preview}
              </p>
            )}
            {item.shared_concepts.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {item.shared_concepts.map((concept) => (
                  <span
                    key={concept}
                    className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
