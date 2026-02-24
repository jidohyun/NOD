"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { Link } from "@/lib/i18n/routing";
import { FloatingCircle, OrganicBlob } from "./decorations";

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
    <section ref={sectionRef} className="relative bg-cm-bg overflow-hidden py-32 lg:py-48 ko-keep">
      {/* Top dashed border */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px border-t-2 border-dashed border-cm-text/10" />

      {/* Background decorations */}
      <OrganicBlob color="bg-cm-mint/30" size="w-80 h-80" className="absolute -top-20 -right-20" />
      <OrganicBlob
        color="bg-cm-lavender/20"
        size="w-64 h-64"
        className="absolute -bottom-16 -left-16"
      />

      {/* Floating circles */}
      <FloatingCircle
        color="bg-nod-gold/25"
        size="w-6 h-6"
        className="absolute top-[20%] left-[10%]"
      />
      <FloatingCircle
        color="bg-cm-coral/20"
        size="w-4 h-4"
        className="absolute bottom-[30%] right-[15%]"
        reverse
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Organic container */}
        <div className="mx-auto max-w-3xl text-center cm-organic-shape border-4 border-dashed border-nod-gold/20 bg-white/60 backdrop-blur-sm py-16 px-8 lg:py-20 lg:px-12">
          <h2 className="reveal font-creative-display text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-[1.05] tracking-tight text-cm-text">
            {t("headline")}
          </h2>
          <p
            className="reveal mt-6 mx-auto max-w-lg font-creative-body text-lg leading-relaxed text-cm-text-light"
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
              className="group inline-flex items-center gap-2 cm-doodle-border bg-cm-text px-10 py-4 font-creative-display text-base font-black text-white transition-all hover:bg-nod-gold hover:-translate-y-1 hover:cm-sketch-shadow"
            >
              {t("button")}
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <span className="font-creative-body text-xs font-bold text-cm-text/35 uppercase tracking-wider">
              {t("note")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
