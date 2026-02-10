"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Link } from "@/lib/i18n/routing";

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
    elements?.forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="landing-surface relative overflow-hidden py-32 lg:py-48 ko-keep"
    >
      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black/15 to-transparent dark:via-white/10" />

      {/* Background radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] animate-glow-pulse"
        style={{
          background: "radial-gradient(circle, rgba(232,185,49,0.08) 0%, transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="reveal landing-text font-display text-[clamp(2.5rem,5vw,4rem)] font-bold leading-[1.05] tracking-[-0.03em] whitespace-pre-line drop-shadow-xl">
            {t("headline")}
          </h2>
          <p
            className="reveal landing-text-muted mt-8 text-[1.125rem] leading-relaxed font-light"
            style={{ transitionDelay: "0.1s" }}
          >
            {t("description")}
          </p>
          <div
            className="reveal mt-12 flex flex-col items-center gap-5"
            style={{ transitionDelay: "0.2s" }}
          >
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-full bg-nod-gold px-10 py-4 text-[16px] font-bold text-[#0A0A0B] hover:bg-nod-gold/90 transition-all hover:shadow-[0_0_40px_rgba(232,185,49,0.4)] hover:-translate-y-0.5"
            >
              {t("button")}
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <span className="font-mono text-[12px] tracking-wide text-black/35 uppercase dark:text-white/30">
              {t("note")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
