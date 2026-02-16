"use client";

import { LayoutGrid, List, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ArticleCard } from "@/components/articles/article-card";
import { useArticleListModel } from "@/components/articles/hooks/use-article-list-model";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getChromeExtensionInstallUrl } from "@/lib/chrome-extension";

export function ArticleList() {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const {
    search,
    setSearch,
    isSemanticMode,
    statusFilter,
    setStatusFilter,
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
    onRefresh,
    onRetry,
    isRetrying,
  } = useArticleListModel();

  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;
  const extensionInstallUrl = getChromeExtensionInstallUrl(locale);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchArticles")}
            className={isSemanticMode ? "pr-32" : ""}
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
            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              <Sparkles className="h-3 w-3" />
              {t("semanticSearch")}
            </span>
          ) : null}

          {showSuggestions ? (
            <div
              id={listboxId}
              role="listbox"
              className="absolute z-20 mt-2 w-full overflow-hidden rounded-md border border-input bg-background shadow-md"
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
                        ? "flex w-full flex-col gap-0.5 px-3 py-2 text-left bg-accent"
                        : "flex w-full flex-col gap-0.5 px-3 py-2 text-left hover:bg-accent"
                    }
                  >
                    <span className="text-sm font-medium text-foreground line-clamp-1">
                      {item.title}
                    </span>
                    {item.summary_preview ? (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {item.summary_preview}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        <label htmlFor="status-filter" className="sr-only">
          Status
        </label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">{t("allStatus")}</option>
          <option value="pending">{t("statusPending")}</option>
          <option value="processing">{t("statusProcessing")}</option>
          <option value="analyzing">{t("statusAnalyzing")}</option>
          <option value="analyzed">{t("statusCompleted")}</option>
          <option value="failed">{t("statusFailed")}</option>
        </select>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            data-testid="view-toggle-grid"
            aria-pressed={viewMode === "grid"}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            data-testid="view-toggle-list"
            aria-pressed={viewMode === "list"}
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {search.length === 1 ? (
        <div className="py-2 text-center text-xs text-muted-foreground">{t("searchMinChars")}</div>
      ) : null}

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">{t("loadingArticles")}</div>
      ) : null}
      {isError ? <div className="py-12 text-center text-destructive">{t("loadError")}</div> : null}
      {!isLoading && !isError && articles.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">{t("noArticles")}</p>
          <Button asChild className="mt-4">
            <a href={extensionInstallUrl} target="_blank" rel="noopener noreferrer">
              {t("installExtensionCta")}
            </a>
          </Button>
        </div>
      ) : null}

      <div
        className={
          viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"
        }
      >
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            onRefresh={onRefresh}
            onRetry={onRetry}
            isRefreshing={isRetrying}
          />
        ))}
      </div>

      {!usesSemantic && infiniteQuery.hasNextPage ? (
        <div className="flex justify-center pt-4">
          <Button onClick={() => infiniteQuery.fetchNextPage()} variant="outline">
            {t("loadMore")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
