"use client";

import { LayoutGrid, List } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArticleCard } from "@/components/articles/article-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInfiniteArticles } from "@/lib/api/articles";

type ViewMode = "grid" | "list";

export function ArticleList() {
  const t = useTranslations("dashboard");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const { data, fetchNextPage, hasNextPage, isLoading, isError } = useInfiniteArticles({
    limit: 20,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const articles = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchArticles")}
          className="flex-1"
        />
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

      {hasNextPage ? (
        <div className="flex justify-center pt-4">
          <Button onClick={() => fetchNextPage()} variant="outline">
            {t("loadMore")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
