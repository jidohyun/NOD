"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useArticle, useDeleteArticle } from "@/lib/api/articles";
import { Link } from "@/lib/i18n/routing";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-primary/10 text-primary",
  analyzing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

const DATE_LOCALE_MAP: Record<string, string> = {
  ko: "ko-KR",
  en: "en-US",
  ja: "ja-JP",
};

export function ArticleDetail({ id }: { id: string }) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { data: article, isLoading, isError } = useArticle(id);
  const deleteArticle = useDeleteArticle();
  const router = useRouter();

  const dateLocale = DATE_LOCALE_MAP[locale] || "en-US";

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">{tc("loading")}</div>;
  }
  if (isError || !article) {
    return <div className="py-12 text-center text-destructive">{t("articleNotFound")}</div>;
  }

  const handleDelete = async () => {
    if (!confirm(t("deleteConfirm"))) return;
    await deleteArticle.mutateAsync(id);
    router.push("/articles");
  };

  const formattedDate = new Date(article.created_at).toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const downloadMarkdown = () => {
    if (!article.summary?.markdown_note) return;
    const blob = new Blob([article.summary.markdown_note], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `article-${article.id}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Link
        href="/articles"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {t("myArticles")}
      </Link>
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold">{article.title}</h1>
          <button
            type="button"
            onClick={handleDelete}
            className="shrink-0 rounded-md border border-destructive px-3 py-1 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            {tc("delete")}
          </button>
        </div>
        <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[article.status] || ""}`}
          >
            {article.status}
          </span>
          <span className="rounded bg-secondary px-1.5 py-0.5 text-xs">{article.source}</span>
          <time>{formattedDate}</time>
          {article.url ? (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {t("original")}
            </a>
          ) : null}
        </div>
      </div>

      {/* Status indicator for pending/analyzing */}
      {(article.status === "pending" || article.status === "analyzing") && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="text-sm text-blue-800">
              {article.status === "pending" ? t("pendingAnalysis") : t("analyzingArticle")}
            </p>
          </div>
        </div>
      )}

      {/* Summary */}
      {article.summary ? (
        <div className="space-y-4">
          <section className="rounded-lg border bg-card p-4">
            <h2 className="text-lg font-semibold mb-2">{t("summary")}</h2>
            <p className="text-sm leading-relaxed">{article.summary.summary}</p>
            {article.summary.reading_time_minutes ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("readTime", { minutes: article.summary.reading_time_minutes })}
                {article.summary.language ? ` · ${article.summary.language.toUpperCase()}` : null}
              </p>
            ) : null}
          </section>

          {article.summary.markdown_note ? (
            <section className="rounded-lg border bg-card p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{t("markdownNote")}</h2>
                <button
                  type="button"
                  onClick={downloadMarkdown}
                  className="rounded-md border px-3 py-1 text-sm hover:bg-accent"
                >
                  {t("downloadMarkdown")}
                </button>
              </div>
              <div className="text-sm leading-relaxed">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h3 className="mt-4 first:mt-0 text-base font-semibold">{children}</h3>
                    ),
                    h2: ({ children }) => (
                      <h4 className="mt-3 first:mt-0 text-sm font-semibold">{children}</h4>
                    ),
                    h3: ({ children }) => (
                      <h5 className="mt-3 first:mt-0 text-sm font-semibold">{children}</h5>
                    ),
                    p: ({ children }) => <p className="mt-2 first:mt-0">{children}</p>,
                    ul: ({ children }) => (
                      <ul className="mt-2 list-disc pl-5 space-y-1">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mt-2 list-decimal pl-5 space-y-1">{children}</ol>
                    ),
                    li: ({ children }) => <li>{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="mt-3 border-l-2 pl-3 text-muted-foreground">
                        {children}
                      </blockquote>
                    ),
                    a: ({ children, href }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {children}
                      </a>
                    ),
                    code: ({ children }) => (
                      <code className="rounded bg-muted px-1 py-0.5 text-[0.9em]">{children}</code>
                    ),
                    pre: ({ children }) => (
                      <pre className="mt-3 overflow-x-auto rounded bg-muted p-3 text-xs">
                        {children}
                      </pre>
                    ),
                  }}
                >
                  {article.summary.markdown_note}
                </ReactMarkdown>
              </div>
            </section>
          ) : null}

          {article.summary.concepts.length > 0 && (
            <section className="rounded-lg border bg-card p-4">
              <h2 className="text-lg font-semibold mb-2">{t("concepts")}</h2>
              <div className="flex flex-wrap gap-2">
                {article.summary.concepts.map((concept) => (
                  <span
                    key={concept}
                    className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </section>
          )}

          {article.summary.key_points.length > 0 && (
            <section className="rounded-lg border bg-card p-4">
              <h2 className="text-lg font-semibold mb-2">{t("keyPoints")}</h2>
              <ul className="list-disc list-inside space-y-1">
                {article.summary.key_points.map((point) => (
                  <li key={point} className="text-sm leading-relaxed">
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="text-xs text-muted-foreground">
            {t("analyzedBy", {
              provider: article.summary.ai_provider,
              model: article.summary.ai_model,
            })}
          </p>
        </div>
      ) : null}
    </div>
  );
}
