import type { ReactNode } from "react";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#0A0A0B]">{children}</div>;
}
