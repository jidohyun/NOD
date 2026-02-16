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
    <div className="dark grain-overlay min-h-screen flex flex-col bg-[#0A0A0B] text-neutral-300">
      <LandingNav />
      <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-16 md:py-24">{children}</main>
      <LandingFooter />
    </div>
  );
}
