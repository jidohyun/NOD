"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Globe, Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
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

gsap.registerPlugin(ScrollTrigger, useGSAP);

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
  const [mounted, setMounted] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const showAnim = gsap
        .from(headerRef.current, {
          yPercent: -100,
          paused: true,
          duration: 0.35,
          ease: "power2.out",
        })
        .progress(1);

      ScrollTrigger.create({
        start: "top top",
        end: "max",
        onUpdate: (self) => {
          if (self.direction === 1 && self.scroll() > 150) {
            showAnim.reverse(); // scroll down -> hide
          } else {
            showAnim.play(); // scroll up -> show
          }
        },
      });
    },
    { scope: headerRef }
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollTo = useCallback((id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const basePath = pathname.replace(LOCALE_PREFIX_RE, "") || "/";
  const hrefForLocale = (nextLocale: string) =>
    basePath === "/" ? `/${nextLocale}` : `/${nextLocale}${basePath}`;

  return (
    <header
      ref={headerRef}
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
        scrolled
          ? "border-b border-white/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.06))] shadow-[0_14px_40px_rgba(0,0,0,0.22)] backdrop-blur-2xl dark:border-white/[0.12] dark:bg-[linear-gradient(180deg,rgba(14,15,18,0.64),rgba(14,15,18,0.38))]"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <nav className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mx-auto mt-2 flex h-16 max-w-[92rem] items-center justify-between rounded-full border border-white/20 bg-white/[0.05] px-5 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.03]">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <NodWordmark
              size="sm"
              priority
              className="opacity-90 transition-opacity group-hover:opacity-100"
            />
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            <button
              type="button"
              onClick={() => scrollTo("features")}
              className="font-mono text-[13px] tracking-wide text-black/55 uppercase transition-colors hover:text-black/90 dark:text-white/50 dark:hover:text-white/90"
            >
              {t("features")}
            </button>
            <button
              type="button"
              onClick={() => scrollTo("how-it-works")}
              className="font-mono text-[13px] tracking-wide text-black/55 uppercase transition-colors hover:text-black/90 dark:text-white/50 dark:hover:text-white/90"
            >
              {t("howItWorks")}
            </button>
            <button
              type="button"
              onClick={() => scrollTo("pricing")}
              className="font-mono text-[13px] tracking-wide text-black/55 uppercase transition-colors hover:text-black/90 dark:text-white/50 dark:hover:text-white/90"
            >
              {t("pricing")}
            </button>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-4">
            {mounted ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("changeLanguage")}
                    title={t("changeLanguage")}
                    className="text-black/60 hover:text-black/90 dark:text-white/50 dark:hover:text-white/90"
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
              className="text-[13px] text-black/55 transition-colors hover:text-black/90 dark:text-white/50 dark:hover:text-white/90"
            >
              {t("login")}
            </Link>
            <Link
              href="/login"
              className="group inline-flex items-center gap-1.5 rounded-full bg-nod-gold px-4 py-1.5 text-[13px] font-medium text-[#0A0A0B] hover:bg-nod-gold/90 transition-colors"
            >
              {t("getStarted")}
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="text-black/60 transition-colors hover:text-black/90 dark:text-white/60 dark:hover:text-white/90 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen ? (
          <div className="border-t border-black/8 pb-6 pt-2 animate-fade-in dark:border-white/[0.06] md:hidden">
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => scrollTo("features")}
                className="text-left text-sm text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
              >
                {t("features")}
              </button>
              <button
                type="button"
                onClick={() => scrollTo("how-it-works")}
                className="text-left text-sm text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
              >
                {t("howItWorks")}
              </button>
              <button
                type="button"
                onClick={() => scrollTo("pricing")}
                className="text-left text-sm text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
              >
                {t("pricing")}
              </button>
              <hr className="border-black/10 dark:border-white/[0.06]" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
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
                className="text-sm text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
              >
                {t("login")}
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-nod-gold px-4 py-2 text-sm font-medium text-[#0A0A0B]"
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
