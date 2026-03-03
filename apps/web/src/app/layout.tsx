import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import { Fredoka, Inter, JetBrains_Mono, Quicksand, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { getLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { GaPageView } from "@/components/analytics/ga-page-view";
import { ThemeRouteSync } from "@/components/theme/theme-route-sync";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  display: "swap",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
});

const themeInitScript = `(function(){try{var key='nod_web_theme';var path=window.location.pathname||'/';var normalized=(path.replace(/^/[a-z]{2}(?:-[A-Za-z]{2})?(?=/|$)/,'')||'/');var isLanding=normalized==='/'||normalized==='';var stored=localStorage.getItem(key);var system=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var preferred=stored==='light'||stored==='dark'?stored:system;var theme=isLanding?'light':preferred;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(theme);root.style.colorScheme=theme;}catch(_e){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');document.documentElement.style.colorScheme='light';}})();`;

export const metadata: Metadata = {
  metadataBase: new URL("https://nod-archive.com"),
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
  twitter: {
    card: "summary_large_image",
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const locale = await getLocale();
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang={locale} className="light" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable} ${fredoka.variable} ${quicksand.variable}`}
      >
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <ThemeRouteSync />
        {children}
        {gaId ? <GaPageView gaId={gaId} /> : null}
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  );
}
