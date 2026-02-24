"use client";

import { Chrome, Network, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { FloatingCircle } from "./decorations";

const featureKeys = ["aiSummary", "vectorSearch", "chromeExtension"] as const;

const featureIcons = {
  aiSummary: Sparkles,
  vectorSearch: Network,
  chromeExtension: Chrome,
};

const featureColors = {
  aiSummary: "bg-nod-gold/20",
  vectorSearch: "bg-cm-lavender",
  chromeExtension: "bg-cm-mint",
};

const featureIconColors = {
  aiSummary: "text-nod-gold",
  vectorSearch: "text-purple-500",
  chromeExtension: "text-teal-600",
};

const featureRotations = ["cm-askew-left", "", "cm-askew-right"];

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
      className="relative bg-cm-bg py-32 lg:py-40 ko-keep overflow-hidden"
    >
      {/* Decorations */}
      <FloatingCircle
        color="bg-cm-coral/20"
        size="w-10 h-10"
        className="absolute top-20 right-[10%]"
      />
      <FloatingCircle
        color="bg-cm-mint/40"
        size="w-6 h-6"
        className="absolute bottom-32 left-[5%]"
        reverse
      />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="max-w-2xl mb-20 text-center mx-auto">
          <div className="reveal">
            <span className="inline-block cm-doodle-border bg-nod-gold/10 px-4 py-1.5 font-creative-body text-xs font-bold text-nod-gold tracking-wider uppercase">
              {t("label")}
            </span>
          </div>
          <h2
            className="reveal mt-6 font-creative-display text-[clamp(2.25rem,4vw,3.5rem)] font-black leading-[1.1] tracking-tight text-cm-text"
            style={{ transitionDelay: "0.1s" }}
          >
            {t("headline")}
          </h2>
        </div>

        {/* Feature cards - 3 askew cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {featureKeys.map((key, i) => {
            const Icon = featureIcons[key];
            return (
              <div
                key={key}
                className={`reveal group ${featureRotations[i]} ${i === 1 ? "md:translate-y-12" : ""}`}
                style={{ transitionDelay: `${0.1 * i}s` }}
              >
                <div
                  className={`cm-doodle-border cm-sketch-shadow ${featureColors[key]} p-8 lg:p-10 transition-all duration-500 hover:-translate-y-2 hover:rotate-0`}
                >
                  {/* Icon */}
                  <div
                    className={`mb-6 inline-flex h-14 w-14 items-center justify-center cm-organic-shape bg-white/60 ${featureIconColors[key]}`}
                  >
                    <Icon className="w-7 h-7" strokeWidth={1.5} />
                  </div>

                  {/* Content */}
                  <h3 className="mb-3 font-creative-display text-xl font-bold tracking-tight text-cm-text">
                    {t(`items.${key}.title`)}
                  </h3>
                  <p className="font-creative-body text-[15px] leading-relaxed text-cm-text-light">
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
