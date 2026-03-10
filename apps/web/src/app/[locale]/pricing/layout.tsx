import type { ReactNode } from "react";
import { LandingFooter } from "@/components/landing/footer";
import { LandingNav } from "@/components/landing/nav";

export default function PricingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-cm-bg font-creative-body text-cm-text selection:bg-nod-gold selection:text-white">
      <LandingNav />
      <main className="min-h-screen">{children}</main>
      <LandingFooter />
    </div>
  );
}
