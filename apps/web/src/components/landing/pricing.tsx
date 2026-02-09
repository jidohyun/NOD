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
    <section id="pricing" className="relative bg-nod-surface py-32 lg:py-40 ko-keep">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl mb-24">
          <span className="inline-block py-1 px-2 rounded bg-white/[0.03] border border-white/[0.06] font-mono text-[11px] text-nod-gold tracking-wider uppercase font-medium">
            {t("label")}
          </span>
          <h2 className="mt-6 font-display text-[clamp(2.25rem,4vw,4rem)] font-bold leading-[1.08] tracking-[-0.03em] text-white whitespace-pre-line">
            {t("headline")}
          </h2>
          <p className="mt-6 text-[1.125rem] leading-relaxed text-white/60 font-light max-w-xl">
            {t("description")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={
                plan.highlighted
                  ? "relative rounded-3xl border border-nod-gold/30 bg-[#0F0F11] p-10 shadow-[0_0_80px_rgba(232,185,49,0.08)] ring-1 ring-nod-gold/10 transform lg:-translate-y-4 transition-transform hover:-translate-y-5 duration-300"
                  : "relative rounded-3xl border border-white/[0.06] bg-white/[0.02] p-10 hover:border-white/[0.1] hover:bg-white/[0.03] transition-all duration-300"
              }
            >
              {plan.highlighted ? (
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-nod-gold/[0.08] via-transparent to-transparent pointer-events-none" />
              ) : null}
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-6 mb-10">
                  <div>
                    <h3 className="font-display text-2xl font-bold text-white tracking-tight">
                      {plan.name}
                    </h3>
                    <p className="mt-2 text-[14px] text-white/50 font-medium">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-white font-display tracking-tight">
                      {plan.price}
                    </div>
                  </div>
                </div>

                <div className="h-px w-full bg-white/[0.06] mb-8" />

                <ul className="space-y-5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-4 text-[15px] text-white/70">
                      <span
                        className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full ${plan.highlighted ? "bg-nod-gold text-[#0A0A0B]" : "bg-white/10 text-white/80"}`}
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
                        : "w-full justify-center group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-4 text-[15px] font-bold text-white/80 hover:text-white hover:bg-white/[0.06] hover:border-white/15 transition-all"
                    }
                  >
                    {t("cta")}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
                {plan.highlighted ? (
                  <p className="mt-4 text-center font-mono text-[11px] text-white/30 uppercase tracking-wide">
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
