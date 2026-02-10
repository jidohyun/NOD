import { useState, useEffect, useCallback } from "react";
import { STORAGE_KEYS } from "../../lib/constants";

export type Theme = "dark" | "light";

function applyTheme(theme: Theme) {
  document.documentElement.classList.remove("dark", "light");
  document.documentElement.classList.add(theme);
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEYS.THEME, (result) => {
      const saved = result[STORAGE_KEYS.THEME] as Theme | undefined;
      const resolved = saved === "light" || saved === "dark" ? saved : "dark";
      setThemeState(resolved);
      applyTheme(resolved);
    });
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    chrome.storage.local.set({ [STORAGE_KEYS.THEME]: newTheme });
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggle } as const;
}
