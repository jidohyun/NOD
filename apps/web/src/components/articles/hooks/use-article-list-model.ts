"use client";

import type { KeyboardEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { AnalyticsEvents } from "@/lib/analytics";
import { useInfiniteArticles, useRetryArticle, useSemanticSearch } from "@/lib/api/articles";

type ViewMode = "grid" | "list";

export function useArticleListModel() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [contentTypeFilter, setContentTypeFilter] = useState<string>("");
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
    content_type: contentTypeFilter || undefined,
  });

  const retryMutation = useRetryArticle();

  const handleRefresh = (_id: string) => {
    infiniteQuery.refetch();
  };

  const handleRetry = (id: string) => {
    retryMutation.mutate(id);
  };

  const semanticQuery = useSemanticSearch({
    q: debouncedSearch,
    limit: 20,
    status: statusFilter || undefined,
    content_type: contentTypeFilter || undefined,
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

  function onFocus() {
    setIsFocused(true);
  }

  function onBlur() {
    // Allow suggestion click to register before closing.
    window.setTimeout(() => {
      setIsFocused(false);
      setActiveSuggestionIndex(-1);
    }, 0);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions) {
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIndex((current) => Math.min(current + 1, suggestions.length - 1));
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
  }

  return {
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
    isFocused,
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
    onRefresh: handleRefresh,
    onRetry: handleRetry,
    isRetrying: retryMutation.isPending,
  };
}
