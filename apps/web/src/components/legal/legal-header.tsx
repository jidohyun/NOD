"use client";

import { ChevronLeft, Globe } from "lucide-react";
import { useLocale } from "next-intl";
import { routing, usePathname, useRouter } from "@/lib/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
};

export function LegalHeader() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between mb-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Back
      </button>

      <div className="relative">
        <div className="inline-flex items-center gap-1.5">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <select
            value={locale}
            onChange={(e) => {
              router.replace(pathname, { locale: e.target.value });
            }}
            className="appearance-none bg-transparent text-sm text-muted-foreground hover:text-foreground cursor-pointer pr-5 focus:outline-none"
          >
            {routing.locales.map((loc) => (
              <option key={loc} value={loc}>
                {LOCALE_LABELS[loc] ?? loc}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
