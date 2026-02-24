"use client";

import { useTranslations } from "next-intl";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  const t = useTranslations("onboarding");

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-cm-text/10 bg-cm-bg/75 px-4 py-3">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;

        return (
          <div key={step} className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-black transition-all ${
                isActive
                  ? "border-nod-gold bg-nod-gold text-black"
                  : isCompleted
                    ? "border-emerald-300 bg-emerald-100 text-emerald-800"
                    : "border-cm-text/20 bg-white text-cm-text/45"
              }`}
            >
              {step}
            </div>
            {step < totalSteps ? (
              <div
                className={`h-1 flex-1 rounded-full transition-colors ${
                  isCompleted ? "bg-emerald-300/80" : "bg-cm-text/10"
                }`}
              />
            ) : null}
          </div>
        );
      })}
      <span className="shrink-0 rounded-full border border-cm-text/15 bg-white px-3 py-1 text-xs font-black text-cm-text/60">
        {t("progress", { step: currentStep })}
      </span>
    </div>
  );
}
