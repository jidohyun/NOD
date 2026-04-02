"use client";

import { Funnel, LayoutGrid, List, Search, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import { ArticleCard } from "@/components/articles/article-card";
import { useArticleListModel } from "@/components/articles/hooks/use-article-list-model";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getChromeExtensionInstallUrl } from "@/lib/chrome-extension";

const SKELETON_KEYS = Array.from({ length: 6 }, (_, i) => `skeleton-${i}`);

const ARTICLES_BG_STYLE: CSSProperties = {
  backgroundImage:
    "radial-gradient(rgba(232, 185, 49, 0.45) 1.1px, transparent 1.1px), radial-gradient(rgba(74, 74, 74, 0.2) 1px, transparent 1px)",
  backgroundSize: "22px 22px",
  backgroundPosition: "0 0, 11px 11px",
};

export function ArticleList() {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const {
    search,
    setSearch,
    isSemanticMode,
    statusFilter,
    setStatusFilter,
    contentTypeFilter,
    setContentTypeFilter,
    viewMode,
    setViewMode,
    listboxId,
    showSuggestions,
    suggestions,
    activeSuggestionIndex,
    setActiveSuggestionIndex,
    selectSuggestionTitle,
    onFocus,
    onBlur,
    onKeyDown,
    usesSemantic,
    activeQuery,
    articles,
    infiniteQuery,
    onRetry,
    isRetrying,
  } = useArticleListModel();

  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;
  const extensionInstallUrl = getChromeExtensionInstallUrl(locale);
  return (
    <div className="relative overflow-hidden rounded-[2rem] border-2 border-cm-text/10 bg-cm-bg p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 opacity-65" style={ARTICLES_BG_STYLE} />

      <div className="relative space-y-7">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-creative-display text-[clamp(2rem,3.1vw,3.3rem)] font-black text-cm-text">
              {t("myArticles")}
            </h1>
            <div className="mt-3 h-1.5 w-32 -rotate-1 rounded-full bg-nod-gold/45" />
            <p className="mt-4 font-creative-body text-base italic text-cm-text/65">
              {t("articleListSubtitle")}
            </p>
          </div>

          <a
            href={extensionInstallUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 cm-doodle-border border-cm-text bg-nod-gold px-5 py-2 font-creative-body text-sm font-black text-white transition-all hover:bg-white hover:text-nod-gold"
          >
            <Sparkles className="h-4 w-4" />
            {t("installExtensionCta")}
          </a>
        </header>

        <section className="cm-doodle-border border-2 border-cm-text/15 bg-white/95 dark:bg-cm-surface/95 p-4 lg:p-5">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_190px_190px_auto] xl:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cm-text/40" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("searchArticles")}
                className={`h-11 border-2 border-cm-text/20 bg-white dark:bg-cm-surface pl-9 pr-32 font-creative-body text-sm text-cm-text placeholder:text-cm-text/40 focus-visible:ring-0 ${
                  isSemanticMode ? "" : ""
                }`}
                onFocus={onFocus}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                role="combobox"
                aria-controls={listboxId}
                aria-expanded={showSuggestions}
                aria-autocomplete="list"
                aria-activedescendant={
                  activeSuggestionIndex >= 0
                    ? `${listboxId}-option-${activeSuggestionIndex}`
                    : undefined
                }
              />

              {isSemanticMode ? (
                <span className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-full border border-nod-gold/25 bg-nod-gold/15 px-2 py-0.5 font-creative-body text-xs font-black text-nod-gold">
                  <Sparkles className="h-3 w-3" />
                  {t("semanticSearch")}
                </span>
              ) : null}

              {showSuggestions ? (
                <div
                  id={listboxId}
                  role="listbox"
                  className="absolute z-20 mt-2 w-full overflow-hidden cm-doodle-border border-2 border-cm-text/20 bg-white dark:bg-cm-surface shadow-lg"
                >
                  {suggestions.map((item, index) => {
                    const isActive = index === activeSuggestionIndex;
                    return (
                      <button
                        key={item.id}
                        id={`${listboxId}-option-${index}`}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectSuggestionTitle(item.title);
                        }}
                        onMouseEnter={() => setActiveSuggestionIndex(index)}
                        className={
                          isActive
                            ? "flex w-full flex-col gap-0.5 bg-cm-bg px-3 py-2 text-left"
                            : "flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-cm-bg"
                        }
                      >
                        <span className="line-clamp-1 font-creative-body text-sm font-black text-cm-text">
                          {item.title}
                        </span>
                        {item.summary_preview ? (
                          <span className="line-clamp-1 font-creative-body text-xs text-cm-text/55">
                            {item.summary_preview}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="relative">
              <label htmlFor="status-filter" className="sr-only">
                Status
              </label>
              <Funnel className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cm-text/35" />
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 w-full rounded-md border-2 border-cm-text/20 bg-white dark:bg-cm-surface pl-9 pr-3 font-creative-body text-sm font-bold text-cm-text outline-none"
              >
                <option value="">{t("allStatus")}</option>
                <option value="pending">{t("statusPending")}</option>
                <option value="processing">{t("statusProcessing")}</option>
                <option value="analyzing">{t("statusAnalyzing")}</option>
                <option value="analyzed">{t("statusCompleted")}</option>
                <option value="failed">{t("statusFailed")}</option>
              </select>
            </div>

            <div className="relative">
              <label htmlFor="content-type-filter" className="sr-only">
                Content Type
              </label>
              <Funnel className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cm-text/35" />
              <select
                id="content-type-filter"
                value={contentTypeFilter}
                onChange={(e) => setContentTypeFilter(e.target.value)}
                className="h-11 w-full rounded-md border-2 border-cm-text/20 bg-white dark:bg-cm-surface pl-9 pr-3 font-creative-body text-sm font-bold text-cm-text outline-none"
              >
                <option value="">{t("allContentTypes")}</option>
                <option value="tech_blog">{t("typeTechBlog")}</option>
                <option value="academic_paper">{t("typePaper")}</option>
                <option value="general_news">{t("typeNews")}</option>
                <option value="discussion">{t("typeDiscussion")}</option>
                <option value="github_repo">{t("typeGitHub")}</option>
                <option value="official_docs">{t("typeDocs")}</option>
                <option value="video_podcast">{t("typeVideo")}</option>
                <option value="patch_note">{t("typePatchNote")}</option>
              </select>
            </div>

            <div className="inline-flex h-11 items-center gap-1 cm-doodle-border border-2 border-cm-text/20 bg-white dark:bg-cm-surface p-1">
              <button
                type="button"
                data-testid="view-toggle-grid"
                aria-pressed={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-nod-gold text-white"
                    : "text-cm-text/45 hover:bg-cm-bg hover:text-cm-text"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>

              <button
                type="button"
                data-testid="view-toggle-list"
                aria-pressed={viewMode === "list"}
                onClick={() => setViewMode("list")}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-nod-gold text-white"
                    : "text-cm-text/45 hover:bg-cm-bg hover:text-cm-text"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {search.length === 1 ? (
            <div className="pt-3 text-center font-creative-body text-xs font-bold text-cm-text/45">
              {t("searchMinChars")}
            </div>
          ) : null}
        </section>

        {isLoading ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3"
                : "space-y-4"
            }
          >
            <output className="sr-only" aria-live="polite">
              {t("loadingArticles")}
            </output>
            {SKELETON_KEYS.slice(0, viewMode === "grid" ? 6 : 4).map((key) => (
              <div key={key} className="cm-doodle-border bg-white/95 dark:bg-cm-surface/95 p-5">
                <Skeleton className="h-6 w-3/4 bg-cm-text/10" />
                <div className="mt-3 flex gap-2">
                  <Skeleton className="h-5 w-20 rounded-full bg-cm-text/10" />
                  <Skeleton className="h-5 w-20 rounded-full bg-cm-text/10" />
                </div>
                <Skeleton className="mt-4 h-3 w-full bg-cm-text/10" />
                <Skeleton className="mt-2 h-3 w-2/3 bg-cm-text/10" />
                <Skeleton className="mt-6 h-3 w-24 bg-cm-text/10" />
              </div>
            ))}
          </div>
        ) : null}

        {isError ? (
          <div className="cm-doodle-border border-2 border-red-200 bg-red-50/70 dark:bg-red-950/30 py-12 text-center font-creative-body font-black text-red-500">
            {t("loadError")}
          </div>
        ) : null}

        {!isLoading && !isError && articles.length === 0 ? (
          <div className="cm-doodle-border border-2 border-cm-text/15 bg-white/95 dark:bg-cm-surface/95 py-14 text-center">
            <p className="font-creative-body text-base font-bold text-cm-text/65">
              {t("noArticles")}
            </p>
            <Button
              asChild
              className="mt-5 cm-doodle-border border-cm-text bg-nod-gold font-creative-body text-sm font-black text-white transition-all hover:bg-white hover:text-nod-gold"
            >
              <a href={extensionInstallUrl} target="_blank" rel="noopener noreferrer">
                {t("installExtensionCta")}
              </a>
            </Button>
          </div>
        ) : null}

        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3"
              : "space-y-4"
          }
        >
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              onRetry={onRetry}
              isRefreshing={isRetrying}
            />
          ))}
        </div>

        {!usesSemantic && infiniteQuery.hasNextPage ? (
          <div className="flex justify-center pt-2">
            <Button
              onClick={() => infiniteQuery.fetchNextPage()}
              variant="outline"
              className="cm-doodle-border border-cm-text/20 bg-white dark:bg-cm-surface font-creative-body text-sm font-black text-cm-text hover:bg-cm-bg"
            >
              {t("loadMore")}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
