"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

export function LandingCta() {
  const t = useTranslations("landing.cta");
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
      { threshold: 0.2 }
    );

    const elements = sectionRef.current?.querySelectorAll(".reveal");
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative bg-nod-surface py-32 lg:py-40 overflow-hidden">
      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-nod-border to-transparent" />

      {/* Background radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] animate-glow-pulse"
        style={{
          background:
            "radial-gradient(circle, rgba(232,185,49,0.05) 0%, transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className="reveal font-display text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.08] tracking-[-0.03em] text-white whitespace-pre-line"
          >
            {t("headline")}
          </h2>
          <p
            className="reveal mt-6 text-[17px] leading-relaxed text-white/40"
            style={{ transitionDelay: "0.1s" }}
          >
            {t("description")}
          </p>
          <div
            className="reveal mt-10 flex flex-col items-center gap-4"
            style={{ transitionDelay: "0.2s" }}
          >
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-full bg-nod-gold px-8 py-3.5 text-[15px] font-medium text-[#0A0A0B] hover:bg-nod-gold/90 transition-all hover:shadow-[0_0_40px_rgba(232,185,49,0.3)]"
            >
              {t("button")}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <span className="font-mono text-[12px] text-white/20 tracking-wide">
              {t("note")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
