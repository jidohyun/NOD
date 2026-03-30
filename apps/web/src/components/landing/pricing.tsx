"use client";

import { ArrowRight, Check, Sparkles, Sprout } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";
import { FloatingCircle } from "./decorations";

const PRICE_WITH_SUBTEXT_RE = /^(.*)\((.*)\)$/;

export function LandingPricing() {
  const t = useTranslations("landing.pricing");
  const ts = useTranslations("subscription");

  const splitPrice = (price: string) => {
    const match = price.match(PRICE_WITH_SUBTEXT_RE);
    if (!match) {
      return { main: price, sub: null as string | null };
    }

    return {
      main: match[1]?.trim() ?? price,
      sub: match[2]?.trim() ?? null,
    };
  };

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

  return (
    <section
      id="pricing"
      className="relative bg-cm-bg py-32 lg:py-40 ko-keep overflow-hidden scroll-mt-24"
    >
      {/* Decorations */}
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
        {/* Header */}
        <div className="max-w-2xl mb-20 text-center mx-auto">
          <span className="inline-block cm-doodle-border bg-nod-gold/10 px-4 py-1.5 font-creative-body text-xs font-bold text-nod-gold tracking-wider uppercase">
            {t("label")}
          </span>
          <h2 className="mt-6 font-creative-display text-[clamp(2.25rem,4vw,3.5rem)] font-black leading-[1.1] tracking-tight text-cm-text">
            {t("headline")}
          </h2>
          <p className="mt-6 mx-auto max-w-xl font-creative-body text-lg leading-relaxed text-cm-text-light">
            {t("description")}
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-4xl mx-auto">
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
                  {/* Plan header */}
                  <div className="mb-8 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`cm-organic-shape flex h-12 w-12 items-center justify-center ${plan.highlighted ? "bg-nod-gold" : "bg-cm-text/10"}`}
                      >
                        <PlanIcon
                          className={`h-6 w-6 ${plan.highlighted ? "text-white" : "text-cm-text/70"}`}
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

                  {/* Divider */}
                  <div className="mb-6 border-t-2 border-dashed border-cm-text/10" />

                  {/* Features */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-3 font-creative-body text-[15px] text-cm-text"
                      >
                        <span
                          className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center cm-organic-shape ${plan.highlighted ? "bg-nod-gold text-white" : "bg-cm-mint text-cm-text/70"}`}
                        >
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        <span className="leading-relaxed font-semibold">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href="/pricing"
                    className={`group flex w-full items-center justify-center gap-2 cm-doodle-border py-4 font-creative-display text-base font-black transition-all ${
                      plan.highlighted
                        ? "bg-nod-gold text-white hover:bg-nod-gold/90 hover:cm-sketch-shadow"
                        : "bg-cm-bg text-cm-text border-2 border-cm-text/10 hover:border-cm-text/20 hover:bg-cm-mint/30"
                    }`}
                  >
                    {t("cta")}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  {plan.highlighted ? (
                    <p className="mt-3 text-center font-creative-body text-xs font-semibold text-cm-text/40 uppercase tracking-wide">
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
  );
}
