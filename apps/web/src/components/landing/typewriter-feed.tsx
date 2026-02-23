"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const TYPING_SPEED = 34;
const ERASE_SPEED = 20;
const HOLD_DURATION = 1300;

export function LandingTypewriterFeed() {
  const t = useTranslations("landing.typewriterFeed");
  const sectionRef = useRef<HTMLElement>(null);

  const lines = useMemo(() => [t("line1"), t("line2"), t("line3"), t("line4")], [t]);
  const [lineIndex, setLineIndex] = useState(0);
  const [renderedText, setRenderedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useGSAP(
    () => {
      gsap.from(sectionRef.current, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });
    },
    { scope: sectionRef }
  );

  useEffect(() => {
    const activeLine = lines[lineIndex] ?? "";
    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting && renderedText.length < activeLine.length) {
      timer = setTimeout(() => {
        setRenderedText(activeLine.slice(0, renderedText.length + 1));
      }, TYPING_SPEED);
    } else if (!isDeleting && renderedText.length === activeLine.length) {
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, HOLD_DURATION);
    } else if (isDeleting && renderedText.length > 0) {
      timer = setTimeout(() => {
        setRenderedText((prev) => prev.slice(0, -1));
      }, ERASE_SPEED);
    } else {
      timer = setTimeout(() => {
        setIsDeleting(false);
        setLineIndex((prev) => (prev + 1) % lines.length);
      }, 250);
    }

    return () => clearTimeout(timer);
  }, [isDeleting, lineIndex, lines, renderedText]);

  return (
    <section ref={sectionRef} className="landing-surface relative py-18 lg:py-24 ko-keep">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="rounded-[28px] border border-white/15 bg-white/[0.03] p-6 backdrop-blur-2xl lg:p-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/45">
              {t("label")}
            </p>
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.6)]" />
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#06070a]/70 p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febb2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </div>
            <p className="font-mono text-[13px] text-white/72">$ nod watch --live</p>
            <div className="mt-3 min-h-[2.4rem]">
              <p className="font-mono text-[13px] leading-relaxed text-nod-gold/95">
                {renderedText}
                <span className="ml-0.5 inline-block h-[1em] w-[0.6ch] animate-caret-blink bg-nod-gold align-middle" />
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
