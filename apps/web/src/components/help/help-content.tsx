import {
  BadgeHelp,
  BookMarked,
  BookOpen,
  CreditCard,
  ExternalLink,
  Lightbulb,
  Puzzle,
  Search,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import { getChromeExtensionInstallUrl } from "@/lib/chrome-extension";
import { Link } from "@/lib/i18n/routing";

const HELP_BG_STYLE: CSSProperties = {
  backgroundImage:
    "radial-gradient(rgba(232, 185, 49, 0.45) 1.1px, transparent 1.1px), radial-gradient(rgba(74, 74, 74, 0.2) 1px, transparent 1px)",
  backgroundSize: "22px 22px",
  backgroundPosition: "0 0, 11px 11px",
};

interface HelpContentProps {
  locale: string;
}

export function HelpContent({ locale }: HelpContentProps) {
  const t = useTranslations("help");
  const extensionInstallUrl = getChromeExtensionInstallUrl(locale);

  const quickStart = [
    {
      title: t("quickStart.item1.title"),
      description: t("quickStart.item1.description"),
      icon: BookMarked,
    },
    {
      title: t("quickStart.item2.title"),
      description: t("quickStart.item2.description"),
      icon: Sparkles,
    },
    {
      title: t("quickStart.item3.title"),
      description: t("quickStart.item3.description"),
      icon: Search,
    },
  ];

  const faq = [
    { q: t("faq.item1.q"), a: t("faq.item1.a") },
    { q: t("faq.item2.q"), a: t("faq.item2.a") },
    { q: t("faq.item3.q"), a: t("faq.item3.a") },
  ];

  return (
    <div className="relative overflow-hidden rounded-[2rem] border-2 border-cm-text/10 bg-cm-bg p-6 lg:p-8">
      <div className="pointer-events-none absolute inset-0 opacity-65" style={HELP_BG_STYLE} />

      <div className="relative space-y-7">
        <header className="space-y-4">
          <p className="inline-flex items-center rounded-full border border-cm-text/15 bg-white/75 px-3 py-1 font-creative-body text-sm font-bold text-cm-text/65 dark:border-cm-text/25 dark:bg-cm-surface/75">
            {t("centerBadge")}
          </p>
          <h1 className="font-creative-display text-[clamp(2rem,3.2vw,3.3rem)] font-black text-cm-text">
            {t("heading")}
          </h1>
          <p className="max-w-4xl font-creative-body text-base italic text-cm-text/65">
            {t("subtitle")}
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          {quickStart.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="cm-doodle-border bg-white/95 p-5 dark:bg-cm-surface/95"
              >
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cm-text/15 bg-cm-bg/80">
                    <Icon className="h-4 w-4 text-nod-gold" />
                  </div>
                  <h2 className="font-creative-display text-xl font-black text-cm-text">
                    {item.title}
                  </h2>
                </div>
                <p className="font-creative-body text-sm leading-relaxed text-cm-text/70">
                  {item.description}
                </p>
              </article>
            );
          })}
        </section>

        <section className="cm-doodle-border bg-white/95 p-6 dark:bg-cm-surface/95">
          <div className="mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-[#8BA888]" />
            <h2 className="font-creative-display text-2xl font-black text-cm-text">
              {t("quickShortcutsTitle")}
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/articles"
              className="cm-doodle-border border-cm-text/20 bg-cm-bg/70 p-4 font-creative-body text-sm font-black text-cm-text transition-colors hover:bg-white dark:bg-cm-surface-raised/80 dark:hover:bg-cm-surface"
            >
              {t("shortcuts.articles")}
            </Link>
            <Link
              href="/settings/billing"
              className="cm-doodle-border border-cm-text/20 bg-cm-bg/70 p-4 font-creative-body text-sm font-black text-cm-text transition-colors hover:bg-white dark:bg-cm-surface-raised/80 dark:hover:bg-cm-surface"
            >
              {t("shortcuts.billing")}
            </Link>
            <Link
              href="/settings/billing"
              className="cm-doodle-border border-cm-text/20 bg-cm-bg/70 p-4 font-creative-body text-sm font-black text-cm-text transition-colors hover:bg-white dark:bg-cm-surface-raised/80 dark:hover:bg-cm-surface"
            >
              {t("shortcuts.pricing")}
            </Link>
            <a
              href={extensionInstallUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="cm-doodle-border border-cm-text/20 bg-cm-bg/70 p-4 font-creative-body text-sm font-black text-cm-text transition-colors hover:bg-white dark:bg-cm-surface-raised/80 dark:hover:bg-cm-surface"
            >
              {t("shortcuts.installExtension")}
            </a>
          </div>
        </section>

        <section className="cm-doodle-border bg-white/95 p-6 dark:bg-cm-surface/95">
          <div className="mb-4 flex items-center gap-2">
            <BadgeHelp className="h-5 w-5 text-cm-coral" />
            <h2 className="font-creative-display text-2xl font-black text-cm-text">
              {t("faqTitle")}
            </h2>
          </div>

          <div className="space-y-3">
            {faq.map((item) => (
              <article
                key={item.q}
                className="cm-doodle-border border-cm-text/15 bg-cm-bg/65 px-4 py-3 dark:bg-cm-surface/65"
              >
                <h3 className="font-creative-body text-sm font-black text-cm-text">{item.q}</h3>
                <p className="mt-2 font-creative-body text-sm leading-relaxed text-cm-text/70">
                  {item.a}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="cm-doodle-border bg-white/95 p-6 dark:bg-cm-surface/95">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-cm-text/60" />
            <h2 className="font-creative-display text-2xl font-black text-cm-text">
              {t("supportTitle")}
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href="https://nodarchive.featurebase.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="cm-doodle-border border-cm-text/20 bg-cm-bg/70 px-4 py-3 font-creative-body text-sm font-black text-cm-text transition-colors hover:bg-white dark:bg-cm-surface-raised/80 dark:hover:bg-cm-surface"
            >
              <span className="inline-flex items-center gap-1">
                <Puzzle className="h-4 w-4 text-nod-gold" />
                {t("sendFeedback")}
                <ExternalLink className="h-3.5 w-3.5 text-cm-text/45" />
              </span>
            </a>

            <Link
              href="/settings/billing"
              className="cm-doodle-border border-cm-text/20 bg-cm-bg/70 px-4 py-3 font-creative-body text-sm font-black text-cm-text transition-colors hover:bg-white dark:bg-cm-surface-raised/80 dark:hover:bg-cm-surface"
            >
              <span className="inline-flex items-center gap-1">
                <CreditCard className="h-4 w-4 text-[#8BA888]" />
                {t("billingHelp")}
              </span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
