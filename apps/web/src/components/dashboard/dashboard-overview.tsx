"use client";

import { ArrowRight, Brain, CreditCard, FileText } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useArticles } from "@/lib/api/articles";
import { useUsage } from "@/lib/api/subscriptions";
import { getChromeExtensionInstallUrl } from "@/lib/chrome-extension";
import { Link } from "@/lib/i18n/routing";

export function DashboardOverview() {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const ts = useTranslations("subscription");
  const { data: usage, isLoading: usageLoading } = useUsage();
  const { data: articlesData, isLoading: articlesLoading } = useArticles({ page: 1, limit: 5 });

  const totalArticles = articlesData?.meta?.total ?? 0;
  const recentArticles = articlesData?.data ?? [];
  const plan = usage?.plan ?? "basic";
  const summariesUsed = usage?.summaries_used ?? 0;
  const summariesLimit = usage?.summaries_limit ?? 0;
  const articleUsageLabel =
    !usageLoading && !articlesLoading && usage
      ? `${totalArticles}/${usage.articles_limit === -1 ? "∞" : usage.articles_limit}`
      : usageLoading || articlesLoading
        ? "—"
        : totalArticles.toLocaleString();
  const planLabel = usageLoading ? "—" : plan === "pro" ? ts("pro") : ts("basic");
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
              <p className="text-2xl font-bold">{articleUsageLabel}</p>
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
              <p className="text-2xl font-bold">
                {usageLoading
                  ? "—"
                  : `${summariesUsed}/${summariesLimit === -1 ? "∞" : summariesLimit}`}
              </p>
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
              <p className="text-2xl font-bold capitalize">{planLabel}</p>
            </div>
          </div>
        </div>
      </div>

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
              <div key={i} className="animate-pulse rounded-xl border bg-card p-5">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="mt-3 h-3 w-full rounded bg-muted" />
                <div className="mt-2 h-3 w-2/3 rounded bg-muted" />
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
