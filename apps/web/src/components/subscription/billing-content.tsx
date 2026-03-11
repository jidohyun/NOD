"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  CircleDollarSign,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { type CSSProperties, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCheckout,
  useInvalidateSubscription,
  usePortalUrl,
  useSubscription,
  useUsage,
} from "@/lib/api/subscriptions";
import { Link } from "@/lib/i18n/routing";
import { openCheckout } from "@/lib/paddle";

const BILLING_BG_STYLE: CSSProperties = {
  backgroundImage:
    "radial-gradient(rgba(232, 185, 49, 0.45) 1.1px, transparent 1.1px), radial-gradient(rgba(74, 74, 74, 0.2) 1px, transparent 1px)",
  backgroundSize: "22px 22px",
  backgroundPosition: "0 0, 11px 11px",
};

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

export function BillingContent() {
  const t = useTranslations("subscription");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: usage, isLoading: usageLoading } = useUsage();
  const { refetch: fetchPortalUrl } = usePortalUrl();
  const checkout = useCheckout();
  const invalidate = useInvalidateSubscription();
  const [isProcessing, setIsProcessing] = useState(false);

  const dateLocale = DATE_LOCALE_MAP[locale] || "en-US";

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      invalidate();
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout");
      window.history.replaceState({}, "", url.pathname);
    }
  }, [searchParams, invalidate]);

  if (subLoading || usageLoading) {
    return (
      <div className="relative overflow-hidden rounded-[2rem] border-2 border-cm-text/10 bg-cm-bg p-6 lg:p-8">
        <div className="pointer-events-none absolute inset-0 opacity-65" style={BILLING_BG_STYLE} />
        <div className="relative space-y-6">
          <Skeleton className="h-9 w-64 bg-cm-text/10" />
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-7">
              <div className="cm-doodle-border bg-white/90 dark:bg-cm-surface/90 p-6">
                <Skeleton className="h-4 w-28 bg-cm-text/10" />
                <Skeleton className="mt-4 h-8 w-44 bg-cm-text/10" />
                <Skeleton className="mt-2 h-4 w-56 bg-cm-text/10" />
              </div>
              <div className="cm-doodle-border bg-white/90 dark:bg-cm-surface/90 p-6">
                <Skeleton className="h-4 w-24 bg-cm-text/10" />
                <Skeleton className="mt-5 h-5 w-full rounded-full bg-cm-text/10" />
                <Skeleton className="mt-3 h-4 w-40 bg-cm-text/10" />
              </div>
            </div>
            <div className="space-y-6 lg:col-span-5">
              <div className="cm-doodle-border bg-white/90 dark:bg-cm-surface/90 p-6">
                <Skeleton className="h-4 w-32 bg-cm-text/10" />
                <div className="mt-4 space-y-3">
                  <Skeleton className="h-4 w-full bg-cm-text/10" />
                  <Skeleton className="h-4 w-5/6 bg-cm-text/10" />
                  <Skeleton className="h-4 w-4/5 bg-cm-text/10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isPro = subscription?.plan === "pro";
  const isCheckoutSuccess = searchParams.get("checkout") === "success";
  const summariesUsed = usage?.summaries_used ?? 0;
  const summariesLimit = usage?.summaries_limit ?? 0;
  const isUnlimited = summariesLimit === -1;
  const percentage = isUnlimited
    ? 0
    : summariesLimit > 0
      ? Math.min((summariesUsed / summariesLimit) * 100, 100)
      : 0;

  const usageLabel = isUnlimited
    ? t("unlimited")
    : t("summariesUsed", {
        used: summariesUsed,
        limit: summariesLimit,
      });

  const planName = isPro ? t("pro") : t("basic");
  const planPrice = isPro ? t("proPrice") : t("basicPrice");
  const planFeatures = isPro
    ? [t("features.proSummaries"), t("features.proArticles"), t("features.proSearch")]
    : [t("features.basicSummaries"), t("features.basicArticles"), t("features.basicSearch")];

  function handleManagePayment() {
    fetchPortalUrl().then(({ data }) => {
      if (data?.update_payment_method_url) {
        window.open(data.update_payment_method_url, "_blank");
      }
    });
  }

  async function handleUpgrade() {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const data = await checkout.mutateAsync();
      await openCheckout({
        priceId: data.price_id,
        userId: data.user_id,
        userEmail: data.user_email,
        locale,
      });
    } catch {
    } finally {
      setIsProcessing(false);
    }
  }

  function handleCancelSubscription() {
    if (!window.confirm(t("cancelConfirm"))) return;
    fetchPortalUrl().then(({ data }) => {
      if (data?.cancel_url) {
        window.open(data.cancel_url, "_blank");
      }
    });
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] border-2 border-cm-text/10 bg-cm-bg p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 opacity-65" style={BILLING_BG_STYLE} />

      <div className="relative space-y-8">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm font-creative-body font-bold text-cm-text/55 transition-colors hover:text-cm-text"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("backToSettings")}
        </Link>

        <header>
          <h1 className="font-creative-display text-[clamp(2rem,3.2vw,3.3rem)] font-black text-cm-text">
            {t("manageBilling")}
          </h1>
          <div className="mt-3 h-1.5 w-32 -rotate-1 rounded-full bg-nod-gold/45" />
          <p className="mt-4 font-creative-body text-base italic text-cm-text/65">
            {t("billingSubtitle")}
          </p>
        </header>

        {isCheckoutSuccess ? (
          <div className="cm-doodle-border border-2 border-emerald-200 bg-emerald-50/90 dark:bg-emerald-950/30 dark:border-emerald-800 p-4">
            <p className="font-creative-body text-sm font-black text-emerald-700">
              {t("checkoutSuccess")}
            </p>
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <section className="cm-doodle-border cm-sketch-shadow -rotate-[0.5deg] bg-white/95 dark:bg-cm-surface/95 p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-creative-body font-black uppercase tracking-widest text-cm-text/45">
                    {t("currentPlan")}
                  </p>
                  <h2 className="mt-2 font-creative-display text-4xl font-black text-cm-text">
                    {planName}
                  </h2>
                  <p className="mt-2 font-creative-body text-sm font-bold text-cm-text/70">
                    {planPrice}
                  </p>
                  {subscription?.current_period_end ? (
                    <p className="mt-2 font-creative-body text-xs font-semibold text-cm-text/55">
                      {t("nextBilling", {
                        date: new Date(subscription.current_period_end).toLocaleDateString(
                          dateLocale
                        ),
                      })}
                    </p>
                  ) : null}
                </div>

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-cm-text ${
                    isPro ? "bg-nod-gold/20" : "bg-cm-mint"
                  }`}
                >
                  {isPro ? (
                    <CreditCard className="h-6 w-6 text-nod-gold" />
                  ) : (
                    <Sparkles className="h-6 w-6 text-cm-text" />
                  )}
                </div>
              </div>

              {!isPro ? (
                <button
                  type="button"
                  onClick={handleUpgrade}
                  disabled={isProcessing}
                  className="mt-6 inline-flex items-center cm-doodle-border border-cm-text bg-nod-gold px-5 py-2 font-creative-body text-sm font-black text-white transition-all hover:bg-white hover:text-nod-gold disabled:opacity-50"
                >
                  {isProcessing ? t("processing") : t("upgrade")}
                </button>
              ) : null}
            </section>

            <section className="cm-doodle-border cm-sketch-shadow rotate-[0.5deg] bg-white/95 dark:bg-cm-surface/95 p-7">
              <div className="mb-5 flex items-center gap-2">
                <CircleDollarSign className="h-5 w-5 text-[#8BA888]" />
                <h3 className="font-creative-display text-2xl font-black text-cm-text">
                  {t("usage")}
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <p className="font-creative-body text-sm font-bold text-cm-text/60">
                    {t("currentMonthlyAiSummaries")}
                  </p>
                  <p className="font-creative-display text-3xl font-black text-cm-text">
                    {isUnlimited ? t("unlimited") : `${summariesUsed}/${summariesLimit}`}
                  </p>
                </div>

                {!isUnlimited ? (
                  <div className="h-5 overflow-hidden rounded-2xl border border-cm-text/15 bg-cm-bg">
                    <div
                      className="h-full bg-nod-gold transition-all duration-500"
                      style={{ width: `${Math.max(6, percentage)}%` }}
                    />
                  </div>
                ) : null}

                <p className="font-creative-body text-xs font-bold italic text-cm-text/50">
                  {usageLabel}
                </p>

                {!isUnlimited && summariesUsed >= summariesLimit ? (
                  <p className="font-creative-body text-xs font-bold text-red-500">
                    {t("limitReached")}
                  </p>
                ) : null}
              </div>
            </section>

            <section className="cm-doodle-border border-dashed border-cm-text/25 bg-white/80 dark:bg-cm-surface/80 p-6">
              <h3 className="mb-4 font-creative-display text-2xl font-black text-cm-text">
                {t("includedInPlan")}
              </h3>
              <ul className="space-y-3">
                {planFeatures.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 font-creative-body text-sm font-semibold text-cm-text"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-nod-gold" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="space-y-6 lg:col-span-5">
            <section className="cm-doodle-border cm-sketch-shadow -rotate-[0.4deg] bg-white/95 dark:bg-cm-surface/95 p-7">
              <div className="mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-cm-coral" />
                <h3 className="font-creative-display text-2xl font-black text-cm-text">
                  {t("billingControls")}
                </h3>
              </div>

              {isPro && subscription?.status === "active" ? (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={handleManagePayment}
                    className="w-full cm-doodle-border border-cm-text bg-white dark:bg-cm-surface dark:hover:bg-cm-surface-raised px-4 py-3 text-left font-creative-body text-sm font-black text-cm-text transition-colors hover:bg-cm-bg"
                  >
                    {t("managePayment")}
                  </button>

                  <div className="cm-doodle-border border-2 border-red-200 bg-red-50/70 dark:bg-red-950/30 p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                      <p className="font-creative-body text-xs font-bold text-cm-text/65">
                        {t("cancelDescription")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelSubscription}
                      className="mt-3 inline-flex cm-doodle-border border-red-200 bg-white dark:bg-cm-surface dark:hover:bg-red-950/30 px-3 py-1.5 font-creative-body text-xs font-black text-red-500 transition-colors hover:bg-red-50"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="font-creative-body text-sm font-semibold text-cm-text/65">
                    {t("proUpgradeDescription")}
                  </p>
                  <button
                    type="button"
                    onClick={handleUpgrade}
                    disabled={isProcessing}
                    className="inline-flex cm-doodle-border border-cm-text bg-nod-gold px-5 py-2 font-creative-body text-sm font-black text-white transition-all hover:bg-white hover:text-nod-gold disabled:opacity-50"
                  >
                    {isProcessing ? t("processing") : t("upgrade")}
                  </button>
                </div>
              )}
            </section>

            <section className="cm-doodle-border border-2 border-cm-text/20 bg-white/85 dark:bg-cm-surface/85 p-6">
              <h3 className="mb-4 font-creative-display text-2xl font-black text-cm-text">
                {t("billingStatus")}
              </h3>

              <div className="space-y-3 font-creative-body text-sm">
                <div className="flex items-center justify-between border-b border-dashed border-cm-text/15 pb-3">
                  <span className="font-bold text-cm-text/60">{t("planStatus")}</span>
                  <span className="font-black text-cm-text">{subscription?.status ?? "-"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-cm-text/60">{t("nextBillingLabel")}</span>
                  <span className="font-black text-cm-text">
                    {subscription?.current_period_end
                      ? new Date(subscription.current_period_end).toLocaleDateString(dateLocale)
                      : "-"}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
