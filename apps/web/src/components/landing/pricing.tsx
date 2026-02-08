"use client";

import { ArrowRight, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";

export function LandingPricing() {
  const t = useTranslations("landing.pricing");
  const ts = useTranslations("subscription");

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
        ts("features.basicModel"),
      ],
      highlighted: false,
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
        ts("features.proModel"),
      ],
      highlighted: true,
    },
  ] as const;

  return (
    <section id="pricing" className="relative bg-nod-surface py-32 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl mb-20">
          <span className="font-mono text-[11px] text-nod-gold tracking-wider uppercase">
            {t("label")}
          </span>
          <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.08] tracking-[-0.03em] text-white whitespace-pre-line">
            {t("headline")}
          </h2>
          <p className="mt-6 text-[15px] leading-relaxed text-white/55">{t("description")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={
                plan.highlighted
                  ? "relative rounded-2xl border border-nod-gold/20 bg-nod-surface-raised p-8 lg:p-10 shadow-[0_0_60px_rgba(232,185,49,0.06)]"
                  : "relative rounded-2xl border border-nod-border/40 bg-nod-surface-raised p-8 lg:p-10"
              }
            >
              {plan.highlighted ? (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-nod-gold/[0.10] to-transparent" />
              ) : null}
              <div className="relative">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h3 className="font-display text-2xl font-semibold text-white tracking-tight">
                      {plan.name}
                    </h3>
                    <p className="mt-2 text-[13px] text-white/55">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">{plan.price}</div>
                  </div>
                </div>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-[14px] text-white/70">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-nod-gold/[0.10] border border-nod-gold/10">
                        <Check className="h-3.5 w-3.5 text-nod-gold" strokeWidth={2} />
                      </span>
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <Link
                    href="/pricing"
                    className={
                      plan.highlighted
                        ? "group inline-flex items-center gap-2 rounded-full bg-nod-gold px-6 py-3 text-[14px] font-medium text-[#0A0A0B] hover:bg-nod-gold/90 transition-colors"
                        : "group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-[14px] font-medium text-white/75 hover:text-white hover:bg-white/[0.06] hover:border-white/15 transition-colors"
                    }
                  >
                    {t("cta")}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <span className="font-mono text-[11px] text-white/45">{t("note")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
