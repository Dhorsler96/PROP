"use client";

import { useEffect, useState } from "react";
import { Toaster as Sonner, toast, type ToasterProps } from "sonner";

/**
 * shadcn-style Sonner toaster, styled with the Prop tokens. Follows the site's
 * data-theme attribute (not the OS setting), so it flips with the theme toggle.
 */
export function Toaster(props: ToasterProps) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const read = () => setTheme(document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    // Sync on the next frame rather than synchronously inside the effect.
    const raf = requestAnimationFrame(read);
    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
    };
  }, []);

  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      visibleToasts={4}
      duration={3600}
      gap={8}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--input)",
          "--border-radius": "var(--radius-lg)",
          "--width": "356px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "!font-sans !shadow-pop !gap-2.5 !px-3.5 !py-3",
          title: "!type-data !font-normal !text-foreground",
          description: "!type-body-sm !text-secondary-text",
          icon: "!size-1.5 !min-w-1.5 !m-0 !self-start !mt-[7px]",
        },
      }}
      {...props}
    />
  );
}

/** Push a toast with a small tone dot, matching the terminal's status colours. */
export function notify({ title, body, tone }: { title: string; body?: string; tone?: "pos" | "neg" }) {
  const dot = tone === "pos" ? "bg-positive" : tone === "neg" ? "bg-destructive" : "bg-primary";
  toast(title, {
    description: body,
    icon: <span aria-hidden className={`block size-1.5 rounded-full ${dot}`} />,
  });
}
