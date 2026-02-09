"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n/routing";

export function SaveStep({
  sampleUrl,
  savePollState,
  onConfirmSaved,
}: {
  sampleUrl: string;
  savePollState: "idle" | "polling";
  onConfirmSaved: () => void;
}) {
  const t = useTranslations("onboarding");

  return (
    <section className="space-y-4">
      <h2 className="text-white font-semibold">{t("save.title")}</h2>
      <p className="text-sm text-white/50">{t("save.description")}</p>

      <div className="rounded-lg border border-nod-border bg-white/[0.02] p-4">
        <div className="text-sm text-white/70 mb-2">{t("save.recommended")}</div>
        <a
          href={sampleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-nod-gold hover:underline break-all"
        >
          {sampleUrl}
        </a>
      </div>

      <ol className="list-decimal pl-5 space-y-1 text-sm text-white/60">
        <li>{t("save.step1")}</li>
        <li>{t("save.step2")}</li>
        <li>{t("save.step3")}</li>
      </ol>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onConfirmSaved}
          disabled={savePollState === "polling"}
          className="inline-flex items-center justify-center rounded-lg bg-nod-gold px-4 py-2.5 text-sm font-semibold text-[#0A0A0B] hover:bg-nod-gold/90 disabled:opacity-50"
        >
          {savePollState === "polling" ? t("save.waiting") : t("save.done")}
        </button>
        <Link
          href="/articles"
          className="inline-flex items-center justify-center rounded-lg border border-nod-border bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/[0.06]"
        >
          {t("save.goArticles")}
        </Link>
      </div>
    </section>
  );
}
