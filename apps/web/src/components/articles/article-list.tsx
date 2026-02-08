"use client";

import { LayoutGrid, List, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { ArticleCard } from "@/components/articles/article-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { AnalyticsEvents } from "@/lib/analytics";
import { useInfiniteArticles, useSemanticSearch } from "@/lib/api/articles";

type ViewMode = "grid" | "list";

export function ArticleList() {
  const t = useTranslations("dashboard");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const listboxId = useId();
  const [isFocused, setIsFocused] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const debouncedSearch = useDebounce(search, 500);
  const isSemanticMode = debouncedSearch.length >= 2;

  const infiniteQuery = useInfiniteArticles({
    limit: 20,
    search: !isSemanticMode && debouncedSearch ? debouncedSearch : undefined,
    status: statusFilter || undefined,
  });

  const semanticQuery = useSemanticSearch({
    q: debouncedSearch,
    limit: 20,
    status: statusFilter || undefined,
    enabled: isSemanticMode,
  });

  const usesSemantic = isSemanticMode && !semanticQuery.isError;
  const activeQuery = usesSemantic ? semanticQuery : infiniteQuery;

  const lastTrackedQuery = useRef("");
  useEffect(() => {
    if (usesSemantic && debouncedSearch && debouncedSearch !== lastTrackedQuery.current) {
      lastTrackedQuery.current = debouncedSearch;
      AnalyticsEvents.semanticSearch(debouncedSearch);
    }
  }, [usesSemantic, debouncedSearch]);

  const articles = usesSemantic
    ? (semanticQuery.data?.data ?? [])
    : (infiniteQuery.data?.pages.flatMap((page) => page.data) ?? []);

  const suggestions = usesSemantic ? (semanticQuery.data?.data ?? []).slice(0, 5) : [];
  const showSuggestions = isFocused && suggestions.length > 0;

  function selectSuggestionTitle(title: string) {
    setSearch(title);
    setActiveSuggestionIndex(-1);
  }

  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;

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
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              // Allow suggestion click to register before closing.
              window.setTimeout(() => {
                setIsFocused(false);
                setActiveSuggestionIndex(-1);
              }, 0);
            }}
            onKeyDown={(e) => {
              if (!showSuggestions) {
                return;
              }

              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveSuggestionIndex((current) =>
                  Math.min(current + 1, suggestions.length - 1)
                );
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveSuggestionIndex((current) => Math.max(current - 1, 0));
              }
              if (e.key === "Enter") {
                if (activeSuggestionIndex >= 0) {
                  e.preventDefault();
                  const item = suggestions[activeSuggestionIndex];
                  if (item) {
                    selectSuggestionTitle(item.title);
                  }
                }
              }
              if (e.key === "Escape") {
                setIsFocused(false);
                setActiveSuggestionIndex(-1);
              }
            }}
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
          <option value="analyzing">{t("statusAnalyzing")}</option>
          <option value="completed">{t("statusCompleted")}</option>
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
        <div className="py-12 text-center text-muted-foreground">{t("noArticles")}</div>
      ) : null}

      <div
        className={
          viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"
        }
      >
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
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
