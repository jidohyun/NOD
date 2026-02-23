"use client";

import { FileText, MousePointer2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

interface StepFirstArticleProps {
  onComplete: () => void;
}

export function StepFirstArticle({ onComplete }: StepFirstArticleProps) {
  const t = useTranslations("onboarding.firstArticle");

  const steps = [
    { number: 1, icon: FileText, text: t("step1") },
    { number: 2, icon: MousePointer2, text: t("step2") },
    { number: 3, icon: Sparkles, text: t("step3") },
  ] as const;

  return (
    <div className="text-center">
      {/* Icon */}
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8B931]/10">
        <Sparkles className="h-8 w-8 text-[#E8B931]" />
      </div>

      {/* Title */}
      <h1 className="font-display text-3xl font-bold text-white">{t("title")}</h1>
      <p className="mt-2 text-white/50">{t("subtitle")}</p>

      {/* Steps */}
      <div className="mt-8 space-y-3">
        {steps.map(({ number, icon: Icon, text }) => (
          <div
            key={number}
            className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-left"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8B931]/10 text-sm font-bold text-[#E8B931]">
              {number}
            </div>
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-white/40" />
              <span className="text-sm text-white/80">{text}</span>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={onComplete}
        className="mt-8 w-full rounded-xl bg-[#E8B931] px-6 py-3.5 text-sm font-semibold text-[#0A0A0B] transition-all hover:bg-[#E8B931]/90 active:scale-[0.98]"
      >
        {t("cta")}
      </button>
    </div>
  );
}
