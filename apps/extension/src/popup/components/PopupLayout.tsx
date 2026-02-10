import type { ReactNode } from "react";
import { UserMenu } from "../components/UserMenu";
import { t, type Locale } from "../../lib/i18n";
import type { UserInfo } from "../../lib/auth";
import type { Theme } from "../hooks/useTheme";

interface PopupLayoutProps {
  children: ReactNode;
  user?: UserInfo | null;
  onLogout?: () => void;
  locale?: Locale;
  onLocaleChange?: (locale: Locale) => void;
  theme: Theme;
  onThemeToggle: () => void;
}

export function PopupLayout({
  children,
  user,
  onLogout,
  locale,
  onLocaleChange,
  theme,
  onThemeToggle,
}: PopupLayoutProps) {
  return (
    <div className="flex flex-col" style={{ background: "var(--bg-primary)" }}>
      <header
        className="flex items-center gap-2.5 px-4 py-3"
        style={{
          background: `linear-gradient(to right, var(--header-from), var(--header-to))`,
          borderBottom: `1px solid var(--header-border)`,
        }}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8B931] text-sm font-bold text-black logo-glow">
          N
        </div>
        <span className="text-sm font-semibold tracking-wide text-white">{t("extHeaderTitle")}</span>
        <span className="text-xs text-gray-500">{t("extHeaderSubtitle")}</span>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Theme Toggle */}
          <button
            onClick={onThemeToggle}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white/10"
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? (
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {user && onLogout && locale && onLocaleChange ? (
            <UserMenu user={user} onLogout={onLogout} locale={locale} onLocaleChange={onLocaleChange} />
          ) : null}
        </div>
      </header>
      <main className="p-4 animate-fade-in">{children}</main>
    </div>
  );
}
