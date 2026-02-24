// Theme initialization to prevent flash of wrong theme
try {
  const saved = localStorage.getItem("nod_ext_theme");
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const theme = saved === "light" || saved === "dark" ? saved : systemTheme;
  document.documentElement.classList.remove("dark", "light");
  document.documentElement.classList.add(theme);
  document.documentElement.style.colorScheme = theme;
} catch {
  document.documentElement.classList.add("dark");
  document.documentElement.style.colorScheme = "dark";
}
