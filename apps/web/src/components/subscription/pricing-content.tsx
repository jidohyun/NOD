"use client";

import { ChevronDown, ChevronLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useCheckout, useSubscription } from "@/lib/api/subscriptions";
import { Link } from "@/lib/i18n/routing";
import { openCheckout } from "@/lib/paddle";

export function PricingContent() {
  const t = useTranslations("subscription");
  const td = useTranslations("dashboard");
  const locale = useLocale();
  const checkout = useCheckout();
  const { data: subscription } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);
  const [openFaqKey, setOpenFaqKey] = useState<string | null>(null);

  const currentPlan = subscription?.plan;

  const plans = [
    {
      name: t("basic"),
      price: t("basicPrice"),
      description: t("planDescription.basic"),
      features: [
        t("features.basicSummaries"),
        t("features.basicArticles"),
        t("features.basicSearch"),
      ],
      id: "basic",
    },
    {
      name: t("pro"),
      price: t("proPrice"),
      description: t("planDescription.pro"),
      features: [t("features.proSummaries"), t("features.proArticles"), t("features.proSearch")],
      highlighted: true,
      id: "pro",
    },
  ];

  const comparisonFeatures = [
    "aiSummaries",
    "savedArticles",
    "semanticSearch",
    "markdownExport",
    "conceptExtraction",
  ] as const;

  const faqItems = [
    { q: t("faqItems.q1"), a: t("faqItems.a1") },
    { q: t("faqItems.q2"), a: t("faqItems.a2") },
    { q: t("faqItems.q3"), a: t("faqItems.a3") },
  ];

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
      // Checkout overlay handles its own errors
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl py-12 px-4">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        {td("sidebar.nav.dashboard")}
      </Link>
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold">{t("pricing")}</h1>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-xl border-2 p-8 ${
              plan.highlighted ? "border-primary shadow-lg" : "border-border"
            }`}
          >
            {plan.id === currentPlan ? (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {t("currentPlan")}
              </span>
            ) : null}
            <h2 className="text-2xl font-bold">{plan.name}</h2>
            <p className="mt-2 text-3xl font-bold">{plan.price}</p>
            <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
            <ul className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <svg
                    className="h-4 w-4 shrink-0 text-primary"
                    aria-hidden="true"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
            {plan.highlighted ? (
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={isProcessing || currentPlan === "pro"}
                className="mt-8 block w-full rounded-lg bg-primary py-3 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {currentPlan === "pro"
                  ? t("currentPlan")
                  : isProcessing
                    ? t("processing")
                    : t("upgrade")}
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {/* Feature Comparison Table */}
      <div className="mt-16">
        <h2 className="text-center text-2xl font-bold mb-8">{t("comparisonTitle")}</h2>
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-4 text-left text-sm font-semibold" />
                <th className="px-6 py-4 text-center text-sm font-semibold">{t("basic")}</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-primary">
                  {t("pro")}
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonFeatures.map((featureKey, index) => (
                <tr
                  key={featureKey}
                  className={index < comparisonFeatures.length - 1 ? "border-b" : ""}
                >
                  <td className="px-6 py-4 text-sm font-medium">
                    {t(`featureComparison.${featureKey}`)}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-muted-foreground">
                    {t(`basicValue.${featureKey}`)}
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-medium">
                    {t(`proValue.${featureKey}`)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="text-center text-2xl font-bold mb-8">{t("faq")}</h2>
        <div className="mx-auto max-w-3xl space-y-3">
          {faqItems.map((item) => (
            <div key={item.q} className="rounded-xl border bg-card">
              <button
                type="button"
                onClick={() => setOpenFaqKey(openFaqKey === item.q ? null : item.q)}
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <span className="text-sm font-semibold">{item.q}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                    openFaqKey === item.q ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openFaqKey === item.q ? (
                <div className="px-5 pb-5">
                  <p className="text-sm text-muted-foreground">{item.a}</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
