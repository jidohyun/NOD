import type { ReactNode } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayout>
      <OnboardingGate>{children}</OnboardingGate>
    </DashboardLayout>
  );
}
