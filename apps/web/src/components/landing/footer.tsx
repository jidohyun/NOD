"use client";

import { useLocale, useTranslations } from "next-intl";
import { NodWordmark } from "@/components/brand/nod-wordmark";
import { getChromeExtensionInstallUrl } from "@/lib/chrome-extension";
import { Link } from "@/lib/i18n/routing";

export function LandingFooter() {
  const locale = useLocale();
  const t = useTranslations("landing.footer");
  const extensionInstallUrl = getChromeExtensionInstallUrl(locale);

  const renderLink = (href: string, label: string) => {
    const className =
      "font-creative-body text-sm font-bold text-cm-text/70 transition-colors hover:text-nod-gold";

    if (href.startsWith("http")) {
      return (
        <a href={href} className={className} target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      );
    }

    if (href.startsWith("#") || href.startsWith("/api/")) {
      return (
        <a href={href} className={className}>
          {label}
        </a>
      );
    }

    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  };

  const links = [
    { label: t("dashboard"), href: "/articles" },
    { label: t("extension"), href: extensionInstallUrl },
    { label: t("pricing"), href: "/pricing" },
    { label: t("blog"), href: "/blog" },
    { label: t("docs"), href: "https://github.com/jidohyun/NOD/blob/main/docs/USAGE.md" },
    { label: t("github"), href: "https://github.com/jidohyun/NOD" },
    { label: t("privacy"), href: "/privacy" },
    { label: t("terms"), href: "/terms" },
  ];

  return (
    <footer className="relative bg-cm-bg border-t-2 border-dashed border-cm-text/10 ko-keep">
      <div className="mx-auto max-w-5xl px-6 lg:px-8 py-16">
        {/* Center-aligned layout */}
        <div className="flex flex-col items-center gap-8 text-center">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center group">
            <div className="cm-organic-shape bg-nod-gold/15 p-2 transition-colors group-hover:bg-nod-gold/25">
              <NodWordmark
                size="sm"
                className="opacity-90 transition-opacity group-hover:opacity-100"
              />
            </div>
          </Link>

          {/* Tagline */}
          <p className="max-w-md font-creative-body text-sm leading-relaxed text-cm-text-light">
            {t("tagline")}
          </p>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {links.map((link) => (
              <span key={link.label}>{renderLink(link.href, link.label)}</span>
            ))}
          </div>

          {/* Copyright */}
          <div className="flex items-center gap-3 pt-6 border-t-2 border-dashed border-cm-text/8 w-full justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 cm-organic-shape bg-nod-gold/40" />
              <div className="w-1.5 h-1.5 cm-organic-shape bg-nod-gold/60" />
              <div className="w-1.5 h-1.5 cm-organic-shape bg-nod-gold/80" />
            </div>
            <span className="font-creative-body text-xs font-semibold text-cm-text/30">
              &copy; {new Date().getFullYear()} NOD. {t("copyright")}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
