import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { DashboardGraphView } from "@/components/dashboard/dashboard-graph-view";

interface DashboardGraphPageProps {
  params: Promise<{ locale: string }>;
}

export default async function DashboardGraphPage({ params }: DashboardGraphPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return <DashboardGraphView />;
}
