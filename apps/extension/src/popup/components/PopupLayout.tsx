import type { ReactNode } from "react";
import { UserMenu } from "../components/UserMenu";
import { t, type Locale } from "../../lib/i18n";
import type { UserInfo } from "../../lib/auth";
import type { Theme } from "../hooks/useTheme";

const LOGO_SRC: Record<Theme, string> = {
  dark: "/brand/nod-logo.png",
  light: "/brand/nod-logo-light.png",
};

const LOGO_FALLBACK_SRC: Record<Theme, string> = {
  dark: "/icons/nod-logo.png",
  light: "/icons/nod-logo-light.png",
};

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
    <div className="cm-dot-bg flex min-h-full flex-col bg-themed p-2">
      <header
        className="cm-doodle-border cm-sketch-shadow flex items-center gap-2 bg-surface px-2.5 py-2.5"
        style={{
          background: `linear-gradient(to right, var(--header-from), var(--header-to))`,
          borderColor: `var(--header-border)`,
        }}
      >
        <div className="flex items-center gap-2 rounded-full px-2.5 py-1" style={{ background: "var(--bg-elevated)" }}>
          <img
            src={LOGO_SRC[theme]}
            alt="NOD"
            className="h-5 w-auto opacity-95"
            onError={(event) => {
              const img = event.currentTarget;
              img.onerror = null;
              img.src = LOGO_FALLBACK_SRC[theme];
            }}
          />
          {__DEV__ ? (
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-500">
              DEV
            </span>
          ) : null}
        </div>
        <span className="min-w-0 flex-1 truncate whitespace-nowrap text-[11px] font-semibold tracking-[0.01em] t-muted">
          {t("extHeaderSubtitle")}
        </span>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onThemeToggle}
            className="cm-pill-toggle flex h-8 w-8 items-center justify-center"
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <svg aria-hidden="true" className="h-4 w-4 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg aria-hidden="true" className="h-4 w-4 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {user && onLogout && locale && onLocaleChange ? (
            <UserMenu user={user} onLogout={onLogout} locale={locale} onLocaleChange={onLocaleChange} />
          ) : null}
        </div>
      </header>
      <main className="cm-doodle-border cm-sketch-shadow mt-3 flex-1 bg-card p-3.5 animate-fade-in">{children}</main>
    </div>
  );
}
