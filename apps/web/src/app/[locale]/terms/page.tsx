import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalHeader } from "@/components/legal/legal-header";

interface TermsPageProps {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = {
  title: "Terms of Service — NOD",
  robots: { index: false, follow: true },
};

const SECTION_KEYS = [
  "purpose",
  "definitions",
  "termsPosting",
  "serviceDescription",
  "agreementFormation",
  "account",
  "serviceTiers",
  "payment",
  "autoRenewal",
  "withdrawalRefund",
  "chromeExtension",
  "userContent",
  "aiServices",
  "intellectualProperty",
  "prohibited",
  "serviceRestriction",
  "disclaimers",
  "indemnification",
  "disputeResolution",
  "general",
] as const;

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("legal.terms");
  const s = await getTranslations("legal.terms.sections");

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <LegalHeader />

      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("effectiveDate")}</p>
      </header>

      <div className="mt-8 space-y-8 text-sm leading-6">
        {SECTION_KEYS.map((key) => (
          <section key={key} className="space-y-2">
            <h2 className="text-base font-semibold">{s(`${key}.title`)}</h2>
            <p className="whitespace-pre-line">{s(`${key}.content`)}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
