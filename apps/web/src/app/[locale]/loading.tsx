"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Loading() {
  const t = useTranslations("common");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Loader2 className="size-12 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">{t("loading")}</p>
    </main>
  );
}
