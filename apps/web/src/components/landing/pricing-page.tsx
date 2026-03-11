"use client";

import { ArrowRight, Check, ChevronDown, Sparkles, Sprout } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/lib/i18n/routing";
import { FloatingCircle } from "./decorations";

const PRICE_WITH_SUBTEXT_RE = /^(.*)\((.*)\)$/;

function splitPrice(price: string): { main: string; sub: string | null } {
  const match = price.match(PRICE_WITH_SUBTEXT_RE);
  if (!match) return { main: price, sub: null };
  return { main: match[1]?.trim() ?? price, sub: match[2]?.trim() ?? null };
}

export function PricingPage() {
  const t = useTranslations("landing.pricing");
  const ts = useTranslations("subscription");
  const [openFaqKey, setOpenFaqKey] = useState<string | null>(null);

  const plans = [
    {
      id: "basic",
      name: ts("basic"),
      price: ts("basicPrice"),
      description: ts("planDescription.basic"),
      features: [
        ts("features.basicSummaries"),
        ts("features.basicArticles"),
        ts("features.basicSearch"),
        t("basicAnalyzableTypes"),
      ],
      highlighted: false,
      icon: Sprout,
      cardColor: "bg-cm-mint/40",
      rotation: "cm-askew-left",
    },
    {
      id: "pro",
      name: ts("pro"),
      price: ts("proPrice"),
      description: ts("planDescription.pro"),
      features: [
        ts("features.proSummaries"),
        ts("features.proArticles"),
        ts("features.proSearch"),
        t("proAnalyzableTypes"),
      ],
      highlighted: true,
      icon: Sparkles,
      cardColor: "bg-nod-gold/10",
      rotation: "cm-askew-right",
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
    { q: ts("faqItems.q1"), a: ts("faqItems.a1") },
    { q: ts("faqItems.q2"), a: ts("faqItems.a2") },
    { q: ts("faqItems.q3"), a: ts("faqItems.a3") },
  ];

  return (
    <div className="bg-cm-bg">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <FloatingCircle
          color="bg-cm-lavender/40"
          size="w-8 h-8"
          className="absolute top-20 right-[8%]"
        />
        <FloatingCircle
          color="bg-cm-mint/30"
          size="w-6 h-6"
          className="absolute bottom-24 left-[6%]"
          reverse
        />

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto mb-20 max-w-2xl text-center">
            <span className="inline-block cm-doodle-border bg-nod-gold/10 px-4 py-1.5 font-creative-body text-xs font-bold uppercase tracking-wider text-nod-gold">
              {t("label")}
            </span>
            <h1 className="mt-6 font-creative-display text-[clamp(2.25rem,4vw,3.5rem)] font-black leading-[1.1] tracking-tight text-cm-text">
              {t("headline")}
            </h1>
            <p className="mx-auto mt-6 max-w-xl font-creative-body text-lg leading-relaxed text-cm-text-light">
              {t("description")}
            </p>
          </div>

          {/* Plan Cards */}
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-10 lg:grid-cols-2">
            {plans.map((plan) => {
              const PlanIcon = plan.icon;
              const price = splitPrice(plan.price);
              return (
                <div
                  key={plan.id}
                  className={`${plan.rotation} transition-transform duration-500 hover:rotate-0`}
                >
                  <div
                    className={`cm-doodle-border cm-sketch-shadow ${plan.cardColor} p-8 lg:p-10 ${
                      plan.highlighted ? "border-2 border-nod-gold/40 ring-2 ring-nod-gold/10" : ""
                    }`}
                  >
                    <div className="mb-8 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`cm-organic-shape flex h-12 w-12 items-center justify-center ${
                            plan.highlighted ? "bg-nod-gold" : "bg-cm-text/10"
                          }`}
                        >
                          <PlanIcon
                            className={`h-6 w-6 ${
                              plan.highlighted ? "text-white" : "text-cm-text/70"
                            }`}
                            strokeWidth={1.5}
                          />
                        </div>
                        <div>
                          <h3 className="font-creative-display text-2xl font-black text-cm-text">
                            {plan.name}
                          </h3>
                          <p className="font-creative-body text-sm text-cm-text-light">
                            {plan.description}
                          </p>
                        </div>
                      </div>
                      <div className="ml-3 shrink-0 text-right">
                        <div className="font-creative-display text-3xl font-black leading-none text-cm-text">
                          {price.main}
                        </div>
                        {price.sub ? (
                          <div className="mt-1 font-creative-body text-xs font-semibold text-cm-text/55">
                            ({price.sub})
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="mb-6 border-t-2 border-dashed border-cm-text/10" />

                    <ul className="mb-8 space-y-4">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-3 font-creative-body text-[15px] text-cm-text"
                        >
                          <span
                            className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center cm-organic-shape ${
                              plan.highlighted
                                ? "bg-nod-gold text-white"
                                : "bg-cm-mint text-cm-text/70"
                            }`}
                          >
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                          <span className="font-semibold leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href="/login"
                      className={`group flex w-full items-center justify-center gap-2 cm-doodle-border py-4 font-creative-display text-base font-black transition-all ${
                        plan.highlighted
                          ? "bg-nod-gold text-white hover:bg-nod-gold/90 hover:cm-sketch-shadow"
                          : "border-2 border-cm-text/10 bg-cm-bg text-cm-text hover:border-cm-text/20 hover:bg-cm-mint/30"
                      }`}
                    >
                      {t("cta")}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                    {plan.highlighted ? (
                      <p className="mt-3 text-center font-creative-body text-xs font-semibold uppercase tracking-wide text-cm-text/40">
                        {t("note")}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="border-t border-dashed border-cm-text/10 py-20 lg:py-28">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <h2 className="mb-10 text-center font-creative-display text-[clamp(1.75rem,3vw,2.5rem)] font-black text-cm-text">
            {ts("comparisonTitle")}
          </h2>
          <div className="cm-doodle-border cm-sketch-shadow overflow-hidden bg-white/95 p-2 dark:bg-cm-surface/95">
            <table className="w-full overflow-hidden rounded-xl">
              <thead>
                <tr className="border-b border-dashed border-cm-text/20 bg-cm-bg/70">
                  <th className="px-5 py-4 text-left text-sm font-creative-body font-black" />
                  <th className="px-5 py-4 text-center text-sm font-creative-body font-black text-cm-text/80">
                    {ts("basic")}
                  </th>
                  <th className="px-5 py-4 text-center text-sm font-creative-body font-black text-nod-gold">
                    {ts("pro")}
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
                      {ts(`featureComparison.${featureKey}`)}
                    </td>
                    <td className="px-5 py-4 text-center text-sm font-creative-body text-cm-text/70">
                      {ts(`basicValue.${featureKey}`)}
                    </td>
                    <td className="px-5 py-4 text-center text-sm font-creative-body font-bold text-cm-text">
                      {ts(`proValue.${featureKey}`)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-dashed border-cm-text/10 py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <h2 className="mb-10 text-center font-creative-display text-[clamp(1.75rem,3vw,2.5rem)] font-black text-cm-text">
            {ts("faq")}
          </h2>
          <div className="space-y-3">
            {faqItems.map((item) => (
              <div
                key={item.q}
                className="cm-doodle-border bg-white/95 px-5 py-4 dark:bg-cm-surface/95"
              >
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
                    <p className="font-creative-body text-sm leading-relaxed text-cm-text/70">
                      {item.a}
                    </p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-dashed border-cm-text/10 py-20 lg:py-28">
        <div className="mx-auto max-w-2xl px-6 text-center lg:px-8">
          <h2 className="font-creative-display text-[clamp(1.75rem,3vw,2.5rem)] font-black text-cm-text">
            {t("headline")}
          </h2>
          <p className="mx-auto mt-4 max-w-lg font-creative-body text-base leading-relaxed text-cm-text-light">
            {t("description")}
          </p>
          <Link
            href="/login"
            className="group mt-8 inline-flex items-center gap-2 cm-doodle-border bg-nod-gold px-8 py-4 font-creative-display text-base font-black text-white transition-all hover:bg-nod-gold/90 hover:cm-sketch-shadow"
          >
            {t("cta")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
