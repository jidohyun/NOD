"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function LandingFooter() {
  const t = useTranslations("landing.footer");

  const columns = [
    {
      title: t("product"),
      links: [
        { label: t("dashboard"), href: "/articles" },
        { label: t("extension"), href: "#" },
        { label: t("mobile"), href: "#" },
        { label: t("api"), href: "#" },
      ],
    },
    {
      title: t("resources"),
      links: [
        { label: t("docs"), href: "#" },
        { label: t("github"), href: "#" },
        { label: t("changelog"), href: "#" },
      ],
    },
    {
      title: t("legal"),
      links: [
        { label: t("privacy"), href: "#" },
        { label: t("terms"), href: "#" },
      ],
    },
  ];

  return (
    <footer className="relative bg-[#070708] border-t border-nod-border/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-sm bg-nod-gold flex items-center justify-center">
                <span className="font-display font-bold text-[10px] text-[#0A0A0B] tracking-tight">
                  N
                </span>
              </div>
              <span className="font-display font-semibold text-sm text-white/80 tracking-tight">
                NOD
              </span>
            </Link>
            <p className="text-[13px] text-white/25 max-w-xs leading-relaxed">
              {t("tagline")}
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-mono text-[11px] text-white/30 uppercase tracking-wider mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-white/25 hover:text-white/60 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-6 border-t border-nod-border/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-mono text-[11px] text-white/15">
            &copy; {new Date().getFullYear()} NOD. {t("copyright")}
          </span>
          <div className="flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={`dot-${i}`}
                className="w-1 h-1 rounded-full bg-nod-gold/30"
              />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
