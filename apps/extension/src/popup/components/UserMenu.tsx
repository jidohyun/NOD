import { useState, useRef, useEffect } from "react";
import { WEB_BASE } from "../../lib/constants";
import { t, type Locale } from "../../lib/i18n";
import type { UserInfo } from "../../lib/auth";

interface UserMenuProps {
  user: UserInfo;
  onLogout: () => void;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
}

const LOCALE_OPTIONS: { code: Locale; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "pt-BR", label: "Português", flag: "🇧🇷" },
  { code: "zh-CN", label: "中文", flag: "🇨🇳" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
];

export function UserMenu({ user, onLogout, locale, onLocaleChange }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localeDropdownOpen, setLocaleDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const localeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleOpenDashboard = () => {
    chrome.tabs.create({ url: `${WEB_BASE}/articles` });
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-full p-0.5 transition-all hover:bg-white/10"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            className="h-6 w-6 rounded-full ring-1 ring-white/10"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E8B931] text-xs font-bold text-black">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <svg
          className={`h-3 w-3 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="glass-menu absolute right-0 top-full z-50 mt-2 w-52 rounded-xl shadow-2xl animate-slide-up">
          <div className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <p className="truncate text-sm font-medium t-primary">{user.name}</p>
            <p className="truncate text-xs t-muted">{user.email}</p>
          </div>

          <div className="px-3.5 py-2.5 relative" style={{ borderBottom: "1px solid var(--border-subtle)" }} ref={localeRef}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium t-muted">{t("extLanguage")}</p>
              <button
                onClick={() => setLocaleDropdownOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-all duration-150"
                style={{
                  background: "var(--locale-active-bg)",
                  color: "var(--locale-active-text)",
                }}
              >
                <span>{LOCALE_OPTIONS.find((o) => o.code === locale)?.flag}</span>
                <span>{LOCALE_OPTIONS.find((o) => o.code === locale)?.label}</span>
                <svg
                  className={`h-3 w-3 transition-transform duration-200 ${localeDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            {localeDropdownOpen && (
              <div
                className="absolute right-3.5 z-50 mt-1 w-40 max-h-36 overflow-y-auto rounded-xl shadow-2xl"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border-subtle)" }}
              >
                {LOCALE_OPTIONS.map((opt) => (
                  <button
                    key={opt.code}
                    onClick={() => {
                      onLocaleChange(opt.code);
                      setLocaleDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors"
                    style={{
                      background: locale === opt.code ? "var(--locale-active-bg)" : "transparent",
                      color: locale === opt.code ? "var(--locale-active-text)" : "var(--locale-text)",
                    }}
                    onMouseEnter={(e) => {
                      if (locale !== opt.code) e.currentTarget.style.background = "var(--bg-hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (locale !== opt.code) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span>{opt.flag}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="py-1">
            <button
              onClick={handleOpenDashboard}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm t-secondary transition-colors"
              style={{ ["--tw-text-opacity" as string]: 1 }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <svg className="h-4 w-4 t-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
              {t("extViewDashboard")}
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-colors"
              style={{ color: "var(--logout-text)" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--logout-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              {t("extLogout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
