"use client";

import { useTranslations } from "next-intl";
import { CHROME_EXTENSION_INSTALL_URL } from "@/lib/chrome-extension";
import { Link } from "@/lib/i18n/routing";

export function LandingFooter() {
  const t = useTranslations("landing.footer");

  const renderLink = (href: string, label: string) => {
    const className =
      "text-[13px] text-white/50 hover:text-white transition-colors block font-medium";

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
        { label: t("extension"), href: CHROME_EXTENSION_INSTALL_URL },
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
    <footer className="relative bg-[#050505] border-t border-white/[0.05] ko-keep">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="col-span-2 pr-8">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-6 group">
              <div className="w-7 h-7 rounded-md bg-nod-gold flex items-center justify-center shadow-lg shadow-nod-gold/10 group-hover:shadow-nod-gold/20 transition-all">
                <span className="font-display font-bold text-[11px] text-[#0A0A0B] tracking-tight">
                  N
                </span>
              </div>
              <span className="font-display font-semibold text-[15px] text-white/90 tracking-tight">
                NOD
              </span>
            </Link>
            <p className="text-[14px] text-white/40 max-w-xs leading-relaxed font-light">
              {t("tagline")}
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-mono text-[10px] text-white/30 uppercase tracking-widest mb-6 font-medium">
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
        <div className="mt-20 pt-8 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-6">
          <span className="font-mono text-[11px] text-white/20 tracking-wide">
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
