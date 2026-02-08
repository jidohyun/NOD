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
    <section ref={sectionRef} id="features" className="relative bg-nod-surface py-32 lg:py-40">
      {/* Top fade from hero */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-nod-surface to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header — left-aligned editorial style */}
        <div className="max-w-2xl mb-20">
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

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-nod-border/40 rounded-2xl overflow-hidden border border-nod-border/40">
          {featureKeys.map((key, i) => {
            const Icon = featureIcons[key];
            return (
              <div
                key={key}
                className="reveal group relative bg-nod-surface p-8 lg:p-10 hover:bg-nod-surface-raised transition-colors duration-500"
                style={{ transitionDelay: `${0.05 * i}s` }}
              >
                {/* Hover gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${featureAccents[key]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                <div className="relative">
                  <div className={`${featureIconColors[key]} mb-6`}>
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-white mb-3 tracking-tight">
                    {t(`items.${key}.title`)}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-white/40 group-hover:text-white/55 transition-colors">
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
