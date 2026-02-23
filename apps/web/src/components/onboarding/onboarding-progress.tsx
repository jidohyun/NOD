"use client";

import { useTranslations } from "next-intl";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  const t = useTranslations("onboarding");

  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;

        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                isActive
                  ? "bg-[#E8B931] scale-125"
                  : isCompleted
                    ? "bg-[#E8B931]/60"
                    : "bg-white/20"
              }`}
            />
            {step < totalSteps && (
              <div
                className={`h-px w-8 transition-colors duration-300 ${
                  isCompleted ? "bg-[#E8B931]/40" : "bg-white/10"
                }`}
              />
            )}
          </div>
        );
      })}
      <span className="ml-3 text-xs text-white/30">{t("progress", { step: currentStep })}</span>
    </div>
  );
}
