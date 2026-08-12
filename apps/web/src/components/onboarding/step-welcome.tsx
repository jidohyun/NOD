"use client";

import { BookmarkCheck, Brain, Search } from "lucide-react";
import { useTranslations } from "next-intl";

interface StepWelcomeProps {
  onNext: () => void;
}

export function StepWelcome({ onNext }: StepWelcomeProps) {
  const t = useTranslations("onboarding.welcome");

  const features = [
    { icon: BookmarkCheck, text: t("featureSave") },
    { icon: Brain, text: t("featureAnalyze") },
    { icon: Search, text: t("featureSearch") },
  ] as const;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black tracking-[0.16em] text-cm-text/45">STEP 1</p>
          <h1 className="mt-2 font-creative-display text-2xl leading-tight font-black text-cm-text sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 ko-keep text-base leading-relaxed text-cm-text/62">{t("subtitle")}</p>
        </div>

        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-nod-gold/35 bg-[#fff2c7] dark:bg-nod-gold/15 dark:border-nod-gold/25">
          <BookmarkCheck className="h-7 w-7 text-nod-gold-muted" />
        </div>
      </div>

      <div className="space-y-3">
        {features.map(({ icon: Icon, text }, i) => (
          <div
            key={text}
            className="cm-doodle-border flex items-center gap-3 bg-white px-5 py-4 transition-all duration-200 hover:scale-[1.01] hover:bg-[#fffdf5] animate-fade-up dark:bg-cm-surface dark:hover:bg-cm-surface-raised"
            style={{ animationDelay: `${(i + 1) * 120}ms` }}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-nod-gold/30 bg-[#fff7dd] dark:bg-nod-gold/10 dark:border-nod-gold/20">
              <Icon className="h-4.5 w-4.5 text-nod-gold-muted" />
            </div>
            <span className="ko-keep text-sm font-semibold text-cm-text/78">{text}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onNext}
        className="cm-doodle-border mt-8 w-full bg-nod-gold px-6 py-3.5 text-sm font-black text-black transition-all hover:bg-[#f0c958] hover:scale-[1.01] animate-fade-up [animation-delay:500ms]"
      >
        {t("cta")}
      </button>
    </div>
  );
}
