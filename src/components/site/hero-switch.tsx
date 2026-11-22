"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Hero } from "./hero";
import { HeroTerminal } from "./hero-terminal";

type Variant = "classic" | "terminal";
const STORE = "tendril:hero";
const OPTIONS: [Variant, string][] = [
  ["classic", "Classic"],
  ["terminal", "Terminal"],
];

/**
 * Homepage hero with a small switch in its bottom-right corner to flip between the
 * original hero and the terminal-snapshot hero. The choice is remembered in this
 * browser. After a switch the new hero's entrance plays straight away (the loader
 * delay only applies to the first view).
 */
export function HeroSwitch({ initial = "classic" }: { initial?: Variant }) {
  const [variant, setVariant] = useState<Variant>(initial);
  const [switched, setSwitched] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem(STORE);
        if (saved === "classic" || saved === "terminal") setVariant(saved);
      } catch {
        /* storage unavailable */
      }
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const choose = (v: Variant) => {
    if (v === variant) return;
    setVariant(v);
    setSwitched(true);
    try {
      localStorage.setItem(STORE, v);
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <div className="relative" data-hero-switched={switched || undefined}>
      {variant === "terminal" ? <HeroTerminal /> : <Hero />}
      <div
        role="radiogroup"
        aria-label="Hero style"
        className="absolute right-4 bottom-4 z-20 flex items-center gap-0.5 rounded-md border border-input bg-background/70 p-0.5 backdrop-blur-md"
      >
        {OPTIONS.map(([v, label]) => {
          const on = v === variant;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => choose(v)}
              className={cn(
                "h-6 rounded-sm px-2 text-xs leading-none transition-[background-color,color,scale] duration-150 ease-out motion-safe:active:scale-[0.96]",
                on ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
