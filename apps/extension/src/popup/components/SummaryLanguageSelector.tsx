import type { SummaryLanguage } from "../hooks/useSummaryLanguage";
import { t } from "../../lib/i18n";

interface SummaryLanguageSelectorProps {
  value: SummaryLanguage;
  onChange: (lang: SummaryLanguage) => void;
}

const LANGUAGES: { code: SummaryLanguage; label: string; flag: string }[] = [
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
];

export function SummaryLanguageSelector({ value, onChange }: SummaryLanguageSelectorProps) {
  return (
    <div className="mt-3 flex items-center justify-between">
      <span className="text-xs t-muted">{t("extSummaryLanguage")}</span>
      <div className="flex gap-1">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onChange(lang.code)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-all duration-150"
            style={{
              background: value === lang.code ? "var(--locale-active-bg)" : "var(--locale-bg)",
              color: value === lang.code ? "var(--locale-active-text)" : "var(--locale-text)",
            }}
            title={lang.label}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
