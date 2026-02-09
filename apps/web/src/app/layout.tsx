import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { GaPageView } from "@/components/analytics/ga-page-view";
import "./globals.css";

export const metadata: Metadata = {
  title: "NOD — Your AI-Powered Second Brain",
  description:
    "Save technical articles, get AI summaries, and discover related knowledge through semantic similarity search. Your personal knowledge engine.",
  openGraph: {
    title: "NOD — Your AI-Powered Second Brain",
    description:
      "Save technical articles, get AI summaries, and discover related knowledge through semantic similarity search.",
    type: "website",
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const locale = await getLocale();
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        {children}
        {gaId ? <GaPageView gaId={gaId} /> : null}
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  );
}
