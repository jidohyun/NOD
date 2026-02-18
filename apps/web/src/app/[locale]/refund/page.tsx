import type { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalHeader } from "@/components/legal/legal-header";

interface RefundPageProps {
  params: Promise<{ locale: string }>;
}

export default async function RefundPage({ params }: RefundPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("legal.refund");
  const s = await getTranslations("legal.refund.sections");

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <LegalHeader />

      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("effectiveDate")}</p>
      </header>

      <div className="mt-8 space-y-8 text-sm leading-6">
        <section className="space-y-2">
          <p>{t("intro")}</p>
        </section>
        {["cancellation", "refunds", "process", "exceptions"].map((key) => (
          <section key={key} className="space-y-2">
            <h2 className="text-base font-semibold">{s(`${key}.title`)}</h2>
            <p>{s(`${key}.content`)}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
