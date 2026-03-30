"use client";

import {
  ArrowUpRight,
  BarChart3,
  Brain,
  CircleHelp,
  CirclePlus,
  Clock3,
  CreditCard,
  Download,
  Eye,
  FileText,
  MoreHorizontal,
  Sparkles,
  TriangleAlert,
  X,
  Zap,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type CSSProperties, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useArticles } from "@/lib/api/articles";
import { useUsage } from "@/lib/api/subscriptions";
import { getSupabase } from "@/lib/auth/auth-client";
import { getChromeExtensionInstallUrl } from "@/lib/chrome-extension";
import { Link } from "@/lib/i18n/routing";

const CONTENT_TYPE_LABEL_KEYS: Record<string, string> = {
  tech_blog: "typeTechBlog",
  academic_paper: "typePaper",
  general_news: "typeNews",
  github_repo: "typeGitHub",
  official_docs: "typeDocs",
  video_podcast: "typeVideo",
  patch_note: "typePatchNote",
};

const CANVAS_BG_STYLE: CSSProperties = {
  backgroundImage:
    "radial-gradient(rgba(232, 185, 49, 0.5) 1.35px, transparent 1.35px), radial-gradient(rgba(74, 74, 74, 0.28) 1.15px, transparent 1.15px)",
  backgroundSize: "24px 24px",
  backgroundPosition: "0 0, 12px 12px",
};

type DashboardStatusKey = "statusCompleted" | "statusFailed" | "statusPending" | "statusProcessing";

function getStatusMeta(status: string): { key: DashboardStatusKey; className: string } {
  if (status === "analyzed" || status === "completed") {
    return {
      key: "statusCompleted",
      className:
        "bg-emerald-100 border-emerald-500 text-emerald-700 dark:bg-emerald-950/50 dark:border-emerald-700 dark:text-emerald-400",
    };
  }

  if (status === "failed") {
    return {
      key: "statusFailed",
      className:
        "bg-red-100 border-red-500 text-red-700 dark:bg-red-950/50 dark:border-red-700 dark:text-red-400",
    };
  }

  if (status === "processing" || status === "analyzing") {
    return {
      key: "statusProcessing",
      className:
        "bg-amber-100 border-amber-500 text-amber-700 dark:bg-amber-950/50 dark:border-amber-700 dark:text-amber-400",
    };
  }

  return {
    key: "statusPending",
    className:
      "bg-yellow-100 border-yellow-500 text-yellow-700 dark:bg-yellow-950/50 dark:border-yellow-700 dark:text-yellow-400",
  };
}

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
  const extensionInstallUrl = getChromeExtensionInstallUrl(locale);

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

  const dateLocale = DATE_LOCALE_MAP[locale] ?? "en-US";
  const relativeTimeFormatter = new Intl.RelativeTimeFormat(dateLocale, { numeric: "auto" });
  const usagePercent =
    summariesLimit > 0 ? Math.min(100, Math.round((summariesUsed / summariesLimit) * 100)) : null;

  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);
  const [dismissOnboardingBanner, setDismissOnboardingBanner] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && !user.user_metadata?.onboarding_completed) {
        setShowOnboardingBanner(true);
      }
    });
  }, []);

  const formatRelativeTime = (dateValue: string) => {
    const date = new Date(dateValue);
    const diffMs = Date.now() - date.getTime();
    const hour = 1000 * 60 * 60;
    const day = hour * 24;

    if (Number.isNaN(diffMs)) return "";

    if (diffMs < hour) {
      return t("overview.justNow");
    }

    if (diffMs < day) {
      const hours = Math.max(1, Math.floor(diffMs / hour));
      return relativeTimeFormatter.format(-hours, "hour");
    }

    const days = Math.floor(diffMs / day);
    if (days <= 7) {
      return relativeTimeFormatter.format(-days, "day");
    }

    return date.toLocaleDateString(dateLocale, {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="relative space-y-8 pb-28">
      <div className="relative overflow-hidden rounded-[2rem] border-2 border-cm-text/10 bg-cm-bg p-6 lg:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-65" style={CANVAS_BG_STYLE} />

        <div className="relative space-y-10">
          <header className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,330px)] lg:items-end">
            <div className="max-w-3xl">
              <p className="inline-flex items-center rounded-full border border-cm-text/15 bg-white/75 px-3 py-1 font-creative-body text-sm font-semibold text-cm-text-light dark:bg-cm-surface/75 dark:border-cm-text/15">
                {t("overview.welcomeMessage")}
              </p>
              <h1 className="mt-4 font-creative-display text-[clamp(2.35rem,4.7vw,4rem)] font-black leading-[0.95] tracking-tight text-cm-text">
                {t("overview.heroTitlePrimary")}{" "}
                <span className="text-nod-gold underline decoration-wavy decoration-cm-mint/80 underline-offset-8">
                  {t("overview.heroTitleAccent")}
                </span>
              </h1>
              <p className="mt-3 font-creative-body text-[clamp(1rem,3vw,1.55rem)] italic text-cm-text/68">
                {t("overview.heroSubtitle")}
              </p>
            </div>

            <div className="space-y-3 lg:justify-self-end">
              <div className="cm-doodle-border border-2 border-cm-text/15 bg-white/92 p-4 dark:bg-cm-surface/92">
                <p className="font-creative-body text-[11px] font-black uppercase tracking-[0.14em] text-cm-text/45">
                  {t("overview.workflowTitle")}
                </p>
                <ul className="mt-3 space-y-1.5">
                  <li className="flex items-center gap-2 font-creative-body text-xs font-bold text-cm-text/65">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cm-bg text-[11px] text-cm-text">
                      1
                    </span>
                    {t("overview.workflowStepCapture")}
                  </li>
                  <li className="flex items-center gap-2 font-creative-body text-xs font-bold text-cm-text/65">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cm-bg text-[11px] text-cm-text">
                      2
                    </span>
                    {t("overview.workflowStepAnalyze")}
                  </li>
                  <li className="flex items-center gap-2 font-creative-body text-xs font-bold text-cm-text/65">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cm-bg text-[11px] text-cm-text">
                      3
                    </span>
                    {t("overview.workflowStepRefine")}
                  </li>
                </ul>
              </div>

              <Link
                href="/articles"
                className="inline-flex w-full items-center justify-center gap-2 cm-doodle-border border-2 border-cm-text bg-nod-gold px-7 py-3 font-creative-display text-base font-black text-white transition-all hover:-translate-y-0.5 hover:cm-sketch-shadow"
              >
                <CirclePlus className="h-5 w-5" />
                {t("overview.viewArticlesTitle")}
              </Link>
            </div>
          </header>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-nod-gold" />
              <h2 className="font-creative-display text-2xl font-black text-cm-text">
                {t("overview.keyMetrics")}
              </h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <article className="cm-doodle-border cm-sketch-shadow bg-white p-5 rotate-[-1deg] transition-all hover:-translate-y-1 dark:bg-cm-surface">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-creative-body font-black uppercase tracking-widest text-cm-text/45">
                      {t("overview.savedArticles")}
                    </p>
                    <h3 className="mt-1 font-creative-display text-3xl font-black text-cm-text">
                      {articlesLoading ? (
                        <Skeleton className="h-12 w-24" />
                      ) : (
                        totalArticles.toLocaleString()
                      )}
                    </h3>
                  </div>
                  <FileText className="h-10 w-10 text-nod-gold/35" />
                </div>
                <p className="mt-3 font-creative-body text-xs font-bold text-cm-text/45">
                  {t("overview.storageUnlimited")}
                </p>
              </article>

              <article className="cm-doodle-border cm-sketch-shadow bg-white p-5 rotate-[0.8deg] transition-all hover:-translate-y-1 dark:bg-cm-surface">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-creative-body font-black uppercase tracking-widest text-cm-text/45">
                      {t("overview.aiSummaries")}
                    </p>
                    <h3 className="mt-1 font-creative-display text-3xl font-black text-cm-text">
                      {usageLoading ? (
                        <Skeleton className="h-12 w-24" />
                      ) : usagePercent !== null ? (
                        `${usagePercent}%`
                      ) : (
                        `${summariesUsed}`
                      )}
                    </h3>
                  </div>
                  <Brain className="h-10 w-10 text-cm-mint" />
                </div>
                <p className="mt-3 text-sm font-creative-body font-bold italic text-[#76916f]">
                  {usageLoading
                    ? t("overview.usageCalculating")
                    : ts("summariesUsed", {
                        used: summariesUsed,
                        limit: summariesLimit === -1 ? "∞" : summariesLimit,
                      })}
                </p>
              </article>

              <article className="cm-doodle-border cm-sketch-shadow bg-white p-5 rotate-[-0.8deg] transition-all hover:-translate-y-1 dark:bg-cm-surface">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-creative-body font-black uppercase tracking-widest text-cm-text/45">
                      {t("overview.currentPlan")}
                    </p>
                    <h3 className="mt-1 font-creative-display text-3xl font-black uppercase text-cm-text">
                      {usageLoading ? (
                        <Skeleton className="h-12 w-24" />
                      ) : plan === "pro" ? (
                        ts("pro")
                      ) : (
                        ts("basic")
                      )}
                    </h3>
                  </div>
                  <CreditCard className="h-10 w-10 text-cm-coral/50" />
                </div>
                <p className="mt-3 text-sm font-creative-body font-bold text-cm-coral underline decoration-dotted">
                  {plan === "pro" ? t("overview.planProActive") : t("overview.planFreeActive")}
                </p>
              </article>
            </div>
          </section>

          <section className="cm-doodle-border border-2 border-cm-text/25 bg-white/60 p-6 space-y-5 dark:bg-cm-surface/60">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#7f9f7b]" />
              <h2 className="font-creative-display text-2xl font-black text-cm-text">
                {t("overview.quickActions")}
              </h2>
            </div>

            <div className="grid gap-3 lg:grid-cols-4">
              <Link
                href="/articles"
                className="group cm-doodle-border flex items-center justify-between gap-3 border-2 border-cm-text/15 bg-white/92 px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-[#8BA888]/55 hover:bg-white dark:bg-cm-surface/92 dark:hover:bg-cm-surface-raised"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cm-text/15 bg-cm-bg/75 dark:bg-cm-surface-raised">
                    <Eye className="h-5 w-5 text-nod-gold" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-creative-display text-[1.45rem] font-black leading-none text-cm-text">
                      {t("overview.viewArticlesTitle")}
                    </p>
                    <p className="mt-1 truncate font-creative-body text-[11px] font-bold text-cm-text/45">
                      {t("overview.viewArticlesDescription")}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-cm-text/35 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/settings/billing"
                className="group cm-doodle-border flex items-center justify-between gap-3 border-2 border-cm-text/15 bg-white/92 px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-[#8BA888]/55 hover:bg-white dark:bg-cm-surface/92 dark:hover:bg-cm-surface-raised"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cm-text/15 bg-cm-bg/75 dark:bg-cm-surface-raised">
                    <CreditCard className="h-5 w-5 text-[#8BA888]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-creative-display text-[1.45rem] font-black leading-none text-cm-text">
                      {t("overview.manageBillingTitle")}
                    </p>
                    <p className="mt-1 truncate font-creative-body text-[11px] font-bold text-cm-text/45">
                      {t("overview.manageBillingDescription")}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-cm-text/35 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>

              <a
                href={extensionInstallUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group cm-doodle-border flex items-center justify-between gap-3 border-2 border-cm-text/15 bg-white/92 px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-[#8BA888]/55 hover:bg-white dark:bg-cm-surface/92 dark:hover:bg-cm-surface-raised"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cm-text/15 bg-cm-bg/75 dark:bg-cm-surface-raised">
                    <Download className="h-5 w-5 text-cm-coral" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-creative-display text-[1.45rem] font-black leading-none text-cm-text">
                      {t("overview.installExtensionTitle")}
                    </p>
                    <p className="mt-1 truncate font-creative-body text-[11px] font-bold text-cm-text/45">
                      {t("overview.installExtensionDescription")}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-cm-text/35 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>

              <Link
                href="/help"
                className="group cm-doodle-border flex items-center justify-between gap-3 border-2 border-cm-text/15 bg-white/92 px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-[#8BA888]/55 hover:bg-white dark:bg-cm-surface/92 dark:hover:bg-cm-surface-raised"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cm-text/15 bg-cm-bg/75 dark:bg-cm-surface-raised">
                    <CircleHelp className="h-5 w-5 text-cm-text/45" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-creative-display text-[1.45rem] font-black leading-none text-cm-text">
                      {t("overview.getSupport")}
                    </p>
                    <p className="mt-1 truncate font-creative-body text-[11px] font-bold text-cm-text/45">
                      {t("overview.openUsageGuide")}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-cm-text/35 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </section>

          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock3 className="h-5 w-5 text-nod-gold" />
                <h2 className="font-creative-display text-2xl font-black text-cm-text">
                  {t("overview.recentArticlesTitle")}
                </h2>
              </div>
              {recentArticles.length > 0 ? (
                <Link
                  href="/articles"
                  className="text-sm font-creative-body font-bold text-nod-gold hover:underline"
                >
                  {t("overview.viewAll")}
                </Link>
              ) : null}
            </div>

            {articlesLoading ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="cm-doodle-border bg-white p-5 space-y-4 dark:bg-cm-surface"
                  >
                    <Skeleton className="h-8 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : recentArticles.length > 0 ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {recentArticles.slice(0, 6).map((article, index) => {
                  const statusMeta = getStatusMeta(article.status);
                  const contentTypeKey = CONTENT_TYPE_LABEL_KEYS[article.content_type ?? ""];

                  return (
                    <Link
                      key={article.id}
                      href={`/articles/${article.id}`}
                      className={`group cm-doodle-border border-2 border-cm-text/20 bg-white/95 p-5 transition-all hover:border-nod-gold/50 hover:-translate-y-0.5 dark:bg-cm-surface/95 ${
                        index % 2 === 0 ? "rotate-[0.2deg]" : "rotate-[-0.2deg]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cm-bg dark:bg-cm-surface-raised">
                            <FileText className="h-5 w-5 text-cm-text/35" />
                          </div>

                          <div className="min-w-0">
                            <h3 className="font-creative-display text-[1.35rem] font-bold leading-tight text-cm-text line-clamp-2 group-hover:text-nod-gold">
                              {article.title}
                            </h3>

                            <div className="mt-2 flex items-center gap-3 text-sm font-creative-body font-bold">
                              {contentTypeKey ? (
                                <span className="whitespace-nowrap text-nod-gold">
                                  #{t(contentTypeKey as keyof typeof CONTENT_TYPE_LABEL_KEYS)}
                                </span>
                              ) : null}
                              <span className="whitespace-nowrap text-cm-text/45">
                                {t("overview.modified")}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full border-2 px-3 py-1 text-xs font-creative-body font-black uppercase tracking-tight whitespace-nowrap ${statusMeta.className}`}
                        >
                          {t(statusMeta.key)}
                        </span>
                      </div>

                      <p className="mt-3 text-sm font-creative-body text-cm-text/65 line-clamp-2">
                        {article.summary_preview ?? t("noSummary")}
                      </p>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm font-creative-body font-bold text-cm-text/65 whitespace-nowrap">
                          {formatRelativeTime(article.created_at)}
                        </span>
                        <MoreHorizontal className="h-5 w-5 shrink-0 text-cm-text/35" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="cm-doodle-border border-2 border-cm-text/20 bg-white p-8 text-center dark:bg-cm-surface">
                <Sparkles className="mx-auto h-8 w-8 text-cm-text-light/50" />
                <p className="mt-3 text-sm font-creative-body text-cm-text-light">
                  {t("overview.noRecentArticles")}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      {showOnboardingBanner && !dismissOnboardingBanner ? (
        <div className="fixed bottom-6 left-1/2 z-40 w-full max-w-2xl -translate-x-1/2 px-4">
          <div className="flex items-center gap-4 cm-doodle-border border-2 border-[#8BA888] bg-white/95 p-4 shadow-xl backdrop-blur-sm dark:bg-cm-surface/95 dark:border-[#8BA888]/50">
            <div className="rounded-full bg-[#8BA888]/20 p-2">
              <TriangleAlert className="h-5 w-5 text-[#8BA888]" />
            </div>
            <div className="flex-1">
              <p className="font-creative-display text-xl font-bold text-cm-text">
                {t("overview.onboardingTitle")}
              </p>
              <p className="font-creative-body text-sm text-cm-text/65">
                {t("overview.onboardingDescription")}
              </p>
            </div>
            <Link
              href="/onboarding"
              className="rounded-full bg-[#8BA888] px-4 py-2 text-xs font-creative-body font-black uppercase tracking-wide text-white transition-colors hover:bg-[#7c9679]"
            >
              {t("overview.onboardingSetupNow")}
            </Link>
            <button
              type="button"
              onClick={() => setDismissOnboardingBanner(true)}
              className="rounded-full p-1 text-cm-text/40 transition-colors hover:text-cm-text"
              aria-label={t("overview.closeBanner")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
