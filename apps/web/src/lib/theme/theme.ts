export type WebTheme = "dark" | "light";

export const WEB_THEME_STORAGE_KEY = "nod_web_theme";

export function resolveWebTheme(value: string | null | undefined): WebTheme {
  return value === "light" ? "light" : "dark";
}

export function applyWebTheme(theme: WebTheme): void {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
}

export function getStoredWebTheme(): WebTheme {
  if (typeof window === "undefined") {
    return "dark";
  }
  return resolveWebTheme(window.localStorage.getItem(WEB_THEME_STORAGE_KEY));
}

export function setStoredWebTheme(theme: WebTheme): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(WEB_THEME_STORAGE_KEY, theme);
  applyWebTheme(theme);
}
