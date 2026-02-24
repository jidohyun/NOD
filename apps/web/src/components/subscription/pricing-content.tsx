"use client";

import { CheckCircle2, ChevronDown, ChevronLeft, Crown, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { type CSSProperties, useState } from "react";
import { useCheckout, useSubscription } from "@/lib/api/subscriptions";
import { Link } from "@/lib/i18n/routing";
import { openCheckout } from "@/lib/paddle";

const PRICING_BG_STYLE: CSSProperties = {
  backgroundImage:
    "radial-gradient(rgba(232, 185, 49, 0.45) 1.1px, transparent 1.1px), radial-gradient(rgba(74, 74, 74, 0.2) 1px, transparent 1px)",
  backgroundSize: "22px 22px",
  backgroundPosition: "0 0, 11px 11px",
};

const PRICE_WITH_SUBTEXT_RE = /^(.*)\((.*)\)$/;

function splitPrice(price: string): { main: string; sub: string | null } {
  const match = price.match(PRICE_WITH_SUBTEXT_RE);
  if (!match) {
    return { main: price, sub: null };
  }

  return {
    main: match[1]?.trim() ?? price,
    sub: match[2]?.trim() ?? null,
  };
}

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
      highlighted: false,
      id: "basic",
      icon: Sparkles,
      iconClassName: "text-cm-mint",
      cardClassName: "lg:rotate-[0.7deg]",
    },
    {
      name: t("pro"),
      price: t("proPrice"),
      description: t("planDescription.pro"),
      features: [t("features.proSummaries"), t("features.proArticles"), t("features.proSearch")],
      highlighted: true,
      id: "pro",
      icon: Crown,
      iconClassName: "text-nod-gold",
      cardClassName: "lg:-rotate-[0.7deg]",
    },
  ] as const;

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
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] border-2 border-cm-text/10 bg-cm-bg p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 opacity-65" style={PRICING_BG_STYLE} />

      <div className="relative space-y-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-creative-body font-bold text-cm-text/55 transition-colors hover:text-cm-text"
        >
          <ChevronLeft className="h-4 w-4" />
          {td("sidebar.nav.dashboard")}
        </Link>

        <header className="text-center">
          <h1 className="font-creative-display text-[clamp(2.1rem,3.5vw,3.4rem)] font-black text-cm-text">
            {t("pricing")}
          </h1>
          <div className="mx-auto mt-3 h-1.5 w-28 -rotate-1 rounded-full bg-nod-gold/45" />
          <p className="mt-4 font-creative-body text-base italic text-cm-text/65">
            {locale === "ko"
              ? "지식 작업 흐름에 맞는 플랜을 선택해보세요."
              : "Pick the plan that matches your creative workflow."}
          </p>
        </header>

        <section className="mx-auto grid w-full max-w-4xl gap-6 lg:grid-cols-2">
          {plans.map((plan) => {
            const PlanIcon = plan.icon;
            const price = splitPrice(plan.price);
            const isCurrent = plan.id === currentPlan;
            return (
              <article
                key={plan.name}
                className={`cm-doodle-border cm-sketch-shadow bg-white/95 p-7 transition-all hover:-translate-y-0.5 ${plan.cardClassName} ${
                  plan.highlighted ? "border-nod-gold/45" : ""
                }`}
              >
                {isCurrent ? (
                  <span className="inline-flex rounded-full border border-nod-gold/25 bg-nod-gold/15 px-3 py-1 text-xs font-creative-body font-black text-nod-gold">
                    {t("currentPlan")}
                  </span>
                ) : null}

                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-creative-display text-4xl font-black text-cm-text">
                      {plan.name}
                    </h2>
                    <p className="mt-3 font-creative-display text-4xl font-black text-cm-text">
                      {price.main}
                    </p>
                    {price.sub ? (
                      <p className="mt-1 font-creative-body text-sm font-semibold text-cm-text/55">
                        ({price.sub})
                      </p>
                    ) : null}
                  </div>
                  <PlanIcon className={`h-9 w-9 ${plan.iconClassName}`} />
                </div>

                <p className="mt-4 font-creative-body text-sm text-cm-text/70">
                  {plan.description}
                </p>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 font-creative-body text-sm text-cm-text"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-nod-gold" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.highlighted ? (
                  <button
                    type="button"
                    onClick={handleUpgrade}
                    disabled={isProcessing || currentPlan === "pro"}
                    className="mt-7 block w-full cm-doodle-border border-cm-text bg-nod-gold py-3 text-center font-creative-body text-sm font-black text-white transition-colors hover:bg-[#ddb02f] disabled:opacity-50"
                  >
                    {currentPlan === "pro"
                      ? t("currentPlan")
                      : isProcessing
                        ? t("processing")
                        : t("upgrade")}
                  </button>
                ) : null}
              </article>
            );
          })}
        </section>

        <section className="mx-auto w-full max-w-4xl space-y-4">
          <h2 className="text-center font-creative-display text-2xl font-black text-cm-text">
            {t("comparisonTitle")}
          </h2>
          <div className="overflow-hidden cm-doodle-border bg-white/95 p-2">
            <table className="w-full rounded-xl overflow-hidden">
              <thead>
                <tr className="border-b border-dashed border-cm-text/20 bg-cm-bg/70">
                  <th className="px-5 py-4 text-left text-sm font-creative-body font-black" />
                  <th className="px-5 py-4 text-center text-sm font-creative-body font-black text-cm-text/80">
                    {t("basic")}
                  </th>
                  <th className="px-5 py-4 text-center text-sm font-creative-body font-black text-nod-gold">
                    {t("pro")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((featureKey, index) => (
                  <tr
                    key={featureKey}
                    className={
                      index < comparisonFeatures.length - 1
                        ? "border-b border-dashed border-cm-text/15"
                        : ""
                    }
                  >
                    <td className="px-5 py-4 text-sm font-creative-body font-semibold text-cm-text">
                      {t(`featureComparison.${featureKey}`)}
                    </td>
                    <td className="px-5 py-4 text-center text-sm font-creative-body text-cm-text/70">
                      {t(`basicValue.${featureKey}`)}
                    </td>
                    <td className="px-5 py-4 text-center text-sm font-creative-body font-bold text-cm-text">
                      {t(`proValue.${featureKey}`)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-center font-creative-display text-2xl font-black text-cm-text">
            {t("faq")}
          </h2>
          <div className="mx-auto max-w-3xl space-y-3">
            {faqItems.map((item) => (
              <div key={item.q} className="cm-doodle-border bg-white/95 px-5 py-4">
                <button
                  type="button"
                  onClick={() => setOpenFaqKey(openFaqKey === item.q ? null : item.q)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="font-creative-body text-sm font-black text-cm-text">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-cm-text/50 transition-transform ${
                      openFaqKey === item.q ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaqKey === item.q ? (
                  <div className="pt-3">
                    <p className="font-creative-body text-sm text-cm-text/70">{item.a}</p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
