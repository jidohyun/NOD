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
      className="relative bg-[#0A0A0B] py-32 lg:py-48 ko-keep"
    >
      {/* Subtle top/bottom borders */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="max-w-2xl mb-24">
          <div className="reveal">
            <span className="inline-block py-1 px-2 rounded bg-white/[0.03] border border-white/[0.06] font-mono text-[11px] text-nod-gold tracking-wider uppercase font-medium">
              {t("label")}
            </span>
          </div>
          <h2
            className="reveal mt-6 font-display text-[clamp(2.25rem,4vw,4rem)] font-bold leading-[1.08] tracking-[-0.03em] text-white whitespace-pre-line"
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
                    <div className="h-full w-full bg-gradient-to-r from-white/5 via-nod-gold/20 to-white/5" />
                  </div>
                )}

                {/* Step number */}
                <div className="flex items-center gap-6 mb-10">
                  <span className="font-display text-[48px] font-bold text-white/5 group-hover:text-nod-gold/10 transition-colors leading-none tracking-tighter">
                    {t(`steps.${key}.number`)}
                  </span>
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center group-hover:border-nod-gold/20 group-hover:bg-nod-gold/[0.05] transition-all duration-300 shadow-xl shadow-black/20">
                    <Icon
                      className="w-5 h-5 text-white/80 group-hover:text-nod-gold transition-colors"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-display text-2xl font-bold text-white mb-4 tracking-tight">
                  {t(`steps.${key}.title`)}
                </h3>
                <p className="text-[1.0625rem] leading-relaxed text-white/50 max-w-sm group-hover:text-white/70 transition-colors">
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
