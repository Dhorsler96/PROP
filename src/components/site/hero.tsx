"use client";

import { ButtonLink } from "@/components/ui/button";
import { PriceChart } from "@/components/price-chart";
import { useLiveMarket } from "@/lib/use-live-market";
import { fmt, signed } from "@/lib/utils";
import { buildBook, rng } from "@/lib/market";
import { useMemo } from "react";

export function Hero() {
  const { m, series, tick } = useLiveMarket("BTC", "15m", 11, 140);
  const book = useMemo(() => buildBook(m, rng(1000 + tick), 16), [m, tick]);
  const chg = (m.px / m.open - 1) * 100;

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden border-b border-border">
      {/* Ghost terminal: a dimmed, live, read-only terminal behind the headline */}
      <div aria-hidden className="pointer-events-none absolute inset-0 grid grid-cols-1 grid-rows-[56px_1fr] opacity-35 md:grid-cols-[1fr_300px]">
        <div className="col-span-full flex items-center gap-8 overflow-hidden border-b border-border px-6 whitespace-nowrap">
          <Stat label="Market" value="BTC-PERP" />
          <Stat label="Mark" value={fmt(m.px, 1)} />
          <Stat label="24h change" value={`${signed(chg)}%`} tone={chg >= 0 ? "pos" : "neg"} />
          <Stat label="Funding" value={`${signed(m.fund, 4)}%`} tone="pos" />
          <Stat label="Open interest" value="$1.24B" />
        </div>
        <PriceChart series={series} className="size-full" />
        <div className="hidden flex-col overflow-hidden border-l border-border bg-card md:flex">
          {[...book.asks].reverse().map((l) => (
            <Row key={`a${l.px}`} side="ask" px={l.px} sz={l.sz} total={l.total} max={book.max} />
          ))}
          {book.bids.map((l) => (
            <Row key={`b${l.px}`} side="bid" px={l.px} sz={l.sz} total={l.total} max={book.max} />
          ))}
        </div>
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,var(--background)_0%,color-mix(in_srgb,var(--background)_55%,transparent)_60%,transparent_100%)]" />

      <div className="relative mx-auto flex max-w-[1440px] flex-col items-center gap-7 px-4 py-28 text-center sm:px-8 md:py-40">
        <p className="enter type-label text-primary" style={{ "--enter-delay": "0ms" } as React.CSSProperties}>
          <span className="mr-2 inline-block size-1.5 rounded-full bg-primary align-middle motion-safe:animate-[pulse-dot_2s_infinite]" />
          Decentralized prop trading
        </p>
        <h1 id="hero-title" className="enter type-hero max-w-[14ch]" style={{ "--enter-delay": "100ms" } as React.CSSProperties}>
          Trade funded capital
        </h1>
        <p className="enter max-w-[36rem] type-body-md text-secondary-text [text-wrap:pretty]" style={{ "--enter-delay": "200ms" } as React.CSSProperties}>
          Buy an evaluation, hit the target, and trade our capital on a live perps terminal. Keep up to 90% of what you make.
        </p>
        <div className="enter flex flex-wrap justify-center gap-3" style={{ "--enter-delay": "300ms" } as React.CSSProperties}>
          <ButtonLink href="/#pricing" size="lg" shortcut="B">
            Buy evaluation
          </ButtonLink>
          <ButtonLink href="/terminal" variant="outline" size="lg" shortcut="T" className="bg-background/40">
            Explore the terminal
          </ButtonLink>
        </div>
        <dl className="enter mt-2 flex overflow-hidden rounded-xl border border-border bg-card/80" style={{ "--enter-delay": "400ms" } as React.CSSProperties}>
          {[
            ["Accounts to", "$100K", false],
            ["Evaluations from", "60 USDC", false],
            ["Max split", "90%", true],
          ].map(([l, v, mint], i) => (
            <div key={l as string} className={`flex flex-col gap-1 px-4 py-3 text-left sm:px-6 ${i < 2 ? "border-r border-border" : ""}`}>
              <dt className="type-label text-muted-foreground">{l}</dt>
              <dd className={`type-stat-lg ${mint ? "text-primary" : "text-foreground"}`}>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="type-label text-muted-foreground">{label}</span>
      <span className={`type-data ${tone === "pos" ? "text-positive" : tone === "neg" ? "text-destructive" : "text-foreground"}`}>{value}</span>
    </div>
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
