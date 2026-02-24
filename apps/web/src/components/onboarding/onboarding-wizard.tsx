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

  const stepMeta = [
    { id: 1, title: t("welcome.title"), subtitle: t("welcome.subtitle") },
    { id: 2, title: t("install.title"), subtitle: t("install.subtitle") },
    {
      id: 3,
      title: t("firstArticle.title"),
      subtitle: t("firstArticle.subtitle"),
    },
  ] as const;

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
    <div className="relative min-h-screen overflow-hidden bg-cm-bg font-creative-body text-cm-text">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(196,154,28,0.24)_1px,_transparent_0)] bg-[size:24px_24px] opacity-45" />
      <div className="pointer-events-none absolute top-[-90px] right-[-120px] h-[280px] w-[280px] rounded-full bg-cm-mint/55 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-120px] left-[-90px] h-[280px] w-[280px] rounded-full bg-cm-lavender/60 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-8 pb-12 pt-8">
        <div className="mb-8 flex items-center justify-between">
          <Image
            src="/brand/nod-logo-light.png"
            alt="NOD"
            width={128}
            height={32}
            className="h-8 w-auto"
          />
          <button
            type="button"
            onClick={handleSkip}
            className="cm-doodle-border bg-white/90 px-4 py-2 text-xs font-bold tracking-wide text-cm-text transition-colors hover:bg-white"
          >
            {t("skip")}
          </button>
        </div>

        <div className="grid flex-1 grid-cols-[300px_1fr] gap-8">
          <aside className="cm-doodle-border cm-sketch-shadow bg-white/95 p-6">
            <p className="text-xs font-black tracking-[0.18em] text-cm-text/45">NOD ONBOARDING</p>
            <p className="mt-2 text-sm font-bold text-cm-text/60">
              {t("progress", { step: currentStep })}
            </p>

            <div className="mt-6 space-y-4">
              {stepMeta.map((step) => {
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;

                return (
                  <div
                    key={step.id}
                    className={`rounded-2xl border px-4 py-3 transition-all ${
                      isActive
                        ? "border-nod-gold/45 bg-[#fff7dd]"
                        : isCompleted
                          ? "border-emerald-300/70 bg-emerald-50/70"
                          : "border-cm-text/10 bg-white"
                    }`}
                  >
                    <p className="text-xs font-black text-cm-text/45">STEP {step.id}</p>
                    <p className="mt-1 text-sm font-black text-cm-text">{step.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-cm-text/55">{step.subtitle}</p>
                  </div>
                );
              })}
            </div>
          </aside>

          <section className="cm-doodle-border cm-sketch-shadow bg-white/95 p-8">
            <OnboardingProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />

            <div className="mt-8">
              {currentStep === 1 && <StepWelcome onNext={handleNext} />}
              {currentStep === 2 && (
                <StepInstallExtension onNext={handleNext} onSkip={handleSkip} />
              )}
              {currentStep === 3 && <StepFirstArticle onComplete={handleComplete} />}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
