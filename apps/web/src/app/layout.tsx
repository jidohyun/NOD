import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import Script from "next/script";
import { getLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { GaPageView } from "@/components/analytics/ga-page-view";
import "./globals.css";

const themeInitScript = `(function(){try{var key='nod_web_theme';var stored=localStorage.getItem(key);var theme=stored==='light'||stored==='dark'?stored:'dark';var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(theme);}catch(_e){document.documentElement.classList.add('dark');}})();`;

export const metadata: Metadata = {
  title: "NOD — Your AI-Powered Second Brain",
  description:
    "Save technical articles, get AI summaries, and discover related knowledge through semantic similarity search. Your personal knowledge engine.",
  icons: {
    icon: [
      { url: "/brand/nod-favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/nod-favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/brand/nod-favicon-32.png",
    apple: [{ url: "/brand/nod-apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
    <html lang={locale} className="dark" suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        {children}
        {gaId ? <GaPageView gaId={gaId} /> : null}
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  );
}
