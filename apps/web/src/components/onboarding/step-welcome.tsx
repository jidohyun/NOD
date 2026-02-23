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
    <div className="text-center">
      {/* Icon */}
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8B931]/10">
        <BookmarkCheck className="h-8 w-8 text-[#E8B931]" />
      </div>

      {/* Title */}
      <h1 className="font-display text-3xl font-bold text-white">{t("title")}</h1>
      <p className="mt-2 text-white/50">{t("subtitle")}</p>

      {/* Features */}
      <div className="mt-8 space-y-3">
        {features.map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-left"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E8B931]/10">
              <Icon className="h-4.5 w-4.5 text-[#E8B931]" />
            </div>
            <span className="text-sm text-white/80">{text}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onNext}
        className="mt-8 w-full rounded-xl bg-[#E8B931] px-6 py-3.5 text-sm font-semibold text-[#0A0A0B] transition-all hover:bg-[#E8B931]/90 active:scale-[0.98]"
      >
        {t("cta")}
      </button>
    </div>
  );
}
