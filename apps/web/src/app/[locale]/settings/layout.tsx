import type { ReactNode } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
