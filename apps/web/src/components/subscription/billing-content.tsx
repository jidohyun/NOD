"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";
import {
  useInvalidateSubscription,
  usePortalUrl,
  useSubscription,
  useUsage,
} from "@/lib/api/subscriptions";
import { UsageBar } from "./usage-bar";

const DATE_LOCALE_MAP: Record<string, string> = {
  ko: "ko-KR",
  en: "en-US",
  ja: "ja-JP",
};

export function BillingContent() {
  const t = useTranslations("subscription");
  const tc = useTranslations("common");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: usage, isLoading: usageLoading } = useUsage();
  const { refetch: fetchPortalUrl } = usePortalUrl();
  const invalidate = useInvalidateSubscription();

  const dateLocale = DATE_LOCALE_MAP[locale] || "en-US";

  // Refresh subscription data after successful checkout
  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      invalidate();
      // Clean up URL param
      const url = new URL(window.location.href);
      url.searchParams.delete("checkout");
      window.history.replaceState({}, "", url.pathname);
    }
  }, [searchParams, invalidate]);

  if (subLoading || usageLoading) {
    return <div className="py-12 text-center text-muted-foreground">{tc("loading")}</div>;
  }

  const isPro = subscription?.plan === "pro";

  function handleManagePayment() {
    fetchPortalUrl().then(({ data }) => {
      if (data?.update_payment_method_url) {
        window.open(data.update_payment_method_url, "_blank");
      }
    });
  }

  function handleCancelSubscription() {
    if (!window.confirm(t("cancelConfirm"))) return;
    fetchPortalUrl().then(({ data }) => {
      if (data?.cancel_url) {
        window.open(data.cancel_url, "_blank");
      }
    });
  }

  const summariesUsed = usage?.summaries_used ?? 0;
  const summariesLimit = usage?.summaries_limit ?? 0;
  const isUnlimited = summariesLimit === -1;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("manageBilling")}</h1>

      {/* Checkout Success Banner */}
      {searchParams.get("checkout") === "success" && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">{t("checkoutSuccess")}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Current Plan */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t("currentPlan")}</p>
                <p className="text-xl font-bold">
                  {isPro ? t("pro") : t("basic")} — {isPro ? t("proPrice") : t("basicPrice")}
                </p>
                {subscription?.current_period_end ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("nextBilling", {
                      date: new Date(subscription.current_period_end).toLocaleDateString(
                        dateLocale
                      ),
                    })}
                  </p>
                ) : null}
              </div>
              {!isPro && (
                <Link
                  href="/pricing"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  {t("upgrade")}
                </Link>
              )}
            </div>
          </div>

          {/* Usage */}
          <UsageBar />

          {/* Usage Details */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-sm font-semibold">{t("usage")}</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("featureComparison.aiSummaries")}
                  </span>
                  <span className="font-medium">
                    {isUnlimited ? t("unlimited") : `${summariesUsed}/${summariesLimit}`}
                  </span>
                </div>
                {!isUnlimited ? (
                  <div className="mt-1.5 h-1.5 rounded-full bg-secondary">
                    <div
                      className="h-1.5 rounded-full bg-primary transition-all"
                      style={{
                        width: `${Math.min((summariesUsed / summariesLimit) * 100, 100)}%`,
                      }}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Plan Features */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="mb-4 text-sm font-semibold">{isPro ? t("pro") : t("basic")}</h2>
            <ul className="space-y-3">
              {(isPro
                ? [t("features.proSummaries"), t("features.proArticles"), t("features.proSearch")]
                : [
                    t("features.basicSummaries"),
                    t("features.basicArticles"),
                    t("features.basicSearch"),
                  ]
              ).map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <svg
                    className="h-4 w-4 shrink-0 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <title>Check</title>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            {!isPro ? (
              <Link
                href="/pricing"
                className="mt-4 block w-full rounded-lg bg-primary py-2.5 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t("upgrade")}
              </Link>
            ) : null}
          </div>

          {/* Pro Management */}
          {isPro && subscription?.status === "active" ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleManagePayment}
                className="w-full rounded-lg border bg-card p-4 text-left text-sm font-medium hover:bg-muted/50"
              >
                {t("managePayment")}
              </button>
              <div className="rounded-lg border border-destructive/20 p-4">
                <p className="text-sm text-muted-foreground">{t("cancelDescription")}</p>
                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  className="mt-2 rounded-md border border-destructive px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
