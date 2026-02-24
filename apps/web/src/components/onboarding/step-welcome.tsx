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
          <h1 className="mt-2 font-creative-display text-4xl leading-tight font-black text-cm-text">
            {t("title")}
          </h1>
          <p className="mt-2 ko-keep text-base leading-relaxed text-cm-text/62">{t("subtitle")}</p>
        </div>

        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-nod-gold/35 bg-[#fff2c7]">
          <BookmarkCheck className="h-7 w-7 text-nod-gold-muted" />
        </div>
      </div>

      <div className="space-y-3">
        {features.map(({ icon: Icon, text }) => (
          <div key={text} className="cm-doodle-border flex items-center gap-3 bg-white px-5 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-nod-gold/30 bg-[#fff7dd]">
              <Icon className="h-4.5 w-4.5 text-nod-gold-muted" />
            </div>
            <span className="ko-keep text-sm font-semibold text-cm-text/78">{text}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onNext}
        className="cm-doodle-border mt-8 w-full bg-nod-gold px-6 py-3.5 text-sm font-black text-black transition-colors hover:bg-[#f0c958]"
      >
        {t("cta")}
      </button>
    </div>
  );
}
