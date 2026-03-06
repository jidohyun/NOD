"use client";

import { ArrowRight, Globe, Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { NodWordmark } from "@/components/brand/nod-wordmark";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { locales } from "@/lib/i18n/config";
import { Link, usePathname } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

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

export function LandingNav() {
  const t = useTranslations("landing.nav");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLandingPage = pathname === "/" || pathname === "";
  const isBlogPage = pathname.startsWith("/blog");
  const [activeSection, setActiveSection] = useState<"features" | "how-it-works" | "pricing">(
    "features"
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const sectionIds = ["features", "how-it-works", "pricing"] as const;

    const onScroll = () => {
      setScrolled(window.scrollY > 32);

      const offsetY = window.scrollY + 160;
      let current: (typeof sectionIds)[number] = "features";
      for (const id of sectionIds) {
        const section = document.getElementById(id);
        if (section && section.offsetTop <= offsetY) {
          current = id;
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollTo = useCallback((id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const navButtonClass = (id: "features" | "how-it-works" | "pricing") =>
    cn(
      "font-creative-body text-sm font-semibold transition-colors",
      isLandingPage && activeSection === id
        ? "text-cm-text underline decoration-nod-gold decoration-2 underline-offset-8"
        : "text-cm-text/70 hover:text-cm-text"
    );

  const basePath = pathname.replace(LOCALE_PREFIX_RE, "") || "/";
  const hrefForLocale = (nextLocale: string) =>
    basePath === "/" ? `/${nextLocale}` : `/${nextLocale}${basePath}`;

  return (
    <header
      className={cn(
        "fixed top-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-5xl transition-all duration-500",
        scrolled ? "top-3" : "top-6"
      )}
    >
      <nav
        className={cn(
          "cm-doodle-border bg-white/80 backdrop-blur-md px-6 py-3 transition-shadow duration-500",
          scrolled ? "cm-sketch-shadow" : ""
        )}
      >
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="cm-organic-shape bg-nod-gold/15 p-1.5 transition-colors group-hover:bg-nod-gold/25">
              <NodWordmark
                size="sm"
                priority
                className="opacity-90 transition-opacity group-hover:opacity-100"
              />
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            <button
              type="button"
              onClick={() => scrollTo("features")}
              className={navButtonClass("features")}
            >
              {t("features")}
            </button>
            <button
              type="button"
              onClick={() => scrollTo("how-it-works")}
              className={navButtonClass("how-it-works")}
            >
              {t("howItWorks")}
            </button>
            <button
              type="button"
              onClick={() => scrollTo("pricing")}
              className={navButtonClass("pricing")}
            >
              {t("pricing")}
            </button>
            <Link
              href="/blog"
              className={cn(
                "font-creative-body text-sm font-semibold transition-colors",
                isBlogPage
                  ? "text-cm-text underline decoration-nod-gold decoration-2 underline-offset-8"
                  : "text-cm-text/70 hover:text-cm-text"
              )}
            >
              {t("blog")}
            </Link>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("changeLanguage")}
                    title={t("changeLanguage")}
                    className="text-cm-text/60 hover:text-cm-text hover:bg-cm-mint/50"
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
            ) : null}
            <Link
              href="/login"
              className="font-creative-body text-sm font-semibold text-cm-text/60 transition-colors hover:text-cm-text"
            >
              {t("login")}
            </Link>
            <Link
              href="/login"
              className="group inline-flex items-center gap-1.5 cm-doodle-border text-white bg-nod-gold px-5 py-2 font-creative-body text-sm font-bold transition-all"
            >
              {t("getStarted")}
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="text-cm-text/60 transition-colors hover:text-cm-text md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen ? (
          <div className="border-t border-cm-text/10 pb-6 pt-4 animate-fade-in md:hidden">
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => scrollTo("features")}
                className="text-left font-creative-body text-sm font-semibold text-cm-text/70 hover:text-cm-text"
              >
                {t("features")}
              </button>
              <button
                type="button"
                onClick={() => scrollTo("how-it-works")}
                className="text-left font-creative-body text-sm font-semibold text-cm-text/70 hover:text-cm-text"
              >
                {t("howItWorks")}
              </button>
              <button
                type="button"
                onClick={() => scrollTo("pricing")}
                className="text-left font-creative-body text-sm font-semibold text-cm-text/70 hover:text-cm-text"
              >
                {t("pricing")}
              </button>
              <Link
                href="/blog"
                className="text-left font-creative-body text-sm font-semibold text-cm-text/70 hover:text-cm-text"
                onClick={() => setMobileOpen(false)}
              >
                {t("blog")}
              </Link>
              <hr className="border-cm-text/10" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 font-creative-body text-sm text-cm-text/60 hover:text-cm-text"
                  >
                    <Globe className="h-4 w-4" />
                    {t("changeLanguage")}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
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
              <Link
                href="/login"
                className="font-creative-body text-sm text-cm-text/60 hover:text-cm-text"
              >
                {t("login")}
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 cm-doodle-border border-cm-text/25 bg-[#f4ecd9] px-5 py-2.5 font-creative-body text-sm font-bold text-cm-text transition-colors hover:bg-[#ead9b2]"
              >
                {t("getStarted")}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : null}
      </nav>
    </header>
  );
}
