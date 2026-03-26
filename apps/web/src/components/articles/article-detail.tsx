"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  Brain,
  Check,
  ChevronLeft,
  Copy,
  ExternalLink,
  FileText,
  Pencil,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  type CSSProperties,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArticleMarkdownNote } from "@/components/articles/article-markdown-note";
import { TypeMetadataSection } from "@/components/articles/type-metadata";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useArticle,
  useCreateArticleShareLink,
  useDeleteArticle,
  useUpdateArticle,
} from "@/lib/api/articles";
import { Link } from "@/lib/i18n/routing";

const DETAIL_BG_STYLE: CSSProperties = {
  backgroundImage:
    "radial-gradient(rgba(232, 185, 49, 0.45) 1.1px, transparent 1.1px), radial-gradient(rgba(74, 74, 74, 0.2) 1px, transparent 1px)",
  backgroundSize: "22px 22px",
  backgroundPosition: "0 0, 11px 11px",
};

const STATUS_MAP: Record<string, { className: string; labelKey: string }> = {
  pending: {
    className:
      "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-700",
    labelKey: "statusPending",
  },
  processing: {
    className:
      "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-700",
    labelKey: "statusProcessing",
  },
  analyzing: {
    className:
      "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-700",
    labelKey: "statusAnalyzing",
  },
  analyzed: {
    className:
      "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-700",
    labelKey: "statusCompleted",
  },
  completed: {
    className:
      "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-700",
    labelKey: "statusCompleted",
  },
  failed: {
    className:
      "bg-red-100 text-red-700 border-red-300 dark:bg-red-950/50 dark:text-red-400 dark:border-red-700",
    labelKey: "statusFailed",
  },
};

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

const SHARE_LINK_STORAGE_KEY_PREFIX = "article-share-link:";

function getShareLinkStorageKey(articleId: string) {
  return `${SHARE_LINK_STORAGE_KEY_PREFIX}${articleId}`;
}

const CONTENT_TYPE_STYLES: Record<string, { labelKey: string; className: string }> = {
  tech_blog: {
    labelKey: "typeTechBlog",
    className:
      "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-700",
  },
  academic_paper: {
    labelKey: "typePaper",
    className:
      "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-700",
  },
  general_news: {
    labelKey: "typeNews",
    className:
      "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-950/50 dark:text-gray-400 dark:border-gray-700",
  },
  github_repo: {
    labelKey: "typeGitHub",
    className:
      "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-950/50 dark:text-slate-400 dark:border-slate-700",
  },
  official_docs: {
    labelKey: "typeDocs",
    className:
      "bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-950/50 dark:text-teal-400 dark:border-teal-700",
  },
  video_podcast: {
    labelKey: "typeVideo",
    className:
      "bg-pink-100 text-pink-700 border-pink-300 dark:bg-pink-950/50 dark:text-pink-400 dark:border-pink-700",
  },
  patch_note: {
    labelKey: "typePatchNote",
    className:
      "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-700",
  },
};

type DashboardStatusKey =
  | "statusPending"
  | "statusProcessing"
  | "statusAnalyzing"
  | "statusCompleted"
  | "statusFailed";

export function ArticleDetail({ id }: { id: string }) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const { data: article, isLoading, isError } = useArticle(id);
  const deleteArticle = useDeleteArticle();
  const updateArticle = useUpdateArticle();
  const createShareLink = useCreateArticleShareLink();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [shareLinkUrl, setShareLinkUrl] = useState("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrlMode, setShareUrlMode] = useState<"default" | "manual">("default");
  const [shareThumbnailMode, setShareThumbnailMode] = useState<"default" | "manual">("default");
  const [customShareUrl, setCustomShareUrl] = useState("");
  const [customThumbnailUrl, setCustomThumbnailUrl] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    setCopied(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const cachedShareLink = window.localStorage.getItem(getShareLinkStorageKey(id));
    if (cachedShareLink) {
      setShareLinkUrl(cachedShareLink);
      return;
    }

    setShareLinkUrl("");
  }, [id]);

  const dateLocale = DATE_LOCALE_MAP[locale] || "en-US";

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-[2rem] border-2 border-cm-text/10 bg-cm-bg p-6 lg:p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-65 dark:opacity-30"
          style={DETAIL_BG_STYLE}
        />
        <div className="relative space-y-6">
          <Skeleton className="h-8 w-32 bg-cm-text/10" />

          <div className="cm-doodle-border bg-white/92 dark:bg-cm-surface/92 p-6">
            <Skeleton className="h-10 w-2/3 bg-cm-text/10" />
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full bg-cm-text/10" />
              <Skeleton className="h-6 w-20 rounded-full bg-cm-text/10" />
              <Skeleton className="h-6 w-28 rounded-full bg-cm-text/10" />
            </div>
            <Skeleton className="mt-6 h-4 w-full bg-cm-text/10" />
            <Skeleton className="mt-2 h-4 w-5/6 bg-cm-text/10" />
          </div>

          <div className="cm-doodle-border bg-white/92 dark:bg-cm-surface/92 p-6">
            <Skeleton className="h-6 w-36 bg-cm-text/10" />
            <Skeleton className="mt-4 h-4 w-full bg-cm-text/10" />
            <Skeleton className="mt-2 h-4 w-full bg-cm-text/10" />
            <Skeleton className="mt-2 h-4 w-4/5 bg-cm-text/10" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="cm-doodle-border border-2 border-red-200 dark:border-red-800 bg-red-50/70 dark:bg-red-950/30 p-8 text-center">
        <p className="font-creative-body font-black text-red-500">{t("articleNotFound")}</p>
      </div>
    );
  }

  const effectiveStatus =
    article.summary && article.status === "failed" ? "analyzed" : article.status;
  const statusMeta = STATUS_MAP[effectiveStatus];
  const statusLabel = statusMeta ? t(statusMeta.labelKey as DashboardStatusKey) : effectiveStatus;

  const summaryTags = Array.isArray(article.summary?.type_metadata?.tags)
    ? article.summary.type_metadata.tags
    : [];
  const contentType = summaryTags.includes("patch-note")
    ? "patch_note"
    : article.summary?.content_type || "general_news";
  const contentTypeMeta = CONTENT_TYPE_STYLES[contentType] || CONTENT_TYPE_STYLES.general_news;

  const formattedDate = new Date(article.created_at).toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const startEditingTitle = () => {
    setEditTitle(article.title);
    setIsEditingTitle(true);
  };

  const cancelEditingTitle = () => {
    setIsEditingTitle(false);
    setEditTitle("");
  };

  const saveTitle = async () => {
    const trimmed = editTitle.trim();
    if (!trimmed || trimmed.length > 500 || trimmed === article.title) {
      cancelEditingTitle();
      return;
    }

    await updateArticle.mutateAsync({ id, data: { title: trimmed } });
    setIsEditingTitle(false);
  };

  const restoreOriginalTitle = async () => {
    if (!article.original_title || article.original_title === article.title) return;
    await updateArticle.mutateAsync({ id, data: { title: article.original_title } });
  };

  const handleTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void saveTitle();
    }
    if (e.key === "Escape") {
      cancelEditingTitle();
    }
  };

  const handleDelete = async () => {
    if (!confirm(t("deleteConfirm"))) return;
    await deleteArticle.mutateAsync(id);
    router.push("/articles");
  };

  const downloadMarkdown = () => {
    if (!article.summary?.markdown_note) return;
    const blob = new Blob([article.summary.markdown_note], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `article-${article.id}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const createAbsoluteShareUrl = async () => {
    const trimmedCustomUrl = customShareUrl.trim();
    const trimmedCustomOgImageUrl = customThumbnailUrl.trim();

    const response = await createShareLink.mutateAsync({
      articleId: id,
      options: {
        url_mode: shareUrlMode,
        custom_url: shareUrlMode === "manual" ? trimmedCustomUrl : undefined,
        thumbnail_mode: shareThumbnailMode,
        thumbnail_url: shareThumbnailMode === "manual" ? trimmedCustomOgImageUrl : undefined,
      },
    });
    const sharePath = response.canonical_share_url || response.share_url;
    const absoluteUrl =
      typeof window === "undefined" ? sharePath : `${window.location.origin}${sharePath}`;

    if (typeof window !== "undefined") {
      window.localStorage.setItem(getShareLinkStorageKey(id), absoluteUrl);
    }

    setShareLinkUrl(absoluteUrl);
    return absoluteUrl;
  };

  const handleCopyShareLink = async () => {
    if (!shareLinkUrl) return;
    await navigator.clipboard.writeText(shareLinkUrl);
    setCopied(true);
  };

  const handleShareGenerate = async () => {
    await createAbsoluteShareUrl();
  };

  return (
    <div className="relative overflow-hidden rounded-[2rem] border-2 border-cm-text/10 bg-cm-bg p-6 lg:p-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-65 dark:opacity-30"
        style={DETAIL_BG_STYLE}
      />

      <div className="relative space-y-7">
        <Link
          href="/articles"
          className="inline-flex items-center gap-1 font-creative-body text-sm font-bold text-cm-text/55 transition-colors hover:text-cm-text"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("myArticles")}
        </Link>

        <section className="cm-doodle-border cm-sketch-shadow bg-white/95 dark:bg-cm-surface/95 p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={handleTitleKeyDown}
                  maxLength={500}
                  disabled={updateArticle.isPending}
                  className="w-full border-b-2 border-cm-text/30 bg-transparent pb-1 font-creative-display text-[clamp(2rem,3.7vw,3.1rem)] font-black leading-tight text-cm-text outline-none"
                  style={{ opacity: updateArticle.isPending ? 0.6 : 1 }}
                />
              ) : (
                <h1 className="font-creative-display text-[clamp(2rem,3.7vw,3.1rem)] font-black leading-tight text-cm-text">
                  <button
                    type="button"
                    className="group inline-flex items-center text-left transition-colors hover:text-nod-gold"
                    onClick={startEditingTitle}
                    title={tc("edit")}
                  >
                    {article.title}
                    <Pencil className="ml-2 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-60" />
                  </button>
                </h1>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2.5 font-creative-body">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-black ${statusMeta?.className ?? "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-950/50 dark:text-gray-400 dark:border-gray-700"}`}
                >
                  {statusLabel}
                </span>

                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-black ${contentTypeMeta.className}`}
                >
                  {t(
                    contentTypeMeta.labelKey as
                      | "typeTechBlog"
                      | "typePaper"
                      | "typeNews"
                      | "typeGitHub"
                      | "typeDocs"
                      | "typeVideo"
                      | "typePatchNote"
                  )}
                </span>

                <time className="text-xs font-bold text-cm-text/55">{formattedDate}</time>

                {article.url ? (
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-black text-nod-gold underline decoration-dotted"
                  >
                    {t("original")}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-2 lg:items-end">
              <div className="flex items-center gap-2">
                {article.original_title && article.title !== article.original_title ? (
                  <button
                    type="button"
                    onClick={restoreOriginalTitle}
                    disabled={updateArticle.isPending}
                    className="inline-flex items-center gap-1.5 cm-doodle-border border-2 border-cm-text/20 bg-white dark:bg-cm-surface px-3 py-1.5 font-creative-body text-xs font-black text-cm-text transition-colors hover:bg-cm-bg dark:hover:bg-cm-surface-raised disabled:opacity-50"
                    title={tc("restoreOriginal")}
                  >
                    <RotateCcw className="h-3 w-3" />
                    {tc("restoreOriginal")}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  disabled={createShareLink.isPending}
                  className="inline-flex items-center gap-1.5 cm-doodle-border border-2 border-cm-text/20 bg-white dark:bg-cm-surface px-3 py-1.5 font-creative-body text-xs font-black text-cm-text transition-colors hover:bg-cm-bg dark:hover:bg-cm-surface-raised disabled:opacity-50"
                >
                  {t("shareActionLink")}
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center gap-1.5 cm-doodle-border border-2 border-red-200 dark:border-red-800 bg-white dark:bg-cm-surface px-3 py-1.5 font-creative-body text-xs font-black text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  {tc("delete")}
                </button>
              </div>
            </div>
          </div>
        </section>

        {(effectiveStatus === "pending" ||
          effectiveStatus === "processing" ||
          effectiveStatus === "analyzing") && <AnalysisProgress status={effectiveStatus} />}

        {article.summary ? (
          <div className="space-y-5">
            {article.summary.concepts.length > 0 ? (
              <section className="cm-doodle-border border-2 border-cm-text/18 bg-white/95 dark:bg-cm-surface/95 p-6">
                <h2 className="font-creative-display text-2xl font-black text-cm-text">
                  {t("concepts")}
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {article.summary.concepts.map((concept) => (
                    <span
                      key={concept}
                      className="rounded-full border border-nod-gold/30 bg-nod-gold/10 px-3 py-1 font-creative-body text-xs font-black text-nod-gold"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="cm-doodle-border border-2 border-cm-text/18 bg-white/95 dark:bg-cm-surface/95 p-6">
              <h2 className="font-creative-display text-2xl font-black text-cm-text">
                {t("summary")}
              </h2>
              <p className="mt-3 font-creative-body text-sm leading-relaxed text-cm-text/80">
                {article.summary.summary}
              </p>
              {article.summary.reading_time_minutes ? (
                <p className="mt-3 font-creative-body text-xs font-bold text-cm-text/55">
                  {t("readTime", { minutes: article.summary.reading_time_minutes })}
                  {article.summary.language ? ` · ${article.summary.language.toUpperCase()}` : null}
                </p>
              ) : null}
            </section>

            {article.summary.markdown_note ? (
              <section className="cm-doodle-border border-2 border-cm-text/18 bg-white/95 dark:bg-cm-surface/95 p-6">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-creative-display text-2xl font-black text-cm-text">
                    {t("markdownNote")}
                  </h2>
                  <button
                    type="button"
                    onClick={downloadMarkdown}
                    className="inline-flex items-center gap-1.5 cm-doodle-border border-2 border-cm-text/20 bg-white dark:bg-cm-surface px-3 py-1.5 font-creative-body text-xs font-black text-cm-text transition-colors hover:bg-cm-bg dark:hover:bg-cm-surface-raised"
                  >
                    {t("downloadMarkdown")}
                  </button>
                </div>
                <ArticleMarkdownNote markdownNote={article.summary.markdown_note} />
              </section>
            ) : null}

            {article.summary.key_points.length > 0 ? (
              <section className="cm-doodle-border border-2 border-cm-text/18 bg-white/95 dark:bg-cm-surface/95 p-6">
                <h2 className="font-creative-display text-2xl font-black text-cm-text">
                  {t("keyPoints")}
                </h2>
                <ul className="mt-3 list-disc space-y-1.5 pl-5">
                  {article.summary.key_points.map((point) => (
                    <li
                      key={point}
                      className="font-creative-body text-sm leading-relaxed text-cm-text/80"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {article.summary.type_metadata &&
            Object.keys(article.summary.type_metadata).length > 0 ? (
              <section className="cm-doodle-border border-2 border-cm-text/18 bg-white/95 dark:bg-cm-surface/95 p-6">
                <h2 className="font-creative-display text-2xl font-black text-cm-text">
                  {t(
                    (contentTypeMeta.labelKey || "typeNews") as
                      | "typeTechBlog"
                      | "typePaper"
                      | "typeNews"
                      | "typeGitHub"
                      | "typeDocs"
                      | "typeVideo"
                      | "typePatchNote"
                  )}{" "}
                  {t("details")}
                </h2>
                <div className="mt-3">
                  <TypeMetadataSection
                    contentType={contentType}
                    metadata={article.summary.type_metadata}
                  />
                </div>
              </section>
            ) : null}
          </div>
        ) : null}

        <DialogPrimitive.Root open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
          <AnimatePresence>
            {isShareModalOpen ? (
              <DialogPrimitive.Portal forceMount>
                <DialogPrimitive.Overlay asChild forceMount>
                  <motion.div
                    className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                </DialogPrimitive.Overlay>

                <DialogPrimitive.Content asChild forceMount>
                  <motion.div
                    className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border-2 border-cm-text/18 bg-white/98 p-6 shadow-2xl dark:bg-cm-surface"
                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.985 }}
                    transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.85 }}
                  >
                    <DialogPrimitive.Title asChild>
                      <h2 className="font-creative-display text-2xl font-black text-cm-text">
                        {shareLinkUrl ? t("shareAlreadySharedTitle") : t("shareModalTitle")}
                      </h2>
                    </DialogPrimitive.Title>

                    <DialogPrimitive.Description asChild>
                      <p className="mt-3 font-creative-body text-sm leading-relaxed text-cm-text/80">
                        {shareLinkUrl
                          ? t("shareAlreadySharedDescription")
                          : t("shareModalDescription")}
                      </p>
                    </DialogPrimitive.Description>

                    {!shareLinkUrl ? (
                      <>
                        <div className="mt-4 space-y-3 rounded-2xl border border-cm-text/15 bg-cm-bg/70 p-4">
                          <p className="font-creative-body text-xs font-black uppercase tracking-wide text-cm-text/60">
                            {t("shareUrlSettingsTitle")}
                          </p>

                          <div className="grid gap-2 sm:grid-cols-2">
                            <label className="inline-flex items-center gap-2 rounded-lg border border-cm-text/15 bg-white/80 px-3 py-2 text-xs font-bold text-cm-text dark:bg-cm-surface">
                              <input
                                type="radio"
                                name="share-url-mode"
                                value="default"
                                checked={shareUrlMode === "default"}
                                onChange={() => setShareUrlMode("default")}
                              />
                              {t("shareUseDefaultUrl")}
                            </label>

                            <label className="inline-flex items-center gap-2 rounded-lg border border-cm-text/15 bg-white/80 px-3 py-2 text-xs font-bold text-cm-text dark:bg-cm-surface">
                              <input
                                type="radio"
                                name="share-url-mode"
                                value="manual"
                                checked={shareUrlMode === "manual"}
                                onChange={() => setShareUrlMode("manual")}
                              />
                              {t("shareSetCustomUrl")}
                            </label>
                          </div>

                          {shareUrlMode === "manual" ? (
                            <div className="space-y-1">
                              <label
                                htmlFor="share-custom-url"
                                className="block text-xs font-bold text-cm-text/70"
                              >
                                {t("shareCustomUrlInputLabel")}
                              </label>
                              <input
                                id="share-custom-url"
                                type="text"
                                value={customShareUrl}
                                onChange={(e) => setCustomShareUrl(e.target.value)}
                                placeholder={t("shareCustomUrlPlaceholder")}
                                className="w-full rounded-lg border border-cm-text/20 bg-white px-3 py-2 text-xs font-semibold text-cm-text outline-none ring-nod-gold/30 placeholder:text-cm-text/40 focus:ring-2 dark:bg-cm-surface"
                              />
                            </div>
                          ) : null}
                        </div>

                        <div className="mt-4 space-y-3 rounded-2xl border border-cm-text/15 bg-cm-bg/70 p-4">
                          <p className="font-creative-body text-xs font-black uppercase tracking-wide text-cm-text/60">
                            {t("shareOgSettingsTitle")}
                          </p>

                          <div className="grid gap-2 sm:grid-cols-2">
                            <label className="inline-flex items-center gap-2 rounded-lg border border-cm-text/15 bg-white/80 px-3 py-2 text-xs font-bold text-cm-text dark:bg-cm-surface">
                              <input
                                type="radio"
                                name="share-og-mode"
                                value="default"
                                checked={shareThumbnailMode === "default"}
                                onChange={() => setShareThumbnailMode("default")}
                              />
                              {t("shareUseDefaultOgImage")}
                            </label>

                            <label className="inline-flex items-center gap-2 rounded-lg border border-cm-text/15 bg-white/80 px-3 py-2 text-xs font-bold text-cm-text dark:bg-cm-surface">
                              <input
                                type="radio"
                                name="share-og-mode"
                                value="manual"
                                checked={shareThumbnailMode === "manual"}
                                onChange={() => setShareThumbnailMode("manual")}
                              />
                              {t("shareSetCustomOgImage")}
                            </label>
                          </div>

                          {shareThumbnailMode === "manual" ? (
                            <div className="space-y-1">
                              <label
                                htmlFor="share-custom-og-image"
                                className="block text-xs font-bold text-cm-text/70"
                              >
                                {t("shareCustomOgImageInputLabel")}
                              </label>
                              <input
                                id="share-custom-og-image"
                                type="url"
                                value={customThumbnailUrl}
                                onChange={(e) => setCustomThumbnailUrl(e.target.value)}
                                placeholder={t("shareCustomOgImagePlaceholder")}
                                className="w-full rounded-lg border border-cm-text/20 bg-white px-3 py-2 text-xs font-semibold text-cm-text outline-none ring-nod-gold/30 placeholder:text-cm-text/40 focus:ring-2 dark:bg-cm-surface"
                              />
                            </div>
                          ) : null}
                        </div>

                        <div className="mt-4 rounded-2xl border border-cm-text/15 bg-cm-bg/70 p-4">
                          <p className="font-creative-body text-xs font-black uppercase tracking-wide text-cm-text/60">
                            {t("shareModalIncludedTitle")}
                          </p>
                          <ul className="mt-2 list-disc space-y-1.5 pl-4 font-creative-body text-sm text-cm-text/80">
                            <li>{t("shareModalIncludedSummary")}</li>
                            <li>{t("shareModalIncludedConcepts")}</li>
                            <li>{t("shareModalIncludedKeyPoints")}</li>
                          </ul>
                        </div>

                        <p className="mt-4 font-creative-body text-xs font-bold text-cm-text/60">
                          {t("shareModalHint")}
                        </p>
                      </>
                    ) : null}

                    {shareLinkUrl ? (
                      <div className="mt-4 rounded-2xl border border-cm-text/20 bg-cm-bg/85 p-3 dark:bg-cm-surface-raised/80">
                        <div className="flex items-start gap-2">
                          <code className="min-w-0 flex-1 break-all rounded-lg border border-cm-text/12 bg-white/90 px-2.5 py-2 font-mono text-xs font-semibold leading-relaxed text-cm-text/85 dark:bg-cm-surface dark:text-cm-text/75">
                            {shareLinkUrl}
                          </code>

                          <button
                            type="button"
                            aria-label={t("shareCopyLink")}
                            onClick={() => {
                              void handleCopyShareLink();
                            }}
                            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                              copied
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300"
                                : "border-cm-text/20 bg-white text-cm-text/80 hover:bg-cm-bg dark:border-cm-text/25 dark:bg-cm-surface dark:text-cm-text/70"
                            }`}
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-6 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsShareModalOpen(false)}
                        className="inline-flex items-center gap-1.5 cm-doodle-border border-2 border-cm-text/20 bg-white px-3 py-1.5 font-creative-body text-xs font-black text-cm-text transition-colors hover:bg-cm-bg dark:bg-cm-surface dark:hover:bg-cm-surface-raised"
                      >
                        {shareLinkUrl ? tc("ok") : tc("cancel")}
                      </button>

                      {!shareLinkUrl ? (
                        <button
                          type="button"
                          onClick={() => {
                            void handleShareGenerate();
                          }}
                          disabled={createShareLink.isPending}
                          className="inline-flex items-center gap-1.5 cm-doodle-border border-2 border-nod-gold/35 bg-nod-gold/15 px-3 py-1.5 font-creative-body text-xs font-black text-cm-text transition-colors hover:bg-nod-gold/25 disabled:opacity-50"
                        >
                          {t("shareGenerateLink")}
                        </button>
                      ) : null}
                    </div>
                  </motion.div>
                </DialogPrimitive.Content>
              </DialogPrimitive.Portal>
            ) : null}
          </AnimatePresence>
        </DialogPrimitive.Root>
      </div>
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
    <div className="cm-doodle-border border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:border-blue-800 dark:from-blue-950/30 dark:to-indigo-950/30 p-6">
      <div className="mb-5 flex items-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        <p className="font-creative-body text-sm font-black text-blue-900 dark:text-blue-300">
          {status === "pending" ? t("pendingAnalysis") : t("analyzingArticle")}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isDone = i < activeIndex;
          const isActive = i === activeIndex;

          return (
            <div key={step.key} className="flex flex-1 items-center gap-3">
              <div className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-500 ${
                    isDone
                      ? "bg-blue-600 text-white"
                      : isActive
                        ? "bg-blue-100 text-blue-700 ring-2 ring-blue-400 ring-offset-2 animate-pulse dark:bg-blue-950/50 dark:text-blue-300 dark:ring-blue-500 dark:ring-offset-cm-bg"
                        : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={`text-center font-creative-body text-xs font-bold ${
                    isDone
                      ? "text-blue-700 dark:text-blue-400"
                      : isActive
                        ? "text-blue-900 dark:text-blue-300"
                        : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 ? (
                <div
                  className={`-mt-5 h-0.5 w-6 shrink-0 rounded-full transition-colors duration-500 ${
                    isDone ? "bg-blue-400 dark:bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <p className="mt-5 font-creative-body text-xs font-bold text-blue-700/70 dark:text-blue-400/70">
        {t("analysisDescription")}
      </p>
    </div>
  );
}
