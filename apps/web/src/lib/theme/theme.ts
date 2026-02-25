export type WebTheme = "dark" | "light";

export const WEB_THEME_STORAGE_KEY = "nod_web_theme";
const LOCALE_PREFIX_RE = /^\/[a-z]{2}(?:-[A-Za-z]{2})?(?=\/|$)/;

function normalizePathname(pathname: string): string {
  const withoutLocale = (pathname || "/").replace(LOCALE_PREFIX_RE, "");
  if (!withoutLocale || withoutLocale === "/") {
    return "/";
  }
  return withoutLocale.startsWith("/") ? withoutLocale : `/${withoutLocale}`;
}

function getSystemWebTheme(): WebTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function isLandingPath(pathname: string): boolean {
  return normalizePathname(pathname) === "/";
}

export function resolveWebTheme(value: string | null | undefined): WebTheme {
  return value === "dark" ? "dark" : "light";
}

export function resolveThemeForPath(pathname: string, preferredTheme: WebTheme): WebTheme {
  return isLandingPath(pathname) ? "light" : preferredTheme;
}

export function applyWebTheme(theme: WebTheme): void {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

export function getStoredWebTheme(): WebTheme {
  if (typeof window === "undefined") {
    return "light";
  }
  const storedTheme = window.localStorage.getItem(WEB_THEME_STORAGE_KEY);
  return storedTheme === "light" || storedTheme === "dark" ? storedTheme : getSystemWebTheme();
}

export function setStoredWebTheme(theme: WebTheme): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(WEB_THEME_STORAGE_KEY, theme);
  applyWebTheme(theme);
}
