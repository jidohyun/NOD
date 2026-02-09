import type { ReactNode } from "react";
import { UserMenu } from "../components/UserMenu";
import { t, type Locale } from "../../lib/i18n";
import type { UserInfo } from "../../lib/auth";

interface PopupLayoutProps {
  children: ReactNode;
  user?: UserInfo | null;
  onLogout?: () => void;
  locale?: Locale;
  onLocaleChange?: (locale: Locale) => void;
}

export function PopupLayout({
  children,
  user,
  onLogout,
  locale,
  onLocaleChange,
}: PopupLayoutProps) {
  return (
    <div className="flex flex-col">
      <header className="flex items-center gap-2.5 bg-black px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-[#E8B931] text-sm font-bold text-black">
          N
        </div>
        <span className="text-sm font-semibold tracking-wide text-white">{t("extHeaderTitle")}</span>
        <span className="text-xs text-gray-500">{t("extHeaderSubtitle")}</span>

        {user && onLogout && locale && onLocaleChange ? (
          <UserMenu user={user} onLogout={onLogout} locale={locale} onLocaleChange={onLocaleChange} />
        ) : null}
      </header>
      <main className="p-4">{children}</main>
    </div>
  );
}
