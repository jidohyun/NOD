"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  const t = useTranslations("errors");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-24">
      <h1 className="text-2xl font-bold text-destructive sm:text-4xl">Error</h1>
      <p className="mt-4 text-muted-foreground">{t("somethingWrong")}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {t("tryAgain")}
      </button>
    </main>
  );
}
