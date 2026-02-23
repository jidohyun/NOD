"use client";

import { Download, Globe } from "lucide-react";
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

  return (
    <div className="text-center">
      {/* Icon */}
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8B931]/10">
        <Globe className="h-8 w-8 text-[#E8B931]" />
      </div>

      {/* Title */}
      <h1 className="font-display text-3xl font-bold text-white">{t("title")}</h1>
      <p className="mt-2 text-white/50">{t("subtitle")}</p>

      {/* Install Button */}
      <a
        href={extensionUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 py-3.5 text-sm font-medium text-white/90 transition-all hover:border-white/[0.15] hover:bg-white/[0.06]"
      >
        <Download className="h-4 w-4" />
        {t("installButton")}
      </a>

      {/* Confirm Button */}
      <button
        type="button"
        onClick={onNext}
        className="mt-3 w-full rounded-xl bg-[#E8B931] px-6 py-3.5 text-sm font-semibold text-[#0A0A0B] transition-all hover:bg-[#E8B931]/90 active:scale-[0.98]"
      >
        {t("confirmButton")}
      </button>

      {/* Skip Link */}
      <button
        type="button"
        onClick={onSkip}
        className="mt-4 text-sm text-white/30 transition-colors hover:text-white/60"
      >
        {t("skipLink")}
      </button>
    </div>
  );
}
