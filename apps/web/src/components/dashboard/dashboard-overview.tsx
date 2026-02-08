"use client";

import { ArrowRight, Brain, CreditCard, FileText } from "lucide-react";
import { useTranslations } from "next-intl";
import { useArticles } from "@/lib/api/articles";
import { useUsage } from "@/lib/api/subscriptions";
import { Link } from "@/lib/i18n/routing";

export function DashboardOverview() {
  const t = useTranslations("dashboard");
  const ts = useTranslations("subscription");
  const { data: usage, isLoading: usageLoading } = useUsage();
  const { data: articlesData, isLoading: articlesLoading } = useArticles({ page: 1, limit: 1 });

  const totalArticles = articlesData?.meta?.total ?? 0;
  const plan = usage?.plan ?? "basic";
  const summariesUsed = usage?.summaries_used ?? 0;
  const summariesLimit = usage?.summaries_limit ?? 0;
  const planLabel = usageLoading ? "—" : plan === "pro" ? ts("pro") : ts("basic");

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
              <p className="text-2xl font-bold">
                {articlesLoading ? "—" : totalArticles.toLocaleString()}
              </p>
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
      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>
    </div>
  );
}
