"use client";

import { Globe, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { locales } from "@/lib/i18n/config";
import { usePathname } from "@/lib/i18n/routing";
import { UserMenu } from "./user-menu";

const LOCALE_PREFIX_RE = /^\/[a-z]{2}(?=\/|$)/;

const LOCALE_LABELS: Record<string, { name: string; code: string }> = {
  ko: { name: "한국어", code: "KO" },
  en: { name: "English", code: "EN" },
  ja: { name: "日本語", code: "JA" },
  es: { name: "Español", code: "ES" },
  "pt-BR": { name: "Português", code: "PT" },
  "zh-CN": { name: "中文", code: "ZH" },
  de: { name: "Deutsch", code: "DE" },
  fr: { name: "Français", code: "FR" },
};

export function DashboardHeader() {
  const t = useTranslations("landing.nav");
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const basePath = pathname.replace(LOCALE_PREFIX_RE, "") || "/";

  const hrefForLocale = (nextLocale: string) =>
    basePath === "/" ? `/${nextLocale}` : `/${nextLocale}${basePath}`;

  return (
    <header className="flex h-14 items-center gap-4 border-b border-dashed border-cm-text/10 bg-white/80 backdrop-blur-sm px-6">
      {/* Mobile Sidebar Toggle */}
      <Button variant="ghost" size="icon-sm" data-testid="sidebar-toggle" className="md:hidden">
        <Menu className="h-5 w-5" />
      </Button>

      {/* Spacer */}
      <div className="flex-1" />

      <ThemeToggle />

      {/* Language */}
      {mounted ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("changeLanguage")}
              title={t("changeLanguage")}
            >
              <Globe className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {locales.map((loc) => {
              const label = LOCALE_LABELS[loc];
              if (!label) return null;
              return (
                <DropdownMenuItem
                  key={loc}
                  onSelect={() => {
                    window.location.assign(hrefForLocale(loc));
                  }}
                >
                  <span className="flex-1">{label.name}</span>
                  <span className="text-xs text-muted-foreground">{label.code}</span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("changeLanguage")}
          title={t("changeLanguage")}
          disabled
        >
          <Globe className="h-5 w-5" />
        </Button>
      )}

      {/* User Menu */}
      <UserMenu />
    </header>
  );
}
