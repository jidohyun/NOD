"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { OnboardingProgress } from "./onboarding-progress";
import { StepFirstArticle } from "./step-first-article";
import { StepInstallExtension } from "./step-install-extension";
import { StepWelcome } from "./step-welcome";

const TOTAL_STEPS = 3;

export function OnboardingWizard() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  const handleNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(async () => {
    try {
      await fetch("/api/onboarding/complete", { method: "POST" });
    } catch {
      // Silently continue — user can still use the app
    }
    router.push("/dashboard");
  }, [router]);

  const handleSkip = useCallback(async () => {
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-6">
        <Image src="/brand/nod-logo.png" alt="NOD" width={120} height={30} className="h-7 w-auto" />
        <button
          type="button"
          onClick={handleSkip}
          className="text-sm text-white/40 transition-colors hover:text-white/70"
        >
          {t("skip")}
        </button>
      </div>

      {/* Progress */}
      <div className="mb-10">
        <OnboardingProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />
      </div>

      {/* Step Content */}
      <div className="w-full max-w-lg">
        {currentStep === 1 && <StepWelcome onNext={handleNext} />}
        {currentStep === 2 && <StepInstallExtension onNext={handleNext} onSkip={handleSkip} />}
        {currentStep === 3 && <StepFirstArticle onComplete={handleComplete} />}
      </div>
    </div>
  );
}
