"use client";

import { BookOpen, Brain, ChevronLeft, FileText, Pencil, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArticleMarkdownNote } from "@/components/articles/article-markdown-note";
import { TypeMetadataSection } from "@/components/articles/type-metadata";
import { useArticle, useDeleteArticle, useUpdateArticle } from "@/lib/api/articles";
import { Link } from "@/lib/i18n/routing";

const STATUS_MAP: Record<string, { color: string; labelKey: string }> = {
  pending: { color: "bg-amber-100 text-amber-800", labelKey: "statusPending" },
  processing: { color: "bg-blue-100 text-blue-800", labelKey: "statusProcessing" },
  analyzing: { color: "bg-blue-100 text-blue-800", labelKey: "statusAnalyzing" },
  analyzed: { color: "bg-green-100 text-green-800", labelKey: "statusCompleted" },
  completed: { color: "bg-green-100 text-green-800", labelKey: "statusCompleted" },
  failed: { color: "bg-red-100 text-red-800", labelKey: "statusFailed" },
};

const DATE_LOCALE_MAP: Record<string, string> = {
  ko: "ko-KR",
  en: "en-US",
  ja: "ja-JP",
};

const CONTENT_TYPE_STYLES: Record<string, { labelKey: string; className: string }> = {
  tech_blog: { labelKey: "typeTechBlog", className: "bg-blue-100 text-blue-800" },
  academic_paper: { labelKey: "typePaper", className: "bg-purple-100 text-purple-800" },
  general_news: { labelKey: "typeNews", className: "bg-gray-100 text-gray-800" },
  github_repo: { labelKey: "typeGitHub", className: "bg-slate-100 text-slate-800" },
  official_docs: { labelKey: "typeDocs", className: "bg-teal-100 text-teal-800" },
  video_podcast: { labelKey: "typeVideo", className: "bg-pink-100 text-pink-800" },
};

export function ArticleDetail({ id }: { id: string }) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const locale = useLocale();
  const { data: article, isLoading, isError } = useArticle(id);
  const deleteArticle = useDeleteArticle();
  const router = useRouter();
  const updateArticle = useUpdateArticle();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const dateLocale = DATE_LOCALE_MAP[locale] || "en-US";

  if (isLoading) {
    return <div className="py-12 text-center text-muted-foreground">{tc("loading")}</div>;
  }
  if (isError || !article) {
    return <div className="py-12 text-center text-destructive">{t("articleNotFound")}</div>;
  }

  // Derive effective status: if summary exists, analysis succeeded
  const effectiveStatus =
    article.summary && article.status === "failed" ? "analyzed" : article.status;
  const statusMeta = STATUS_MAP[effectiveStatus];
  const statusLabel = statusMeta
    ? t(
        statusMeta.labelKey as
          | "statusPending"
          | "statusProcessing"
          | "statusAnalyzing"
          | "statusCompleted"
          | "statusFailed"
      )
    : effectiveStatus;

  const startEditingTitle = () => {
    if (!article) return;
    setEditTitle(article.title);
    setIsEditingTitle(true);
  };

  const cancelEditingTitle = () => {
    setIsEditingTitle(false);
    setEditTitle("");
  };

  const saveTitle = async () => {
    if (!article) return;
    const trimmed = editTitle.trim();
    if (!trimmed || trimmed.length > 500 || trimmed === article.title) {
      cancelEditingTitle();
      return;
    }
    await updateArticle.mutateAsync({ id, data: { title: trimmed } });
    setIsEditingTitle(false);
  };

  const restoreOriginalTitle = async () => {
    if (!article?.original_title || article.original_title === article.title) return;
    await updateArticle.mutateAsync({ id, data: { title: article.original_title } });
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void saveTitle();
    } else if (e.key === "Escape") {
      cancelEditingTitle();
    }
  };

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
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={handleTitleKeyDown}
              maxLength={500}
              className="w-full text-2xl font-bold bg-transparent border-b-2 border-primary outline-none"
              disabled={updateArticle.isPending}
              style={{ opacity: updateArticle.isPending ? 0.5 : 1 }}
            />
          ) : (
            <h1 className="text-2xl font-bold">
              <button
                type="button"
                className="group inline-flex items-center cursor-pointer hover:text-primary/80 transition-colors"
                onClick={startEditingTitle}
                title={tc("edit")}
              >
                {article.title}
                <Pencil className="ml-2 inline-block h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity" />
              </button>
            </h1>
          )}
          <div className="flex shrink-0 gap-2">
            {article.original_title && article.title !== article.original_title && (
              <button
                type="button"
                onClick={restoreOriginalTitle}
                disabled={updateArticle.isPending}
                className="rounded-md border px-3 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                title={tc("restoreOriginal")}
              >
                <RotateCcw className="mr-1 inline-block h-3 w-3" />
                {tc("restoreOriginal")}
              </button>
            )}
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-md border border-destructive px-3 py-1 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              {tc("delete")}
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusMeta?.color || ""}`}
          >
            {statusLabel}
          </span>
          {(() => {
            const ct = article.summary?.content_type || "general_news";
            const ctStyle = CONTENT_TYPE_STYLES[ct] || CONTENT_TYPE_STYLES.general_news;
            return (
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ctStyle.className}`}>
                {t(
                  ctStyle.labelKey as
                    | "typeTechBlog"
                    | "typePaper"
                    | "typeNews"
                    | "typeGitHub"
                    | "typeDocs"
                    | "typeVideo"
                )}
              </span>
            );
          })()}
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

      {/* Status indicator for pending/processing/analyzing */}
      {(effectiveStatus === "pending" ||
        effectiveStatus === "processing" ||
        effectiveStatus === "analyzing") && <AnalysisProgress status={effectiveStatus} />}

      {/* Summary — only after analysis completes */}
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
              <ArticleMarkdownNote markdownNote={article.summary.markdown_note} />
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

          {article.summary.content_type &&
            article.summary.type_metadata &&
            Object.keys(article.summary.type_metadata).length > 0 && (
              <section className="rounded-lg border bg-card p-4">
                <h2 className="text-lg font-semibold mb-2">
                  {t(
                    (CONTENT_TYPE_STYLES[article.summary.content_type]?.labelKey || "typeNews") as
                      | "typeTechBlog"
                      | "typePaper"
                      | "typeNews"
                      | "typeGitHub"
                      | "typeDocs"
                      | "typeVideo"
                  )}{" "}
                  Details
                </h2>
                <TypeMetadataSection
                  contentType={article.summary.content_type}
                  metadata={article.summary.type_metadata}
                />
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

function AnalysisProgress({ status }: { status: string }) {
  const t = useTranslations("dashboard");

  const steps = useMemo(
    () => [
      { key: "reading" as const, icon: BookOpen, label: t("analysisStepReading") },
      { key: "analyzing" as const, icon: Brain, label: t("analysisStepAnalyzing") },
      { key: "summary" as const, icon: FileText, label: t("analysisStepSummary") },
    ],
    [t]
  );

  const activeIndex = status === "pending" ? 0 : status === "processing" ? 1 : 2;

  return (
    <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="mb-5 flex items-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="text-sm font-medium text-blue-900">
          {status === "pending" ? t("pendingAnalysis") : t("analyzingArticle")}
        </p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-3">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isDone = i < activeIndex;
          const isActive = i === activeIndex;

          return (
            <div key={step.key} className="flex flex-1 items-center gap-3">
              <div className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500 ${
                    isDone
                      ? "bg-blue-600 text-white"
                      : isActive
                        ? "bg-blue-100 text-blue-700 ring-2 ring-blue-400 ring-offset-2 animate-pulse"
                        : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={`text-xs text-center font-medium ${
                    isDone ? "text-blue-700" : isActive ? "text-blue-900" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-0.5 w-6 shrink-0 rounded-full transition-colors duration-500 -mt-5 ${
                    isDone ? "bg-blue-400" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-xs text-blue-700/70">{t("analysisDescription")}</p>
    </div>
  );
}
