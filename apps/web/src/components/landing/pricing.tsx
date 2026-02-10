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
    <section id="pricing" className="landing-surface relative py-32 lg:py-40 ko-keep">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl mb-24">
          <span className="inline-block rounded border border-black/10 bg-black/[0.03] px-2 py-1 font-mono text-[11px] font-medium text-nod-gold tracking-wider uppercase dark:border-white/[0.06] dark:bg-white/[0.03]">
            {t("label")}
          </span>
          <h2 className="landing-text mt-6 font-display text-[clamp(2.25rem,4vw,4rem)] font-bold leading-[1.08] tracking-[-0.03em] whitespace-pre-line">
            {t("headline")}
          </h2>
          <p className="landing-text-muted mt-6 max-w-xl text-[1.125rem] leading-relaxed font-light">
            {t("description")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={
                plan.highlighted
                  ? "relative rounded-3xl border border-nod-gold/30 bg-[#fcfcfd] p-10 shadow-[0_0_80px_rgba(232,185,49,0.08)] ring-1 ring-nod-gold/10 transition-transform duration-300 hover:-translate-y-5 dark:bg-[#0F0F11] lg:-translate-y-4"
                  : "landing-card-muted landing-border-soft relative rounded-3xl border p-10 transition-all duration-300 hover:border-black/15 hover:bg-black/[0.04] dark:hover:border-white/[0.1] dark:hover:bg-white/[0.03]"
              }
            >
              {plan.highlighted ? (
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-nod-gold/[0.08] via-transparent to-transparent pointer-events-none" />
              ) : null}
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-6 mb-10">
                  <div>
                    <h3 className="landing-text font-display text-2xl font-bold tracking-tight">
                      {plan.name}
                    </h3>
                    <p className="landing-text-subtle mt-2 text-[14px] font-medium">
                      {plan.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="landing-text font-display text-4xl font-bold tracking-tight">
                      {plan.price}
                    </div>
                  </div>
                </div>

                <div className="mb-8 h-px w-full bg-black/8 dark:bg-white/[0.06]" />

                <ul className="space-y-5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="landing-text-muted flex items-start gap-4 text-[15px]"
                    >
                      <span
                        className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full ${plan.highlighted ? "bg-nod-gold text-[#0A0A0B]" : "bg-black/10 text-black/80 dark:bg-white/10 dark:text-white/80"}`}
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span className="leading-relaxed font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-12 flex flex-wrap items-center gap-5">
                  <Link
                    href="/pricing"
                    className={
                      plan.highlighted
                        ? "w-full justify-center group inline-flex items-center gap-2 rounded-full bg-nod-gold px-6 py-4 text-[15px] font-bold text-[#0A0A0B] hover:bg-nod-gold/90 transition-all shadow-lg shadow-nod-gold/20 hover:shadow-xl hover:shadow-nod-gold/30"
                        : "landing-border-soft landing-card-muted w-full justify-center group inline-flex items-center gap-2 rounded-full border px-6 py-4 text-[15px] font-bold text-black/80 transition-all hover:border-black/15 hover:bg-black/[0.06] hover:text-black dark:text-white/80 dark:hover:border-white/15 dark:hover:bg-white/[0.06] dark:hover:text-white"
                    }
                  >
                    {t("cta")}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
                {plan.highlighted ? (
                  <p className="mt-4 text-center font-mono text-[11px] text-black/35 uppercase tracking-wide dark:text-white/30">
                    {t("note")}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
