"use client";

import { Brain, Chrome, Globe, Network, Sparkles, Tags } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

const featureKeys = [
  "aiSummary",
  "vectorSearch",
  "chromeExtension",
  "multiPlatform",
  "concepts",
  "multilingual",
] as const;

const featureIcons = {
  aiSummary: Sparkles,
  vectorSearch: Network,
  chromeExtension: Chrome,
  multiPlatform: Globe,
  concepts: Tags,
  multilingual: Brain,
};

const featureAccents = {
  aiSummary: "from-amber-400/20 to-orange-500/20",
  vectorSearch: "from-violet-400/20 to-indigo-500/20",
  chromeExtension: "from-sky-400/20 to-blue-500/20",
  multiPlatform: "from-emerald-400/20 to-teal-500/20",
  concepts: "from-rose-400/20 to-pink-500/20",
  multilingual: "from-amber-400/20 to-yellow-500/20",
};

const featureIconColors = {
  aiSummary: "text-amber-400",
  vectorSearch: "text-violet-400",
  chromeExtension: "text-sky-400",
  multiPlatform: "text-emerald-400",
  concepts: "text-rose-400",
  multilingual: "text-amber-300",
};

export function LandingFeatures() {
  const t = useTranslations("landing.features");
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
      id="features"
      className="landing-surface relative py-32 lg:py-40 ko-keep"
    >
      {/* Top fade from hero */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[var(--landing-top-fade)] to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header — left-aligned editorial style */}
        <div className="max-w-2xl mb-24">
          <div className="reveal">
            <span className="inline-block rounded border border-nod-gold/10 bg-nod-gold/5 px-2 py-1 font-mono text-[11px] font-medium text-nod-gold tracking-wider uppercase">
              {t("label")}
            </span>
          </div>
          <h2
            className="reveal landing-text mt-6 font-display text-[clamp(2.25rem,4vw,4rem)] font-bold leading-[1.05] tracking-[-0.03em] whitespace-pre-line"
            style={{ transitionDelay: "0.1s" }}
          >
            {t("headline")}
          </h2>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureKeys.map((key, i) => {
            const Icon = featureIcons[key];
            return (
              <div
                key={key}
                className="reveal landing-card-muted landing-border-soft group relative overflow-hidden rounded-3xl border p-8 transition-all duration-500 hover:-translate-y-1 hover:border-black/15 hover:bg-black/[0.05] hover:shadow-2xl hover:shadow-black/15 dark:hover:border-white/[0.12] dark:hover:bg-white/[0.05] dark:hover:shadow-black/50 lg:p-10"
                style={{ transitionDelay: `${0.05 * i}s` }}
              >
                {/* Hover gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${featureAccents[key]} opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl`}
                />

                <div className="relative z-10">
                  <div
                    className={`mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 bg-black/5 transition-colors group-hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:group-hover:bg-white/10 ${featureIconColors[key]}`}
                  >
                    <Icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <h3 className="landing-text mb-4 font-display text-xl font-semibold tracking-tight transition-colors group-hover:text-black dark:group-hover:text-white">
                    {t(`items.${key}.title`)}
                  </h3>
                  <p className="landing-text-subtle text-[15px] leading-relaxed transition-colors group-hover:text-black/70 dark:group-hover:text-white/70">
                    {t(`items.${key}.description`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
