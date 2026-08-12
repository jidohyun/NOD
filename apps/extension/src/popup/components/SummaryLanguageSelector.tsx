import { useState, useRef, useEffect } from "react";
import type { SummaryLanguage } from "../hooks/useSummaryLanguage";
import { t } from "../../lib/i18n";

interface SummaryLanguageSelectorProps {
  value: SummaryLanguage;
  onChange: (lang: SummaryLanguage) => void;
}

const LANGUAGES: { code: SummaryLanguage; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "pt-BR", label: "Português", flag: "🇧🇷" },
  { code: "zh-CN", label: "中文", flag: "🇨🇳" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
];

export function SummaryLanguageSelector({
  value,
  onChange,
}: SummaryLanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((l) => l.code === value) ?? LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="cm-doodle-border mt-3 flex items-center justify-between bg-surface px-2.5 py-2">
      <span className="text-xs font-semibold t-muted">{t("extSummaryLanguage")}</span>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="cm-pill-toggle flex items-center gap-1.5 px-2.5 py-1"
          style={{
            background: "var(--locale-active-bg)",
            color: "var(--locale-active-text)",
          }}
        >
          <span>{current.flag}</span>
          <span>{current.label}</span>
          <svg
            aria-hidden="true"
            className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen ? (
          <div
            className="cm-dropdown-panel absolute bottom-full right-0 z-50 mb-1 w-44 max-h-48 overflow-y-auto p-1 animate-slide-up"
          >
            {LANGUAGES.map((lang) => (
              <button
                type="button"
                key={lang.code}
                onClick={() => {
                  onChange(lang.code);
                  setIsOpen(false);
                }}
                className="cm-dropdown-option"
                data-active={value === lang.code}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
