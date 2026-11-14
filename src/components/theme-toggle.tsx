"use client";

import { useLayoutEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "dark" | "light";

// better-ui icon cross-fade: scale 0.25 → 1, opacity 0 → 1, blur 4px → 0, 300ms.
const EASE = "cubic-bezier(0.2, 0, 0, 1)";
const ICON_MOTION = `opacity 300ms ${EASE}, scale 300ms ${EASE}, filter 300ms ${EASE}`;
const ICON_FADE = `opacity 300ms ${EASE}`;

/**
 * Flips data-theme on <html> and persists it. Every colour transition is suppressed for
 * the swap so the page doesn't smear (better-ui theme-switch recipe); the icon alone keeps
 * its cross-fade.
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
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const style = document.createElement("style");
    style.append(
      document.createTextNode(
        `*,*::before,*::after{transition:none !important}` +
          `[data-theme-icon]{transition:${reduce ? ICON_FADE : ICON_MOTION} !important}`,
      ),
    );
    document.head.append(style);
    document.documentElement.setAttribute("data-theme", next);
    void document.body.offsetHeight; // flush styles while transitions are off
    window.setTimeout(() => style.remove(), 320); // keep the icon's 300ms cross-fade alive
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setTheme(next);
  }

  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  const icon = (shown: boolean) =>
    cn(
      "absolute size-3.5 transition-[opacity,scale,filter] duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
      shown ? "scale-100 opacity-100 blur-[0px]" : "opacity-0 motion-safe:scale-25 motion-safe:blur-[4px]",
    );

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        "relative inline-flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground",
        "transition-[color,border-color,scale] duration-150 ease-out hover:border-input hover:text-foreground",
        "motion-safe:active:scale-[0.96]",
        className,
      )}
    >
      {/* Both icons stay in the DOM so they can cross-fade. */}
      <Sun data-theme-icon aria-hidden className={icon(theme === "dark")} strokeWidth={1.5} />
      <Moon data-theme-icon aria-hidden className={icon(theme === "light")} strokeWidth={1.5} />
    </button>
  );
}
