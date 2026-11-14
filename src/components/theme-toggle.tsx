"use client";

import { useLayoutEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "dark" | "light";

/**
 * Flips data-theme on <html> and persists it. Transitions are suppressed for the swap
 * so every colour transition doesn't fire at once (better-ui: theme-switch recipe).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useLayoutEffect(() => {
    // Re-apply after the dev Strict Mode remount; no-op in production.
    const saved = (() => {
      try {
        return localStorage.getItem("theme");
      } catch {
        return null;
      }
    })();
    const t: Theme = saved === "light" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", t);
    setTheme(t);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const style = document.createElement("style");
    style.append(document.createTextNode("*,*::before,*::after{transition:none !important}"));
    document.head.append(style);
    document.documentElement.setAttribute("data-theme", next);
    void document.body.offsetHeight; // flush styles while transitions are off
    requestAnimationFrame(() => requestAnimationFrame(() => style.remove()));
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setTheme(next);
  }

  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground",
        "transition-[color,border-color,scale] duration-150 ease-out hover:border-input hover:text-foreground",
        "motion-safe:active:scale-[0.96]",
        className,
      )}
    >
      {theme === "dark" ? <Sun className="size-3.5" strokeWidth={1.5} /> : <Moon className="size-3.5" strokeWidth={1.5} />}
    </button>
  );
}
