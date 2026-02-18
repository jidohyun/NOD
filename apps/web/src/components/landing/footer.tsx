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
      "block text-[13px] font-medium text-black/55 transition-colors hover:text-black dark:text-white/50 dark:hover:text-white";

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

  const columns = [
    {
      title: t("product"),
      links: [
        { label: t("dashboard"), href: "/articles" },
        { label: t("extension"), href: extensionInstallUrl },
        { label: t("pricing"), href: "/pricing" },
        { label: t("mobile"), href: "#features" },
        { label: t("api"), href: "/api/health" },
      ],
    },
    {
      title: t("resources"),
      links: [
        { label: t("docs"), href: "https://github.com/jidohyun/NOD/blob/main/docs/USAGE.md" },
        { label: t("github"), href: "https://github.com/jidohyun/NOD" },
        { label: t("changelog"), href: "https://github.com/jidohyun/NOD/blob/main/CHANGELOG.md" },
      ],
    },
    {
      title: t("legal"),
      links: [
        { label: t("privacy"), href: "/privacy" },
        { label: t("terms"), href: "/terms" },
        { label: t("refund"), href: "/refund" },
      ],
    },
  ];

  return (
    <footer className="landing-surface relative border-t border-black/10 dark:border-white/[0.05] ko-keep">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="col-span-2 pr-8">
            <Link href="/" className="mb-6 inline-flex items-center group">
              <NodWordmark
                size="md"
                className="opacity-90 transition-opacity group-hover:opacity-100"
              />
            </Link>
            <p className="landing-text-subtle max-w-xs text-[14px] leading-relaxed font-light">
              {t("tagline")}
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-6 font-mono text-[10px] font-medium tracking-widest text-black/35 uppercase dark:text-white/30">
                {col.title}
              </h4>
              <ul className="space-y-3.5">
                {col.links.map((link) => (
                  <li key={link.label}>{renderLink(link.href, link.label)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-20 flex flex-col items-center justify-between gap-6 border-t border-black/10 pt-8 dark:border-white/[0.05] sm:flex-row">
          <span className="font-mono text-[11px] tracking-wide text-black/30 dark:text-white/20">
            &copy; {new Date().getFullYear()} NOD. {t("copyright")}
          </span>
          <div className="flex items-center gap-1.5 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="w-1.5 h-1.5 rounded-full bg-nod-gold/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-nod-gold/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-nod-gold/80" />
          </div>
        </div>
      </div>
    </footer>
  );
}
