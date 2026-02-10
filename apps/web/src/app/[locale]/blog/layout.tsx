import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { LandingFooter } from "@/components/landing/footer";
import { LandingNav } from "@/components/landing/nav";

interface BlogLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function BlogLayout({ children, params }: BlogLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <div className="grain-overlay">
      <LandingNav />
      <main className="mx-auto max-w-3xl px-6 py-24 md:py-32">{children}</main>
      <LandingFooter />
    </div>
  );
}
