"use client";

import { ArrowRight, BarChart3, Brain, CreditCard, FileText } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { useArticles, useContentTypeStats } from "@/lib/api/articles";
import { useUsage } from "@/lib/api/subscriptions";
import { getChromeExtensionInstallUrl } from "@/lib/chrome-extension";
import { Link } from "@/lib/i18n/routing";

const CONTENT_TYPE_LABEL_KEYS: Record<string, string> = {
  tech_blog: "typeTechBlog",
  academic_paper: "typePaper",
  general_news: "typeNews",
  github_repo: "typeGitHub",
  official_docs: "typeDocs",
  video_podcast: "typeVideo",
};

export function DashboardOverview() {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const ts = useTranslations("subscription");
  const { data: usage, isLoading: usageLoading } = useUsage();
  const { data: articlesData, isLoading: articlesLoading } = useArticles({ page: 1, limit: 5 });

  const { data: contentTypeStats } = useContentTypeStats();
  const totalArticles = articlesData?.meta?.total ?? 0;
  const recentArticles = articlesData?.data ?? [];
  const plan = usage?.plan ?? "basic";
  const summariesUsed = usage?.summaries_used ?? 0;
  const summariesLimit = usage?.summaries_limit ?? 0;
  const extensionInstallUrl = getChromeExtensionInstallUrl(locale);

  const dateLocale = locale === "ko" ? "ko-KR" : locale === "ja" ? "ja-JP" : "en-US";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("overview.title")}</h1>
        <p className="text-muted-foreground">{t("overview.description")}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Articles */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("overview.savedArticles")}</p>
              <div className="text-2xl font-bold">
                {articlesLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  totalArticles.toLocaleString()
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Summaries Used */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("overview.aiSummaries")}</p>
              <div className="text-2xl font-bold">
                {usageLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  `${summariesUsed}/${summariesLimit === -1 ? "∞" : summariesLimit}`
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Current Plan */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("overview.currentPlan")}</p>
              <div className="text-2xl font-bold capitalize">
                {usageLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : plan === "pro" ? (
                  ts("pro")
                ) : (
                  ts("basic")
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Type Distribution */}
      {contentTypeStats && contentTypeStats.total > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t("overview.contentTypes")}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(contentTypeStats.counts)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => {
                const percentage = Math.round((count / contentTypeStats.total) * 100);
                return (
                  <div key={type} className="rounded-lg border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {t(
                          (CONTENT_TYPE_LABEL_KEYS[type] || "typeNews") as
                            | "typeTechBlog"
                            | "typePaper"
                            | "typeNews"
                            | "typeGitHub"
                            | "typeDocs"
                            | "typeVideo"
                        )}
                      </span>
                      <span className="text-sm text-muted-foreground">{count}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{percentage}%</p>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/articles"
          className="group flex items-center justify-between rounded-xl border bg-card p-6 transition-colors hover:bg-accent/50"
        >
          <div>
            <h3 className="font-semibold">{t("overview.viewArticlesTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("overview.viewArticlesDescription")}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>

        <Link
          href="/settings/billing"
          className="group flex items-center justify-between rounded-xl border bg-card p-6 transition-colors hover:bg-accent/50"
        >
          <div>
            <h3 className="font-semibold">{t("overview.manageBillingTitle")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("overview.manageBillingDescription")}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>

        <a
          href={extensionInstallUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center justify-between rounded-xl border bg-card p-6 transition-colors hover:bg-accent/50"
        >
          <div>
            <h3 className="font-semibold">{t("overview.installExtensionTitle")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("overview.installExtensionDescription")}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </a>
      </div>

      {/* Recent Articles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{t("overview.recentArticlesTitle")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("overview.recentArticlesDescription")}
            </p>
          </div>
          {recentArticles.length > 0 ? (
            <Link href="/articles" className="text-sm font-medium text-primary hover:underline">
              {t("overview.viewAll")}
            </Link>
          ) : null}
        </div>

        {articlesLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
          </div>
        ) : recentArticles.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentArticles.slice(0, 6).map((article) => (
              <Link
                key={article.id}
                href={`/articles/${article.id}`}
                className="group rounded-xl border bg-card p-5 transition-colors hover:bg-accent/50"
              >
                <h3 className="font-medium line-clamp-2 group-hover:text-primary">
                  {article.title}
                </h3>
                {article.summary_preview ? (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {article.summary_preview}
                  </p>
                ) : null}
                <div className="mt-3 flex items-center gap-2">
                  <time className="text-xs text-muted-foreground">
                    {new Date(article.created_at).toLocaleDateString(dateLocale, {
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${
                      article.status === "analyzed" || article.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : article.status === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {t(
                      article.status === "analyzed" || article.status === "completed"
                        ? "statusCompleted"
                        : article.status === "failed"
                          ? "statusFailed"
                          : "statusPending"
                    )}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-card/50 p-8 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">{t("overview.noRecentArticles")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
