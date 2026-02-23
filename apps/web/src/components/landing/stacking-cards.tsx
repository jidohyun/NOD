"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { useRef } from "react";

const cards = ["card1", "card2", "card3"] as const;

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function LandingStackingCards() {
  const t = useTranslations("landing.stackingCards");
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const stackCards = gsap.utils.toArray<HTMLElement>(".stacking-card");
      if (stackCards.length === 0) {
        return;
      }

      stackCards.forEach((card, index) => {
        gsap.set(card, {
          yPercent: index * 18,
          scale: 1 - index * 0.04,
          zIndex: stackCards.length - index,
        });
      });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=1800",
          pin: true,
          scrub: 0.6,
        },
      });

      stackCards.forEach((card, index) => {
        timeline.to(
          card,
          {
            yPercent: -38 * index,
            scale: 1 - index * 0.06,
            rotationX: index === 0 ? 0 : -2,
            ease: "none",
          },
          index * 0.22
        );
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="stacked-cards"
      className="landing-surface relative min-h-screen overflow-hidden py-20 ko-keep"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(232,185,49,0.18),transparent_62%)]" />
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-16 max-w-3xl">
          <p className="mb-5 inline-flex rounded-full border border-white/12 bg-white/[0.02] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-white/52">
            {t("label")}
          </p>
          <h2 className="font-display text-[clamp(2.15rem,4.6vw,4.3rem)] font-bold leading-[1.04] tracking-[-0.03em] text-white">
            {t("headline")}
          </h2>
        </div>

        <div className="relative h-[62vh] max-h-[680px] min-h-[440px]">
          {cards.map((cardKey, index) => (
            <article
              key={cardKey}
              className="stacking-card absolute inset-x-0 mx-auto flex h-full max-w-4xl flex-col justify-between rounded-[30px] border border-white/18 bg-white/[0.06] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl lg:p-10"
            >
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">
                  {t(`items.${cardKey}.kicker`)}
                </p>
                <h3 className="mt-4 font-display text-[clamp(1.4rem,2.6vw,2.2rem)] font-semibold text-white">
                  {t(`items.${cardKey}.title`)}
                </h3>
                <p className="mt-4 max-w-2xl text-[1rem] leading-relaxed text-white/72 lg:text-[1.06rem]">
                  {t(`items.${cardKey}.description`)}
                </p>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-3 text-sm text-white/68 sm:grid-cols-3">
                <div className="rounded-xl border border-white/12 bg-black/25 px-4 py-3 font-mono">
                  {t(`items.${cardKey}.metrics.first`)}
                </div>
                <div className="rounded-xl border border-white/12 bg-black/25 px-4 py-3 font-mono">
                  {t(`items.${cardKey}.metrics.second`)}
                </div>
                <div className="rounded-xl border border-white/12 bg-black/25 px-4 py-3 font-mono">
                  {t(`items.${cardKey}.metrics.third`)}
                </div>
              </div>
              {index === 0 ? (
                <span className="pointer-events-none absolute right-8 top-8 rounded-full border border-nod-gold/40 bg-nod-gold/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-nod-gold">
                  {t("pinLabel")}
                </span>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
