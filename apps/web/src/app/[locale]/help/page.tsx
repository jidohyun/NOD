import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { HelpContent } from "@/components/help/help-content";

interface HelpPageProps {
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = {
  title: "Help Center — NOD",
  description:
    "Get help with NOD — AI-powered article saving, AI summaries, and semantic search features.",
  robots: { index: true, follow: true },
};

export default async function HelpPage({ params }: HelpPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return <HelpContent locale={locale} />;
}
