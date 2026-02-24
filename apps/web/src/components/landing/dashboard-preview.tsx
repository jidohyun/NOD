"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { FloatingCircle, StickyNote } from "./decorations";

export function DashboardPreview() {
  const sectionRef = useRef<HTMLElement>(null);
  const t = useTranslations("landing.dashboardPreview");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        }
      },
      { threshold: 0.1 }
    );

    const elements = sectionRef.current?.querySelectorAll(".reveal");
    elements?.forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-cm-bg overflow-hidden py-24 lg:py-32">
      {/* Decorations */}
      <FloatingCircle color="bg-nod-gold/20" size="w-8 h-8" className="absolute top-16 left-[6%]" />
      <FloatingCircle
        color="bg-cm-coral/25"
        size="w-5 h-5"
        className="absolute bottom-20 right-[8%]"
        reverse
      />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="reveal relative">
          {/* Doodle frame wrapper */}
          <div className="cm-doodle-border cm-sketch-shadow cm-askew-right bg-white p-4 transition-transform duration-500 hover:rotate-0">
            {/* Inner frame */}
            <div className="cm-doodle-border overflow-hidden bg-cm-bg/50">
              {/* Top bar */}
              <div className="flex items-center gap-3 border-b-2 border-dashed border-cm-text/10 px-5 py-3">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-cm-coral/60" />
                  <div className="w-3 h-3 rounded-full bg-nod-gold/60" />
                  <div className="w-3 h-3 rounded-full bg-cm-mint/80" />
                </div>
                <div className="flex-1 flex justify-center px-4">
                  <div className="flex w-full max-w-md items-center gap-2 cm-doodle-border bg-white/80 px-4 py-1.5">
                    <div className="w-2 h-2 cm-organic-shape bg-emerald-400" />
                    <span className="font-creative-body text-xs font-semibold text-cm-text/40">
                      app.nod.dev/articles
                    </span>
                  </div>
                </div>
              </div>

              {/* Dashboard mockup content */}
              <div className="min-h-[400px] bg-white p-6 lg:min-h-[500px] lg:p-10">
                {/* Top bar */}
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 overflow-hidden cm-organic-shape border border-nod-gold/20 shadow-md">
                      <Image
                        src="/brand/nod-icon.png"
                        alt="NOD icon"
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-creative-body text-xs font-bold text-cm-text">
                        {t("savedReads")}
                      </span>
                      <span className="font-creative-body text-[10px] font-semibold text-cm-text-light">
                        {t("itemCount", { count: 42 })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-44 items-center gap-2 cm-doodle-border bg-cm-bg/80 px-3">
                      <div className="h-1.5 w-1.5 cm-organic-shape bg-cm-text/30" />
                      <span className="font-creative-body text-xs text-cm-text/40">
                        {t("searchPlaceholder")}
                      </span>
                    </div>
                    <div className="h-9 w-9 cm-organic-shape bg-nod-gold/15 border border-nod-gold/25 flex items-center justify-center">
                      <span className="text-[10px] font-creative-display font-bold text-nod-gold">
                        MP
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {[
                    {
                      titleKey: "0" as const,
                      status: "completed",
                      concepts: ["React", "RSC", "Streaming"],
                      cardColor: "bg-nod-gold/5",
                    },
                    {
                      titleKey: "1" as const,
                      status: "completed",
                      concepts: ["pgvector", "Embeddings", "Cosine"],
                      cardColor: "bg-cm-lavender/30",
                    },
                    {
                      titleKey: "2" as const,
                      status: "analyzing",
                      concepts: ["Python", "ASGI"],
                      cardColor: "bg-cm-mint/30",
                    },
                  ].map((article) => (
                    <div
                      key={article.titleKey}
                      className={`cm-doodle-border ${article.cardColor} p-5 transition-all duration-300 hover:-translate-y-1 hover:cm-sketch-shadow`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className={`w-2 h-2 cm-organic-shape ${
                            article.status === "completed"
                              ? "bg-emerald-400"
                              : "bg-nod-gold animate-pulse"
                          }`}
                        />
                        <span className="font-creative-body text-[10px] font-bold tracking-wider text-cm-text/50 uppercase">
                          {article.status === "completed"
                            ? t("statusCompleted")
                            : t("statusAnalyzing")}
                        </span>
                      </div>
                      <h4 className="mb-2 font-creative-display text-sm font-bold text-cm-text">
                        {t(`articles.${article.titleKey}.title`)}
                      </h4>
                      <p className="mb-4 line-clamp-3 font-creative-body text-xs leading-relaxed text-cm-text-light">
                        {t(`articles.${article.titleKey}.summary`)}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {article.concepts.map((concept) => (
                          <span
                            key={concept}
                            className="inline-block cm-doodle-border bg-white/80 px-2.5 py-1 font-creative-body text-[10px] font-bold text-nod-gold/80"
                          >
                            {concept}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Similar articles */}
                <div className="mt-8 cm-doodle-border bg-cm-lavender/10 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-5 h-5 cm-organic-shape bg-purple-200 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 cm-organic-shape bg-purple-400" />
                    </div>
                    <span className="font-creative-body text-xs font-bold tracking-wider text-cm-text/50 uppercase">
                      {t("similarReads")}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="group/item flex cursor-pointer items-center gap-3 cm-doodle-border bg-white/70 px-4 py-3 transition-all hover:bg-white hover:cm-sketch-shadow"
                      >
                        <div className="w-1 h-7 rounded-full bg-purple-300 group-hover/item:bg-purple-400 transition-colors" />
                        <span className="font-creative-body text-xs font-semibold text-cm-text/60 group-hover/item:text-cm-text transition-colors">
                          {t(`similar.${i}`)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky note decoration */}
          <StickyNote
            color="bg-nod-gold/15"
            rotate="-rotate-3"
            className="absolute -top-4 -left-4 hidden lg:block"
          >
            Dashboard
          </StickyNote>
        </div>
      </div>
    </section>
  );
}
