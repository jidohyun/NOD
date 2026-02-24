import { useState, useEffect, useCallback } from "react";
import { STORAGE_KEYS } from "../../lib/constants";

export type Theme = "dark" | "light";

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function persistTheme(theme: Theme) {
  try {
    localStorage.setItem("nod_ext_theme", theme);
  } catch {
    return;
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.remove("dark", "light");
  document.documentElement.classList.add(theme);
  document.documentElement.style.colorScheme = theme;
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => getSystemTheme());

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEYS.THEME, (result) => {
      const saved = result[STORAGE_KEYS.THEME] as Theme | undefined;
      const resolved = saved === "light" || saved === "dark" ? saved : getSystemTheme();
      setThemeState(resolved);
      applyTheme(resolved);
      persistTheme(resolved);
    });
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    chrome.storage.local.set({ [STORAGE_KEYS.THEME]: newTheme });
    persistTheme(newTheme);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggle } as const;
}
