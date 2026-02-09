"use client";

import { useTranslations } from "next-intl";

export function SummaryStep({ summaryState }: { summaryState: "idle" | "waiting" | "success" }) {
  const t = useTranslations("onboarding");

  return (
    <section className="space-y-4">
      <h2 className="text-white font-semibold">{t("summary.title")}</h2>
      <p className="text-sm text-white/50">{t("summary.description")}</p>
      <div className="rounded-lg border border-nod-border bg-white/[0.02] p-4 text-sm text-white/70">
        {summaryState === "success" ? t("summary.success") : t("summary.waiting")}
      </div>
    </section>
  );
}
