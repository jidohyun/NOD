"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

type GaPageViewProps = {
  gaId?: string;
};

export function GaPageView({ gaId }: GaPageViewProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!gaId) return;
    if (typeof window === "undefined") return;
    if (typeof window.gtag !== "function") return;

    const query = searchParams.toString();
    const pagePath = query.length > 0 ? `${pathname}?${query}` : pathname;

    window.gtag("config", gaId, {
      page_path: pagePath,
    });
  }, [gaId, pathname, searchParams]);

  return null;
}
