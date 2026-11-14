"use client";

import { useMemo } from "react";
import { PriceChart } from "@/components/price-chart";
import { useLiveMarket } from "@/lib/use-live-market";
import { buildBook, rng } from "@/lib/market";
import { fmt, signed } from "@/lib/utils";
import { Row } from "./hero";

export function TerminalPreview() {
  const { m, series, tick } = useLiveMarket("BTC", "15m", 29, 80);
  const book = useMemo(() => buildBook(m, rng(2000 + tick), 2), [m, tick]);
  const chg = (m.px / m.open - 1) * 100;
  return (
    <div className="flex flex-col bg-card" aria-label="Live BTC-PERP preview">
      <div className="flex items-center gap-6 border-b border-border px-5 py-2.5">
        <span className="type-data font-medium text-foreground">BTC-PERP</span>
        <span className="type-data text-foreground">{fmt(m.px, 1)}</span>
        <span className={`type-data ${chg >= 0 ? "text-positive" : "text-destructive"}`}>{signed(chg)}%</span>
        <span className="ml-auto type-label text-primary">
          <span className="mr-1.5 inline-block size-1.5 bg-primary align-middle motion-safe:animate-[pulse-dot_2s_infinite]" />
          Live
        </span>
      </div>
      <div className="h-64 border-b border-border">
        <PriceChart series={series} className="size-full" />
      </div>
      <div className="grid grid-cols-3 border-b border-border px-3 py-1.5 type-label text-muted-foreground">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Total</span>
      </div>
      {[...book.asks].reverse().map((l) => (
        <Row key={`a${l.px}`} side="ask" px={l.px} sz={l.sz} total={l.total} max={book.max} />
      ))}
      <div className="flex justify-between border-y border-border px-3 py-1.5 type-label text-muted-foreground">
        <span>Spread</span>
        <span className="type-data-sm text-foreground normal-case tracking-normal">
          {fmt(book.asks[0].px - book.bids[0].px, 1)} · {(((book.asks[0].px - book.bids[0].px) / m.px) * 100).toFixed(3)}%
        </span>
      </div>
      {book.bids.map((l) => (
        <Row key={`b${l.px}`} side="bid" px={l.px} sz={l.sz} total={l.total} max={book.max} />
      ))}
      <div className="h-3" />
    </div>
  );
}
