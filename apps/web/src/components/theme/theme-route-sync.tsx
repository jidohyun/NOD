"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { applyWebTheme, getStoredWebTheme, resolveThemeForPath } from "@/lib/theme/theme";

export function ThemeRouteSync() {
  const pathname = usePathname();

  useEffect(() => {
    const preferredTheme = getStoredWebTheme();
    applyWebTheme(resolveThemeForPath(pathname ?? "/", preferredTheme));
  }, [pathname]);

  return null;
}
