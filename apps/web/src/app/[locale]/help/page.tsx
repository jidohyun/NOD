import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { HelpContent } from "@/components/help/help-content";

interface HelpPageProps {
  params: Promise<{ locale: string }>;
}

export default async function HelpPage({ params }: HelpPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return <HelpContent locale={locale} />;
}
