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
    elements?.forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="landing-surface relative py-32 lg:py-48 ko-keep"
    >
      {/* Subtle top/bottom borders */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black/15 to-transparent dark:via-white/10" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black/15 to-transparent dark:via-white/10" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="max-w-2xl mb-24">
          <div className="reveal">
            <span className="inline-block rounded border border-black/10 bg-black/[0.03] px-2 py-1 font-mono text-[11px] font-medium text-nod-gold tracking-wider uppercase dark:border-white/[0.06] dark:bg-white/[0.03]">
              {t("label")}
            </span>
          </div>
          <h2
            className="reveal landing-text mt-6 font-display text-[clamp(2.25rem,4vw,4rem)] font-bold leading-[1.08] tracking-[-0.03em] whitespace-pre-line"
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
                className="reveal relative group"
                style={{ transitionDelay: `${0.1 * i}s` }}
              >
                {/* Connector line (desktop only) */}
                {i < stepKeys.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-full w-8 h-px opacity-50 pointer-events-none">
                    <div className="h-full w-full bg-gradient-to-r from-black/8 via-nod-gold/20 to-black/8 dark:from-white/5 dark:to-white/5" />
                  </div>
                )}

                {/* Step number */}
                <div className="flex items-center gap-6 mb-10">
                  <span className="font-display text-[48px] font-bold text-black/6 transition-colors leading-none tracking-tighter group-hover:text-nod-gold/15 dark:text-white/5 dark:group-hover:text-nod-gold/10">
                    {t(`steps.${key}.number`)}
                  </span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 bg-black/[0.03] shadow-xl shadow-black/10 transition-all duration-300 group-hover:border-nod-gold/20 group-hover:bg-nod-gold/[0.05] dark:border-white/[0.08] dark:bg-white/[0.03] dark:shadow-black/20">
                    <Icon
                      className="h-5 w-5 text-black/80 transition-colors group-hover:text-nod-gold dark:text-white/80"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>

                {/* Content */}
                <h3 className="landing-text mb-4 font-display text-2xl font-bold tracking-tight">
                  {t(`steps.${key}.title`)}
                </h3>
                <p className="landing-text-subtle max-w-sm text-[1.0625rem] leading-relaxed transition-colors group-hover:text-black/72 dark:group-hover:text-white/70">
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
