"use client";

import { ArrowRight, Globe, Menu, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, usePathname } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

const LOCALE_PREFIX_RE = /^\/[a-z]{2}(?=\/|$)/;

export function LandingNav() {
  const t = useTranslations("landing.nav");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

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
  const hrefForLocale = (nextLocale: "ko" | "en" | "ja") =>
    basePath === "/" ? `/${nextLocale}` : `/${nextLocale}${basePath}`;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
        scrolled
          ? "bg-[#0A0A0B]/60 backdrop-blur-xl border-b border-white/[0.08]"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <nav className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <Image
              src="/brand/nod-logo.png"
              alt="NOD"
              width={120}
              height={30}
              className="h-7 w-auto opacity-90 transition-opacity group-hover:opacity-100"
              priority
            />
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            <button
              type="button"
              onClick={() => scrollTo("features")}
              className="text-[13px] text-white/50 hover:text-white/90 transition-colors font-mono tracking-wide uppercase"
            >
              {t("features")}
            </button>
            <button
              type="button"
              onClick={() => scrollTo("how-it-works")}
              className="text-[13px] text-white/50 hover:text-white/90 transition-colors font-mono tracking-wide uppercase"
            >
              {t("howItWorks")}
            </button>
            <button
              type="button"
              onClick={() => scrollTo("pricing")}
              className="text-[13px] text-white/50 hover:text-white/90 transition-colors font-mono tracking-wide uppercase"
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
                    aria-label="Change language"
                    title="Change language"
                    className="text-white/50 hover:text-white/90"
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
            ) : null}
            <Link
              href="/login"
              className="text-[13px] text-white/50 hover:text-white/90 transition-colors"
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
            className="md:hidden text-white/60 hover:text-white/90 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen ? (
          <div className="md:hidden pb-6 pt-2 border-t border-white/[0.04] animate-fade-in">
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => scrollTo("features")}
                className="text-sm text-white/60 hover:text-white text-left"
              >
                {t("features")}
              </button>
              <button
                type="button"
                onClick={() => scrollTo("how-it-works")}
                className="text-sm text-white/60 hover:text-white text-left"
              >
                {t("howItWorks")}
              </button>
              <button
                type="button"
                onClick={() => scrollTo("pricing")}
                className="text-sm text-white/60 hover:text-white text-left"
              >
                {t("pricing")}
              </button>
              <hr className="border-white/[0.06]" />
              <Link href="/login" className="text-sm text-white/60 hover:text-white">
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
