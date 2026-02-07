import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return <DashboardOverview />;
}
