"use client";

import { useTranslations } from "next-intl";

type LocaleId = "ko" | "en" | "ja";

const LOCALES = [
  { id: "ko" as const, label: "한국어" },
  { id: "en" as const, label: "English" },
  { id: "ja" as const, label: "日本語" },
] as const;

export function LanguageStep({
  locale,
  onSelect,
}: {
  locale: LocaleId;
  onSelect: (l: LocaleId) => void;
}) {
  const t = useTranslations("onboarding");

  return (
    <section className="space-y-4">
      <h2 className="text-white font-semibold">{t("language.title")}</h2>
      <p className="text-sm text-white/50">{t("language.description")}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {LOCALES.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => onSelect(l.id)}
            className={
              l.id === locale
                ? "rounded-lg border border-nod-gold/30 bg-nod-gold/[0.08] px-4 py-3 text-sm font-semibold text-white"
                : "rounded-lg border border-nod-border bg-white/[0.03] px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/[0.06]"
            }
          >
            {l.label}
          </button>
        ))}
      </div>
      <div className="pt-2 text-xs text-white/40">{t("language.note")}</div>
    </section>
  );
}
