"use client";

import { BookmarkPlus, Cpu, Lightbulb } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { DoodleConnector, FloatingCircle } from "./decorations";

const stepKeys = ["save", "analyze", "recall"] as const;

const stepIcons = {
  save: BookmarkPlus,
  analyze: Cpu,
  recall: Lightbulb,
};

const stepColors = {
  save: "bg-cm-mint",
  analyze: "bg-cm-lavender",
  recall: "bg-nod-gold/20",
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
      className="relative bg-white py-32 lg:py-48 ko-keep overflow-hidden"
    >
      {/* Top dashed border */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px border-t-2 border-dashed border-cm-text/10" />

      {/* Decorations */}
      <FloatingCircle color="bg-nod-gold/20" size="w-8 h-8" className="absolute top-24 left-[8%]" />
      <FloatingCircle
        color="bg-cm-lavender/50"
        size="w-5 h-5"
        className="absolute bottom-20 right-[12%]"
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

        {/* Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-6 items-start">
          {stepKeys.map((key, i) => {
            const Icon = stepIcons[key];
            return (
              <div
                key={key}
                className="reveal relative group"
                style={{ transitionDelay: `${0.1 * i}s` }}
              >
                {/* Doodle connector (desktop only) */}
                {i < stepKeys.length - 1 && (
                  <div className="hidden lg:block absolute top-12 -right-3 w-6 z-10">
                    <DoodleConnector className="w-full h-5" />
                  </div>
                )}

                {/* Step number badge */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="cm-organic-shape bg-nod-gold flex h-14 w-14 items-center justify-center shadow-md">
                    <span className="font-creative-display text-2xl font-black text-white">
                      {t(`steps.${key}.number`)}
                    </span>
                  </div>
                  <div
                    className={`flex h-11 w-11 items-center justify-center cm-organic-shape ${stepColors[key]} transition-all duration-300 group-hover:scale-110`}
                  >
                    <Icon className="h-5 w-5 text-cm-text/70" strokeWidth={1.5} />
                  </div>
                </div>

                {/* Card content */}
                <div className="cm-doodle-border cm-sketch-shadow bg-white p-6 transition-all duration-300 group-hover:-translate-y-1">
                  <h3 className="mb-3 font-creative-display text-xl font-bold tracking-tight text-cm-text">
                    {t(`steps.${key}.title`)}
                  </h3>
                  <p className="font-creative-body text-[15px] leading-relaxed text-cm-text-light">
                    {t(`steps.${key}.description`)}
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
