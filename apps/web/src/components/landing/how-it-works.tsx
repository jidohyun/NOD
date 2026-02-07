"use client";

import { BookmarkPlus, Cpu, Lightbulb } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

const stepKeys = ["save", "analyze", "recall"] as const;

const stepIcons = {
  save: BookmarkPlus,
  analyze: Cpu,
  recall: Lightbulb,
};

export function LandingHowItWorks() {
  const t = useTranslations("landing.howItWorks");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    const elements = sectionRef.current?.querySelectorAll(".reveal");
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative bg-nod-surface-raised py-32 lg:py-40"
    >
      {/* Subtle top/bottom borders */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-nod-border to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-nod-border to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="max-w-2xl mb-24">
          <div className="reveal">
            <span className="font-mono text-[11px] text-nod-gold tracking-wider uppercase">
              {t("label")}
            </span>
          </div>
          <h2
            className="reveal mt-4 font-display text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.08] tracking-[-0.03em] text-white whitespace-pre-line"
            style={{ transitionDelay: "0.1s" }}
          >
            {t("headline")}
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-8">
          {stepKeys.map((key, i) => {
            const Icon = stepIcons[key];
            return (
              <div
                key={key}
                className="reveal relative"
                style={{ transitionDelay: `${0.1 * i}s` }}
              >
                {/* Connector line (desktop only) */}
                {i < stepKeys.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[calc(100%+0px)] w-full h-px">
                    <div className="h-full w-full bg-gradient-to-r from-nod-border via-nod-gold/20 to-nod-border" />
                  </div>
                )}

                {/* Step number */}
                <div className="flex items-center gap-4 mb-8">
                  <span className="font-mono text-[40px] font-light text-nod-gold/25 leading-none tracking-tighter">
                    {t(`steps.${key}.number`)}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-nod-gold/[0.08] border border-nod-gold/10 flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5 text-nod-gold" strokeWidth={1.5} />
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-display text-2xl font-semibold text-white mb-3 tracking-tight">
                  {t(`steps.${key}.title`)}
                </h3>
                <p className="text-[15px] leading-relaxed text-white/40 max-w-sm">
                  {t(`steps.${key}.description`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
