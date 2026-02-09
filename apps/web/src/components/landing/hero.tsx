"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { CHROME_EXTENSION_INSTALL_URL } from "@/lib/chrome-extension";
import { Link } from "@/lib/i18n/routing";
import { NeuralGraph } from "./neural-graph";

export function LandingHero() {
  const t = useTranslations("landing.hero");

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[100dvh] flex items-center overflow-hidden ko-keep">
      {/* Background layers */}
      <div className="absolute inset-0 bg-nod-surface" />

      {/* Radial gradient glow behind hero */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full animate-glow-pulse"
        style={{
          background:
            "radial-gradient(circle, rgba(232,185,49,0.08) 0%, rgba(232,185,49,0.02) 40%, transparent 70%)",
        }}
      />

      {/* Neural graph canvas */}
      <div className="absolute inset-0 opacity-80 mix-blend-screen">
        <NeuralGraph />
      </div>

      {/* Grid lines - subtle */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl w-full px-6 lg:px-8 pt-32 pb-20">
        <div className="max-w-3xl">
          {/* Badge */}
          <div
            className="animate-fade-up inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-sm px-4 py-1.5 mb-8 hover:bg-white/[0.05] transition-colors cursor-default"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-nod-gold animate-glow-pulse shadow-[0_0_8px_rgba(232,185,49,0.5)]" />
            <span className="font-mono text-[11px] text-nod-gold/90 tracking-wider uppercase font-medium">
              {t("badge")}
            </span>
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-up font-display text-[clamp(2.75rem,6vw,5rem)] font-bold leading-[1.05] tracking-[-0.03em] text-white whitespace-pre-line drop-shadow-2xl"
            style={{ animationDelay: "0.2s" }}
          >
            {t("headline")}
          </h1>

          {/* Description */}
          <p
            className="animate-fade-up mt-8 max-w-xl text-[1.125rem] leading-relaxed text-white/70 font-light tracking-wide"
            style={{ animationDelay: "0.35s" }}
          >
            {t("description")}
          </p>

          {/* CTAs */}
          <div
            className="animate-fade-up mt-10 flex flex-wrap items-center gap-5"
            style={{ animationDelay: "0.5s" }}
          >
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-full bg-nod-gold px-7 py-3.5 text-[15px] font-semibold text-[#0A0A0B] hover:bg-nod-gold/90 transition-all hover:shadow-[0_0_24px_rgba(232,185,49,0.3)] hover:-translate-y-0.5"
            >
              {t("cta")}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href={CHROME_EXTENSION_INSTALL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3.5 text-[15px] font-medium text-white/70 hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all hover:-translate-y-0.5 backdrop-blur-sm"
            >
              Chrome에 추가
            </a>
            <button
              type="button"
              onClick={scrollToFeatures}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3.5 text-[15px] font-medium text-white/70 hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all hover:-translate-y-0.5 backdrop-blur-sm"
            >
              {t("ctaSecondary")}
            </button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        type="button"
        onClick={scrollToFeatures}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/35 hover:text-white/55 transition-colors animate-float"
      >
        <ChevronDown className="w-5 h-5" />
      </button>
    </section>
  );
}
