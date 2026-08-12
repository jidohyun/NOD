"use client";

import { Download, Globe, MousePointerClick, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { getChromeExtensionInstallUrl } from "@/lib/chrome-extension";

interface StepInstallExtensionProps {
  onNext: () => void;
  onSkip: () => void;
}

export function StepInstallExtension({ onNext, onSkip }: StepInstallExtensionProps) {
  const t = useTranslations("onboarding.install");
  const locale = useLocale();
  const extensionUrl = getChromeExtensionInstallUrl(locale);

  const benefits = [
    { icon: MousePointerClick, text: t("benefitOneClick") },
    { icon: Zap, text: t("benefitAutoAnalyze") },
    { icon: Globe, text: t("benefitAllSites") },
  ] as const;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black tracking-[0.16em] text-cm-text/45">STEP 2</p>
          <h1 className="mt-2 font-creative-display text-2xl leading-tight font-black text-cm-text sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 ko-keep text-base leading-relaxed text-cm-text/62">{t("subtitle")}</p>
        </div>

        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-nod-gold/35 bg-[#fff2c7] dark:bg-nod-gold/15 dark:border-nod-gold/25">
          <Globe className="h-7 w-7 text-nod-gold-muted" />
        </div>
      </div>

      <div className="space-y-2.5">
        {benefits.map(({ icon: Icon, text }, i) => (
          <div
            key={text}
            className="cm-doodle-border flex items-center gap-3 bg-white px-5 py-3.5 dark:bg-cm-surface"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cm-mint/60 bg-cm-mint/30 dark:border-emerald-700/40 dark:bg-emerald-950/30">
              <Icon className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="ko-keep text-sm font-semibold text-cm-text/78">{text}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-3">
        <a
          href={extensionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cm-doodle-border flex w-full items-center justify-center gap-2 bg-white px-6 py-3.5 text-sm font-black text-cm-text transition-all hover:bg-cm-bg hover:scale-[1.01] dark:bg-cm-surface dark:hover:bg-cm-surface-raised"
        >
          <Download className="h-4 w-4" />
          {t("installButton")}
        </a>

        <button
          type="button"
          onClick={onNext}
          className="cm-doodle-border w-full bg-nod-gold px-6 py-3.5 text-sm font-black text-black transition-all hover:bg-[#f0c958] hover:scale-[1.01]"
        >
          {t("confirmButton")}
        </button>
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="mt-4 text-sm font-semibold text-cm-text/45 underline decoration-dotted transition-colors hover:text-cm-text/70"
      >
        {t("skipLink")}
      </button>
    </div>
  );
}
