"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useUsage } from "@/lib/api/subscriptions";

export function UpgradePrompt() {
  const t = useTranslations("subscription");
  const { data: usage } = useUsage();

  if (!usage || usage.plan === "pro" || usage.can_summarize) return null;

  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
      <p className="text-sm font-medium text-yellow-800">{t("limitReached")}</p>
      <p className="mt-1 text-xs text-yellow-700">{t("upgradePrompt")}</p>
      <Link
        href="/pricing"
        className="mt-2 inline-block rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
      >
        {t("upgrade")}
      </Link>
    </div>
  );
}
