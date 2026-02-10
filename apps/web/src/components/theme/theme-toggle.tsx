"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  applyWebTheme,
  getStoredWebTheme,
  setStoredWebTheme,
  type WebTheme,
} from "@/lib/theme/theme";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<WebTheme>("dark");

  useEffect(() => {
    const storedTheme = getStoredWebTheme();
    setTheme(storedTheme);
    applyWebTheme(storedTheme);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme: WebTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    setStoredWebTheme(nextTheme);
  };

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Toggle theme"
        title="Toggle theme"
        className={className}
        disabled
      >
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={className}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
