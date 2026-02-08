"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { NeuralGraph } from "./neural-graph";

export function LandingHero() {
  const t = useTranslations("landing.hero");

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[100dvh] flex items-center overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-nod-surface" />

      {/* Radial gradient glow behind hero */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full animate-glow-pulse"
        style={{
          background:
            "radial-gradient(circle, rgba(232,185,49,0.06) 0%, rgba(232,185,49,0.02) 40%, transparent 70%)",
        }}
      />

      {/* Neural graph canvas */}
      <div className="absolute inset-0">
        <NeuralGraph />
      </div>

      {/* Grid lines - subtle */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl w-full px-6 lg:px-8 pt-24 pb-16">
        <div className="max-w-3xl">
          {/* Badge */}
          <div
            className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-nod-gold/20 bg-nod-gold/[0.06] px-3.5 py-1 mb-8"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-nod-gold animate-glow-pulse" />
            <span className="font-mono text-[11px] text-nod-gold tracking-wider uppercase">
              {t("badge")}
            </span>
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-up font-display text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-[-0.03em] text-white whitespace-pre-line"
            style={{ animationDelay: "0.2s" }}
          >
            {t("headline")}
          </h1>

          {/* Description */}
          <p
            className="animate-fade-up mt-6 max-w-xl text-[17px] leading-relaxed text-white/45"
            style={{ animationDelay: "0.35s" }}
          >
            {t("description")}
          </p>

          {/* CTAs */}
          <div
            className="animate-fade-up mt-10 flex flex-wrap items-center gap-4"
            style={{ animationDelay: "0.5s" }}
          >
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-full bg-nod-gold px-6 py-3 text-[15px] font-medium text-[#0A0A0B] hover:bg-nod-gold/90 transition-all hover:shadow-[0_0_32px_rgba(232,185,49,0.3)]"
            >
              {t("cta")}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <button
              type="button"
              onClick={scrollToFeatures}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 text-[15px] text-white/60 hover:text-white/90 hover:bg-white/[0.06] hover:border-white/15 transition-all"
            >
              {t("ctaSecondary")}
            </button>
          </div>

          {/* Social proof line */}
          <div
            className="animate-fade-up mt-16 flex items-center gap-3"
            style={{ animationDelay: "0.65s" }}
          >
            {/* Stacked avatars (abstract circles) */}
            <div className="flex -space-x-2">
              {["bg-amber-500/60", "bg-emerald-500/60", "bg-sky-500/60", "bg-violet-500/60"].map(
                (bg, i) => (
                  <div
                    key={bg}
                    className={`w-7 h-7 rounded-full ${bg} border-2 border-[#0A0A0B] flex items-center justify-center`}
                  >
                    <span className="text-[9px] font-mono text-white/80 font-bold">
                      {["JK", "SM", "HY", "DW"][i]}
                    </span>
                  </div>
                )
              )}
            </div>
            <span className="text-[13px] text-white/30 font-mono">{t("trustedBy")}</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        type="button"
        onClick={scrollToFeatures}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/20 hover:text-white/40 transition-colors animate-float"
      >
        <ChevronDown className="w-5 h-5" />
      </button>
    </section>
  );
}
