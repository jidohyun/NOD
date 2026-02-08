"use client";

import { Globe, Menu, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { usePathname } from "@/lib/i18n/routing";
import { UserMenu } from "./user-menu";

const LOCALE_PREFIX_RE = /^\/[a-z]{2}(?=\/|$)/;

export function DashboardHeader() {
  const t = useTranslations("dashboard");
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const basePath = pathname.replace(LOCALE_PREFIX_RE, "") || "/";

  const hrefForLocale = (nextLocale: "ko" | "en" | "ja") =>
    basePath === "/" ? `/${nextLocale}` : `/${nextLocale}${basePath}`;

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
      {/* Mobile Sidebar Toggle */}
      <Button variant="ghost" size="icon-sm" data-testid="sidebar-toggle" className="md:hidden">
        <Menu className="h-5 w-5" />
      </Button>

      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" placeholder={t("searchPlaceholder")} className="pl-9" />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Language */}
      {mounted ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Change language"
              title="Change language"
            >
              <Globe className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onSelect={() => {
                window.location.assign(hrefForLocale("ko"));
              }}
            >
              <span className="flex-1">한국어</span>
              <span className="text-xs text-muted-foreground">KO</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                window.location.assign(hrefForLocale("en"));
              }}
            >
              <span className="flex-1">English</span>
              <span className="text-xs text-muted-foreground">EN</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                window.location.assign(hrefForLocale("ja"));
              }}
            >
              <span className="flex-1">日本語</span>
              <span className="text-xs text-muted-foreground">JA</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Change language"
          title="Change language"
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
