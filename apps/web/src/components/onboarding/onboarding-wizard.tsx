"use client";

import { CheckCircle2, PartyPopper, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { OnboardingProgress } from "./onboarding-progress";
import { StepFirstArticle } from "./step-first-article";
import { StepInstallExtension } from "./step-install-extension";
import { StepWelcome } from "./step-welcome";

const TOTAL_STEPS = 3;

function CompletionCelebration({ message, subtitle }: { message: string; subtitle: string }) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center text-center md:min-h-[400px]">
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-emerald-300/50 bg-emerald-50 animate-fade-up dark:bg-emerald-950/50 dark:border-emerald-700/50">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        </div>
        <div className="absolute -top-2 -right-2 animate-cm-float">
          <PartyPopper className="h-7 w-7 text-nod-gold" />
        </div>
        <div className="absolute -bottom-1 -left-3 animate-cm-float-reverse">
          <Sparkles className="h-5 w-5 text-cm-lavender" />
        </div>
      </div>
      <h2 className="mt-8 font-creative-display text-3xl font-black text-cm-text animate-fade-up [animation-delay:200ms]">
        {message}
      </h2>
      <p className="mt-3 text-base text-cm-text/60 animate-fade-up [animation-delay:400ms]">
        {subtitle}
      </p>
      <div className="mt-6 flex items-center gap-2 animate-fade-up [animation-delay:600ms]">
        <div className="h-1.5 w-1.5 rounded-full bg-nod-gold animate-bounce [animation-delay:0ms]" />
        <div className="h-1.5 w-1.5 rounded-full bg-nod-gold animate-bounce [animation-delay:150ms]" />
        <div className="h-1.5 w-1.5 rounded-full bg-nod-gold animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

export function OnboardingWizard() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleting, setIsCompleting] = useState(false);

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
    setIsCompleting(true);
    try {
      await fetch("/api/onboarding/complete", { method: "POST" });
    } catch {
      // Silently continue — user can still use the app
    }
  }, []);

  useEffect(() => {
    if (!isCompleting) return;
    const timer = setTimeout(() => router.push("/dashboard"), 2400);
    return () => clearTimeout(timer);
  }, [isCompleting, router]);

  const handleSkip = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-cm-bg font-creative-body text-cm-text dark:bg-cm-bg dark:text-cm-text">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(196,154,28,0.24)_1px,_transparent_0)] bg-[size:24px_24px] opacity-45 dark:opacity-15" />
      <div className="pointer-events-none absolute top-[-90px] right-[-120px] h-[280px] w-[280px] rounded-full bg-cm-mint/55 blur-3xl animate-cm-float dark:bg-nod-gold/10" />
      <div className="pointer-events-none absolute bottom-[-120px] left-[-90px] h-[280px] w-[280px] rounded-full bg-cm-lavender/60 blur-3xl animate-cm-float-reverse dark:bg-white/5" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-8 pb-12 pt-8">
        <div className="mb-8 flex items-center justify-between animate-fade-up">
          <Image
            src="/brand/nod-logo-light.png"
            alt="NOD"
            width={128}
            height={32}
            className="h-8 w-auto"
          />
          {!isCompleting && (
            <button
              type="button"
              onClick={handleSkip}
              className="cm-doodle-border bg-white/90 px-4 py-2 text-xs font-bold tracking-wide text-cm-text transition-all hover:bg-white hover:scale-[1.02] dark:bg-cm-surface/90 dark:hover:bg-cm-surface"
            >
              {t("skip")}
            </button>
          )}
        </div>

        <div className="grid flex-1 grid-cols-1 gap-8 md:grid-cols-[300px_1fr]">
          <aside className="cm-doodle-border cm-sketch-shadow bg-white/95 p-6 animate-fade-up [animation-delay:100ms] dark:bg-cm-surface/95">
            <p className="text-xs font-black tracking-[0.18em] text-cm-text/45">NOD ONBOARDING</p>
            <p className="mt-2 text-sm font-bold text-cm-text/60">
              {isCompleting
                ? t("progress", { step: TOTAL_STEPS })
                : t("progress", { step: currentStep })}
            </p>

            <div className="mt-6 space-y-4">
              {stepMeta.map((step) => {
                const isActive = !isCompleting && step.id === currentStep;
                const isCompleted = isCompleting || step.id < currentStep;

                return (
                  <div
                    key={step.id}
                    className={`rounded-2xl border px-4 py-3 transition-all duration-300 ${
                      isActive
                        ? "border-nod-gold/45 bg-[#fff7dd] scale-[1.02] dark:bg-nod-gold/10"
                        : isCompleted
                          ? "border-emerald-300/70 bg-emerald-50/70 dark:border-emerald-700/50 dark:bg-emerald-950/30"
                          : "border-cm-text/10 bg-white dark:bg-cm-surface"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-cm-text/45">STEP {step.id}</p>
                      {isCompleted ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm font-black text-cm-text">{step.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-cm-text/55">{step.subtitle}</p>
                  </div>
                );
              })}
            </div>
          </aside>

          <section className="cm-doodle-border cm-sketch-shadow bg-white/95 p-8 animate-fade-up [animation-delay:200ms] dark:bg-cm-surface/95">
            {!isCompleting && (
              <OnboardingProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />
            )}

            <div className={isCompleting ? "" : "mt-8"} key={isCompleting ? "done" : currentStep}>
              {isCompleting ? (
                <CompletionCelebration
                  message={t("completionTitle")}
                  subtitle={t("completionSubtitle")}
                />
              ) : (
                <div className="animate-fade-up">
                  {currentStep === 1 && <StepWelcome onNext={handleNext} />}
                  {currentStep === 2 && (
                    <StepInstallExtension onNext={handleNext} onSkip={handleNext} />
                  )}
                  {currentStep === 3 && <StepFirstArticle onComplete={handleComplete} />}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
