"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRef } from "react";
import { getChromeExtensionInstallUrl } from "@/lib/chrome-extension";
import { Link } from "@/lib/i18n/routing";
import { FloatingCircle, OrganicBlob } from "./decorations";

gsap.registerPlugin(useGSAP);

export function LandingHero() {
  const locale = useLocale();
  const t = useTranslations("landing.hero");
  const extensionInstallUrl = getChromeExtensionInstallUrl(locale);
  const sectionRef = useRef<HTMLElement>(null);
  const headline = t("headline");

  const renderHeadline = () => {
    if (locale === "ko" && headline.includes(",")) {
      const [firstLine, ...rest] = headline.split(",");
      const secondLine = rest.join(",").trim();
      return (
        <>
          <span className="block">{`${firstLine},`}</span>
          <span className="block">{secondLine}</span>
        </>
      );
    }

    return headline;
  };

  useGSAP(
    () => {
      const timeline = gsap.timeline({ defaults: { ease: "power4.out" } });

      timeline
        .from("[data-hero-badge]", { y: 30, opacity: 0, duration: 1.2 })
        .from("[data-hero-headline]", { y: 40, opacity: 0, duration: 1.4 }, "-=0.9")
        .from("[data-hero-description]", { y: 30, opacity: 0, duration: 1.2 }, "-=1.0")
        .from("[data-hero-actions]", { y: 25, opacity: 0, duration: 1.0 }, "-=0.9")
        .from("[data-hero-decor]", { scale: 0, opacity: 0, duration: 1.0, stagger: 0.15 }, "-=1.2");
    },
    { scope: sectionRef }
  );

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[100dvh] items-center overflow-hidden bg-cm-bg ko-keep"
    >
      {/* Organic blob decorations */}
      <OrganicBlob color="bg-cm-mint" size="w-96 h-96" className="absolute -top-20 -left-32" />
      <OrganicBlob color="bg-nod-gold/20" size="w-80 h-80" className="absolute top-1/3 -right-24" />
      <OrganicBlob
        color="bg-cm-lavender"
        size="w-72 h-72"
        className="absolute -bottom-16 left-1/4"
      />

      {/* Floating decorations */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <FloatingCircle
          color="bg-nod-gold/25"
          size="w-6 h-6"
          className="absolute top-[15%] right-[12%]"
          data-hero-decor
        />
        <FloatingCircle
          color="bg-cm-coral/30"
          size="w-4 h-4"
          className="absolute top-[35%] right-[25%]"
          reverse
          data-hero-decor
        />
        <FloatingCircle
          color="bg-cm-mint/50"
          size="w-5 h-5"
          className="absolute bottom-[25%] left-[8%]"
          data-hero-decor
        />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl w-full px-6 lg:px-8 pt-32 pb-20">
        <div className="grid grid-cols-1 items-center">
          {/* Text content */}
          <div className="max-w-4xl">
            {/* Badge */}
            <div
              className="mb-8 inline-flex items-center gap-2.5 cm-doodle-border bg-white/80 px-4 py-2 backdrop-blur-sm"
              data-hero-badge
            >
              <div className="w-2 h-2 cm-organic-shape bg-nod-gold animate-cm-wiggle" />
              <span className="font-creative-body text-xs font-bold text-nod-gold tracking-wider uppercase">
                {t("badge")}
              </span>
            </div>

            {/* Headline */}
            <h1
              className="font-creative-display text-[clamp(3rem,7vw,5.5rem)] font-black leading-[1.05] tracking-tight text-cm-text"
              data-hero-headline
            >
              <span className="relative inline-block">{renderHeadline()}</span>
            </h1>

            {/* Description */}
            <p
              className="mt-8 max-w-xl font-creative-body text-lg leading-relaxed text-cm-text-light"
              data-hero-description
            >
              {t("description")}
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center gap-4" data-hero-actions>
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 cm-doodle-border bg-nod-gold px-8 py-4 font-creative-display text-base font-black text-white transition-all hover:cm-sketch-shadow hover:-translate-y-1"
              >
                {t("cta")}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href={extensionInstallUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-[2rem] border-2 border-cm-text/10 bg-white px-6 py-4 font-creative-body text-base font-bold text-cm-text transition-all hover:border-cm-text/20 hover:-translate-y-0.5"
              >
                {t("ctaExtension")}
              </a>
              <button
                type="button"
                onClick={scrollToFeatures}
                className="inline-flex items-center gap-2 rounded-[2rem] border-2 border-transparent px-2 py-3 font-creative-body text-sm font-semibold text-cm-text/60 transition-colors hover:text-cm-text"
              >
                {t("ctaSecondary")}
              </button>
            </div>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 backdrop-blur-sm">
              <span className="h-2 w-2 cm-organic-shape bg-emerald-500" />
              <span className="font-creative-body text-xs font-semibold text-cm-text/60">
                {t("trustedBy")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        type="button"
        onClick={scrollToFeatures}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-cm-float text-cm-text/40 transition-colors hover:text-cm-text/70"
      >
        <ChevronDown className="w-5 h-5" />
      </button>
    </section>
  );
}
