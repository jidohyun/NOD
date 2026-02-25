"use client";

import { useTranslations } from "next-intl";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  const t = useTranslations("onboarding");

  const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="rounded-2xl border border-cm-text/10 bg-cm-bg/75 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const isActive = step === currentStep;
          const isCompleted = step < currentStep;

          return (
            <div key={step} className="flex min-w-0 flex-1 items-center gap-3">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-black transition-all duration-300 ${
                  isActive
                    ? "border-nod-gold bg-nod-gold text-black scale-110"
                    : isCompleted
                      ? "border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                      : "border-cm-text/20 bg-white text-cm-text/45 dark:bg-cm-surface"
                }`}
              >
                {isCompleted ? "✓" : <span>{step}</span>}
              </div>
              {step < totalSteps ? (
                <div className="h-1 flex-1 rounded-full bg-cm-text/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-nod-gold to-emerald-400 transition-all duration-500 ease-out"
                    style={{ width: isCompleted ? "100%" : "0%" }}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
        <span className="shrink-0 rounded-full border border-cm-text/15 bg-white px-3 py-1 text-xs font-black text-cm-text/60 dark:bg-cm-surface">
          {t("progress", { step: currentStep })}
        </span>
      </div>
      <div className="mt-2.5 h-0.5 rounded-full bg-cm-text/5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-nod-gold via-[#f0c958] to-emerald-400 transition-all duration-700 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
