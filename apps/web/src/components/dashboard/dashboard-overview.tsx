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
      className: "bg-emerald-100 border-emerald-500 text-emerald-700",
    };
  }

  if (status === "failed") {
    return {
      key: "statusFailed",
      className: "bg-red-100 border-red-500 text-red-700",
    };
  }

  if (status === "processing" || status === "analyzing") {
    return {
      key: "statusProcessing",
      className: "bg-amber-100 border-amber-500 text-amber-700",
    };
  }

  return {
    key: "statusPending",
    className: "bg-yellow-100 border-yellow-500 text-yellow-700",
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

  const welcomeMessage = locale === "ko" ? "NOD에 다시 오신 걸 환영해요" : "Welcome back to NOD";
  const heroTitlePrimary = locale === "ko" ? "콘텐츠 인사이트" : "Content Insight";
  const heroTitleAccent = locale === "ko" ? "워크스페이스" : "Workspace";
  const heroSubtitle =
    locale === "ko"
      ? "저장한 콘텐츠를 AI로 요약해 핵심 인사이트를 빠르게 연결하세요."
      : "Save content, summarize with AI, and connect insights faster.";

  const formatRelativeTime = (dateValue: string) => {
    const date = new Date(dateValue);
    const diffMs = Date.now() - date.getTime();
    const hour = 1000 * 60 * 60;
    const day = hour * 24;

    if (Number.isNaN(diffMs)) return "";

    if (diffMs < hour) {
      return locale === "ko" ? "방금 전" : "Just now";
    }

    if (diffMs < day) {
      const hours = Math.max(1, Math.floor(diffMs / hour));
      return locale === "ko" ? `${hours}시간 전` : `${hours} hrs ago`;
    }

    const days = Math.floor(diffMs / day);
    if (days <= 7) {
      return locale === "ko" ? `${days}일 전` : `${days} days ago`;
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
              <p className="inline-flex items-center rounded-full border border-cm-text/15 bg-white/75 px-3 py-1 font-creative-body text-sm font-semibold text-cm-text-light">
                {welcomeMessage}
              </p>
              <h1 className="mt-4 font-creative-display text-[clamp(2.35rem,4.7vw,4rem)] font-black leading-[0.95] tracking-tight text-cm-text">
                {heroTitlePrimary}{" "}
                <span className="text-nod-gold underline decoration-wavy decoration-cm-mint/80 underline-offset-8">
                  {heroTitleAccent}
                </span>
              </h1>
              <p className="mt-3 whitespace-nowrap font-creative-body text-[1.55rem] italic text-cm-text/68">
                {heroSubtitle}
              </p>
            </div>

            <div className="space-y-3 lg:justify-self-end">
              <div className="cm-doodle-border border-2 border-cm-text/15 bg-white/92 p-4">
                <p className="font-creative-body text-[11px] font-black uppercase tracking-[0.14em] text-cm-text/45">
                  {locale === "ko" ? "오늘의 워크플로우" : "Today workflow"}
                </p>
                <ul className="mt-3 space-y-1.5">
                  <li className="flex items-center gap-2 font-creative-body text-xs font-bold text-cm-text/65">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cm-bg text-[11px] text-cm-text">
                      1
                    </span>
                    {locale === "ko" ? "콘텐츠 수집" : "Capture content"}
                  </li>
                  <li className="flex items-center gap-2 font-creative-body text-xs font-bold text-cm-text/65">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cm-bg text-[11px] text-cm-text">
                      2
                    </span>
                    {locale === "ko" ? "요약 분석" : "Analyze summaries"}
                  </li>
                  <li className="flex items-center gap-2 font-creative-body text-xs font-bold text-cm-text/65">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-cm-bg text-[11px] text-cm-text">
                      3
                    </span>
                    {locale === "ko" ? "핵심 인사이트 정리" : "Refine key insights"}
                  </li>
                </ul>
              </div>

              <Link
                href="/articles"
                className="inline-flex w-full items-center justify-center gap-2 cm-doodle-border border-2 border-cm-text bg-nod-gold px-7 py-3 font-creative-display text-base font-black text-white transition-all hover:-translate-y-0.5 hover:cm-sketch-shadow"
              >
                <CirclePlus className="h-5 w-5" />
                {locale === "ko" ? "콘텐츠 보러가기" : "View Content"}
              </Link>
            </div>
          </header>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-nod-gold" />
              <h2 className="font-creative-display text-2xl font-black text-cm-text">
                {locale === "ko" ? "핵심 지표" : "Key Metrics"}
              </h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <article className="cm-doodle-border cm-sketch-shadow bg-white p-5 rotate-[-1deg] transition-all hover:-translate-y-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-creative-body font-black uppercase tracking-widest text-cm-text/45">
                      {locale === "ko" ? "총 콘텐츠" : "Total Content"}
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
                {usageLoading || plan !== "pro" ? (
                  <div className="mt-3 h-1.5 rounded-full bg-cm-text/10">
                    <div className="h-full w-3/4 rounded-full bg-nod-gold" />
                  </div>
                ) : (
                  <p className="mt-3 font-creative-body text-xs font-bold text-cm-text/45">
                    {locale === "ko"
                      ? "PRO는 콘텐츠 저장 무제한"
                      : "Unlimited content storage on PRO"}
                  </p>
                )}
              </article>

              <article className="cm-doodle-border cm-sketch-shadow bg-white p-5 rotate-[0.8deg] transition-all hover:-translate-y-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-creative-body font-black uppercase tracking-widest text-cm-text/45">
                      {locale === "ko" ? "AI 요약" : "AI Summaries"}
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
                    ? locale === "ko"
                      ? "사용량 계산 중..."
                      : "Calculating usage..."
                    : locale === "ko"
                      ? `사용량: ${summariesUsed} / ${summariesLimit === -1 ? "∞" : summariesLimit}`
                      : `Usage: ${summariesUsed} / ${summariesLimit === -1 ? "∞" : summariesLimit}`}
                </p>
              </article>

              <article className="cm-doodle-border cm-sketch-shadow bg-white p-5 rotate-[-0.8deg] transition-all hover:-translate-y-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-creative-body font-black uppercase tracking-widest text-cm-text/45">
                      {locale === "ko" ? "현재 플랜" : "Current Plan"}
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
                  {plan === "pro"
                    ? locale === "ko"
                      ? "프로 플랜 활성화"
                      : "Pro plan active"
                    : locale === "ko"
                      ? "Free 플랜 사용 중"
                      : "Using Free plan"}
                </p>
              </article>
            </div>
          </section>

          <section className="cm-doodle-border border-2 border-cm-text/25 bg-white/60 p-6 space-y-5">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#7f9f7b]" />
              <h2 className="font-creative-display text-2xl font-black text-cm-text">
                {locale === "ko" ? "빠른 작업" : "Quick Actions"}
              </h2>
            </div>

            <div className="grid gap-3 lg:grid-cols-4">
              <Link
                href="/articles"
                className="group cm-doodle-border flex items-center justify-between gap-3 border-2 border-cm-text/15 bg-white/92 px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-[#8BA888]/55 hover:bg-white"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cm-text/15 bg-cm-bg/75">
                    <Eye className="h-5 w-5 text-nod-gold" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-creative-display text-[1.45rem] font-black leading-none text-cm-text">
                      {locale === "ko" ? "콘텐츠 보기" : "View Content"}
                    </p>
                    <p className="mt-1 truncate font-creative-body text-[11px] font-bold text-cm-text/45">
                      {locale === "ko" ? "저장한 콘텐츠로 이동" : "Open saved content"}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-cm-text/35 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/settings/billing"
                className="group cm-doodle-border flex items-center justify-between gap-3 border-2 border-cm-text/15 bg-white/92 px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-[#8BA888]/55 hover:bg-white"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cm-text/15 bg-cm-bg/75">
                    <CreditCard className="h-5 w-5 text-[#8BA888]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-creative-display text-[1.45rem] font-black leading-none text-cm-text">
                      {locale === "ko" ? "결제 관리" : "Manage Billing"}
                    </p>
                    <p className="mt-1 truncate font-creative-body text-[11px] font-bold text-cm-text/45">
                      {locale === "ko" ? "구독 및 결제 수단" : "Subscription and payment"}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-cm-text/35 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>

              <a
                href={extensionInstallUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group cm-doodle-border flex items-center justify-between gap-3 border-2 border-cm-text/15 bg-white/92 px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-[#8BA888]/55 hover:bg-white"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cm-text/15 bg-cm-bg/75">
                    <Download className="h-5 w-5 text-cm-coral" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-creative-display text-[1.45rem] font-black leading-none text-cm-text">
                      {locale === "ko" ? "익스텐션 설치" : "Install Extension"}
                    </p>
                    <p className="mt-1 truncate font-creative-body text-[11px] font-bold text-cm-text/45">
                      {locale === "ko" ? "브라우저에 바로 추가" : "Add it to your browser"}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-cm-text/35 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>

              <Link
                href="/help"
                className="group cm-doodle-border flex items-center justify-between gap-3 border-2 border-cm-text/15 bg-white/92 px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-[#8BA888]/55 hover:bg-white"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cm-text/15 bg-cm-bg/75">
                    <CircleHelp className="h-5 w-5 text-cm-text/45" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-creative-display text-[1.45rem] font-black leading-none text-cm-text">
                      {locale === "ko" ? "도움말" : "Get Support"}
                    </p>
                    <p className="mt-1 truncate font-creative-body text-[11px] font-bold text-cm-text/45">
                      {locale === "ko" ? "사용 가이드 열기" : "Open usage guide"}
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
                  {locale === "ko" ? "최근 콘텐츠" : "Recent Content"}
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
                  <div key={i} className="cm-doodle-border bg-white p-5 space-y-4">
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
                      className={`group cm-doodle-border border-2 border-cm-text/20 bg-white/95 p-5 transition-all hover:border-nod-gold/50 hover:-translate-y-0.5 ${
                        index % 2 === 0 ? "rotate-[0.2deg]" : "rotate-[-0.2deg]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cm-bg">
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
                                {locale === "ko" ? "수정" : "Modified"}
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
              <div className="cm-doodle-border border-2 border-cm-text/20 bg-white p-8 text-center">
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
          <div className="flex items-center gap-4 cm-doodle-border border-2 border-[#8BA888] bg-white/95 p-4 shadow-xl backdrop-blur-sm">
            <div className="rounded-full bg-[#8BA888]/20 p-2">
              <TriangleAlert className="h-5 w-5 text-[#8BA888]" />
            </div>
            <div className="flex-1">
              <p className="font-creative-display text-xl font-bold text-cm-text">
                {locale === "ko" ? "온보딩을 마무리하세요!" : "Finish your onboarding!"}
              </p>
              <p className="font-creative-body text-sm text-cm-text/65">
                {locale === "ko"
                  ? "브라우저 익스텐션을 연결하면 인사이트를 바로 수집할 수 있어요."
                  : "Connect your browser extension to start capturing insights instantly."}
              </p>
            </div>
            <Link
              href="/onboarding"
              className="rounded-full bg-[#8BA888] px-4 py-2 text-xs font-creative-body font-black uppercase tracking-wide text-white transition-colors hover:bg-[#7c9679]"
            >
              {locale === "ko" ? "설정하기" : "Setup Now"}
            </Link>
            <button
              type="button"
              onClick={() => setDismissOnboardingBanner(true)}
              className="rounded-full p-1 text-cm-text/40 transition-colors hover:text-cm-text"
              aria-label={locale === "ko" ? "배너 닫기" : "Close banner"}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
