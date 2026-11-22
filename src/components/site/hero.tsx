"use client";

import { ArrowLink, CtaLink } from "@/components/ui/cta";
import { useEffect, useState } from "react";
import { BloomPlate, PLATE_DEFAULTS, type PlateSettings } from "@/components/bloom/bloom-plate";
import { PlateTweaker } from "@/components/bloom/plate-tweaker";
import { fmt } from "@/lib/utils";

const STORE = "tendril:hero-plate";

export function Hero() {
  const [plate, setPlate] = useState<PlateSettings>(PLATE_DEFAULTS);
  const [tweak, setTweak] = useState(false);

  // ?tweak in the URL shows the live controls; saved tweaks load in this browser.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const on = new URLSearchParams(window.location.search).has("tweak");
      setTweak(on);
      if (!on) return;
      try {
        const saved = localStorage.getItem(STORE);
        if (saved) setPlate({ ...PLATE_DEFAULTS, ...JSON.parse(saved) });
      } catch {
        /* storage unavailable */
      }
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const update = (v: PlateSettings) => {
    setPlate(v);
    try {
      localStorage.setItem(STORE, JSON.stringify(v));
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden border-b border-border">
      {/* Live Bloom backplate: chart lines that swell into a flower, drawn by the /bloom shader. */}
      <div aria-hidden className="hero-plate pointer-events-none absolute inset-0">
        <BloomPlate src="/bloom/marigold.webp" aspect={1024 / 1021} settings={plate} className="size-full" />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_50%_45%,color-mix(in_srgb,var(--background)_70%,transparent)_0%,transparent_100%)]" />

      {tweak ? <PlateTweaker value={plate} onChange={update} /> : null}

      <div className="relative mx-auto flex max-w-[1440px] flex-col items-center gap-6 px-4 py-28 text-center sm:px-8 md:py-40">
        <p className="enter type-eyebrow text-primary" style={{ "--enter-delay": "0ms" } as React.CSSProperties}>
          <span className="mr-2 inline-block size-1.5 rounded-full bg-primary align-middle motion-safe:animate-[pulse-dot_2s_infinite]" />
          Decentralized prop trading
        </p>
        <h1 id="hero-title" className="enter type-hero max-w-[20ch]" style={{ "--enter-delay": "100ms" } as React.CSSProperties}>
          Trade funded capital
        </h1>
        <p className="enter max-w-[30rem] type-lead text-secondary-text [text-wrap:pretty]" style={{ "--enter-delay": "200ms" } as React.CSSProperties}>
          Buy an evaluation, hit the target, and trade our capital on a live perps terminal. Keep up to 90% of what you make.
        </p>
        <div className="enter flex flex-wrap justify-center gap-3" style={{ "--enter-delay": "300ms" } as React.CSSProperties}>
          <CtaLink href="/#pricing">Buy evaluation</CtaLink>
          <ArrowLink href="/terminal" className="bg-background/40">
            Explore the terminal
          </ArrowLink>
        </div>
        <dl className="enter mt-2 flex overflow-hidden rounded-xl border border-border bg-card/80" style={{ "--enter-delay": "400ms" } as React.CSSProperties}>
          {[
            ["Accounts to", "$100K", false],
            ["Evaluations from", "60 USDC", false],
            ["Max split", "90%", true],
          ].map(([l, v, accent], i) => (
            <div key={l as string} className={`flex flex-col gap-1 px-4 py-3 text-left sm:px-6 ${i < 2 ? "border-r border-border" : ""}`}>
              <dt className="type-label text-muted-foreground">{l}</dt>
              <dd className={`type-stat-lg ${accent ? "text-primary" : "text-foreground"}`}>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function Row({ side, px, sz, total, max, dec = 1, sdec = 3 }: { side: "ask" | "bid"; px: number; sz: number; total: number; max: number; dec?: number; sdec?: number }) {
  return (
    <div className="relative grid h-[22px] grid-cols-3 items-center px-3 type-data-sm">
      <span
        className={`absolute inset-y-px right-0 transition-[width] duration-300 ease-out ${side === "ask" ? "bg-neg-wash" : "bg-pos-wash"}`}
        style={{ width: `${(total / max) * 100}%` }}
      />
      <span className={`relative ${side === "ask" ? "text-destructive" : "text-positive"}`}>{fmt(px, dec)}</span>
      <span className="relative text-right text-secondary-text">{fmt(sz, sdec)}</span>
      <span className="relative text-right text-secondary-text">{fmt(total, sdec)}</span>
    </div>
  );
}
