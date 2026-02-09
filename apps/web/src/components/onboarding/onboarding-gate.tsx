"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { usePathname, useRouter } from "@/lib/i18n/routing";

const LOCALE_PREFIX_RE = /^\/(ko|en|ja)(?=\/|$)/;

type UserMeResponse = {
  onboarding_completed_at: string | null;
};

export function OnboardingGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const pathWithoutLocale = pathname.replace(LOCALE_PREFIX_RE, "") || "/";
  const [status, setStatus] = useState<"checking" | "allowed">("checking");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const { data } = await apiClient.get<UserMeResponse>("/api/users/me");
        if (cancelled) return;

        if (!data.onboarding_completed_at && pathWithoutLocale !== "/onboarding") {
          router.replace("/onboarding");
          return;
        }

        setStatus("allowed");
      } catch {
        if (!cancelled) {
          setStatus("allowed");
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router, pathWithoutLocale]);

  if (status !== "allowed") {
    return <div className="py-12 text-center text-muted-foreground">Loading...</div>;
  }

  return children;
}
