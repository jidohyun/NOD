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
    <div className="mt-3 flex items-center justify-between">
      <span className="text-xs t-muted">{t("extSummaryLanguage")}</span>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-150"
          style={{
            background: "var(--locale-active-bg)",
            color: "var(--locale-active-text)",
          }}
        >
          <span>{current.flag}</span>
          <span>{current.label}</span>
          <svg
            className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div
            className="absolute right-0 bottom-full z-50 mb-1 w-40 max-h-48 overflow-y-auto rounded-xl shadow-2xl animate-slide-up"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border-subtle)" }}
          >
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  onChange(lang.code);
                  setIsOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors"
                style={{
                  background: value === lang.code ? "var(--locale-active-bg)" : "transparent",
                  color: value === lang.code ? "var(--locale-active-text)" : "var(--locale-text)",
                }}
                onMouseEnter={(e) => {
                  if (value !== lang.code) e.currentTarget.style.background = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  if (value !== lang.code) e.currentTarget.style.background = "transparent";
                }}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
