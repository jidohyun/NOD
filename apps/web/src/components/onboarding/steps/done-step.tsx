"use client";

import { useTranslations } from "next-intl";

export function DoneStep({ onDone }: { onDone: () => void }) {
  const t = useTranslations("onboarding");

  return (
    <section className="space-y-4">
      <h2 className="text-white font-semibold">{t("done.title")}</h2>
      <p className="text-sm text-white/50">{t("done.description")}</p>
      <button
        type="button"
        onClick={onDone}
        className="inline-flex items-center justify-center rounded-lg bg-nod-gold px-4 py-2.5 text-sm font-semibold text-[#0A0A0B] hover:bg-nod-gold/90"
      >
        {t("done.cta")}
      </button>
    </section>
  );
}
