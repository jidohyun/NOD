"use client";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";

export function OnboardingResumeBanner() {
  const t = useTranslations("onboarding.resumeBanner");

  return (
    <div className="flex items-center justify-between rounded-xl border border-[#E8B931]/20 bg-[#E8B931]/5 px-5 py-4">
      <p className="text-sm text-white/70">{t("message")}</p>
      <Link
        href="/onboarding"
        className="flex items-center gap-1.5 rounded-lg bg-[#E8B931] px-4 py-2 text-sm font-semibold text-[#0A0A0B] transition-all hover:bg-[#E8B931]/90"
      >
        {t("cta")}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
