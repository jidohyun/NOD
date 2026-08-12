import type { ReactNode } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default function SharedLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
