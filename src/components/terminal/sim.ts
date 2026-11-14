/**
 * Pure simulation + account logic for the terminal. Every function returns a new state and
 * any events (toasts) it produced, so React state updates stay predictable.
 */
import {
  buildBook,
  genHistory,
  initialMarkets,
  stepPrice,
  toCandles,
  type Candle,
  type Interval,
  type Level,
  type Market,
  type MarketKey,
} from "@/lib/market";
import { fmt, signed, usd } from "@/lib/utils";

export const START = 25000;
export const DAILY = START * 0.03;
export const DD = START * 0.06;
export const TARGET = START * 0.1;
export const FEE = 0.0004;

export type Side = "long" | "short";
export type Position = { id: number; mkt: MarketKey; side: Side; size: number; entry: number; lev: number; tp: number | null; sl: number | null };
export type Order = { id: number; mkt: MarketKey; side: Side; size: number; price: number; lev: number; tp: number | null; sl: number | null; t: string };
export type Fill = { id: number; t: string; mkt: MarketKey; side: Side; size: number; price: number; fee: number; realized: number; reason: string };
export type Trade = { id: number; px: number; sz: number; buy: boolean; t: string };
export type Toast = { id: number; title: string; body?: string; tone?: "pos" | "neg" };

export type Sim = {
  markets: Record<MarketKey, Market>;
  cur: MarketKey;
  iv: Interval;
  series: number[];
  candles: Candle[];
  book: { asks: Level[]; bids: Level[]; max: number };
  tape: Trade[];
  tick: number;
  balance: number;
  dayStart: number;
  positions: Position[];
  orders: Order[];
  fills: Fill[];
  breached: string | null;
  nextId: number;
};

const clock = (d = new Date()) => d.toTimeString().slice(0, 8);

export function seriesSeed(mkt: MarketKey, iv: Interval) {
  return mkt.charCodeAt(0) * 97 + iv.length * 13 + iv.charCodeAt(0);
}

export function initialSim(r: () => number): Sim {
  const markets = initialMarkets();
  return {
    markets,
    cur: "BTC",
    iv: "15m",
    series: genHistory(markets.BTC.px, "15m", seriesSeed("BTC", "15m")),
    candles: toCandles(genHistory(markets.BTC.px, "15m", seriesSeed("BTC", "15m")), seriesSeed("BTC", "15m") + 1),
    book: buildBook(markets.BTC, r),
    tape: [],
    tick: 0,
    balance: 25176.79,
    dayStart: 26070,
    positions: [
      { id: 1, mkt: "BTC", side: "long", size: 0.842, entry: 60412.0, lev: 5, tp: null, sl: null },
      { id: 2, mkt: "ETH", side: "short", size: 4.1, entry: 3412.0, lev: 3, tp: null, sl: null },
    ],
    orders: [],
    fills: [],
    breached: null,
    nextId: 3,
  };
}

/* ── derived values ─────────────────────────────────────── */
export const pnl = (s: Sim, p: Position) => (s.markets[p.mkt].px - p.entry) * p.size * (p.side === "long" ? 1 : -1);
export const liqOf = (entry: number, side: Side, lev: number) => (side === "long" ? entry * (1 - 0.5 / lev) : entry * (1 + 0.5 / lev));
export const equity = (s: Sim) => s.balance + s.positions.reduce((a, p) => a + pnl(s, p), 0);
export const usedMargin = (s: Sim) =>
  s.positions.reduce((a, p) => a + (p.size * s.markets[p.mkt].px) / p.lev, 0) + s.orders.reduce((a, o) => a + (o.size * o.price) / o.lev, 0);
export const available = (s: Sim) => Math.max(0, equity(s) - usedMargin(s));
export const maxSize = (s: Sim, px: number, lev: number) => (available(s) * lev) / px / (1 + FEE * lev);

/* ── fills ──────────────────────────────────────────────── */
export function fill(s: Sim, mkt: MarketKey, side: Side, size: number, price: number, lev: number, tp: number | null, sl: number | null, reason: string) {
  let positions = s.positions.map((p) => ({ ...p }));
  let nextId = s.nextId;
  let realized = 0;
  const p = positions.find((x) => x.mkt === mkt);
  if (!p) positions.push({ id: nextId++, mkt, side, size, entry: price, lev, tp, sl });
  else if (p.side === side) {
    p.entry = (p.entry * p.size + price * size) / (p.size + size);
    p.size += size;
    p.lev = lev;
    if (tp != null) p.tp = tp;
    if (sl != null) p.sl = sl;
  } else {
    const q = Math.min(size, p.size);
    realized = (price - p.entry) * q * (p.side === "long" ? 1 : -1);
    p.size = +(p.size - q).toFixed(8);
    const rem = +(size - q).toFixed(8);
    if (p.size <= 1e-9) positions = positions.filter((x) => x !== p);
    if (rem > 0) positions.push({ id: nextId++, mkt, side, size: rem, entry: price, lev, tp, sl });
  }
  const fee = size * price * FEE;
  const f: Fill = { id: nextId++, t: clock(), mkt, side, size, price, fee, realized, reason };
  return { sim: { ...s, positions, nextId, balance: s.balance + realized - fee, fills: [f, ...s.fills].slice(0, 100) }, realized, fee };
}

export function closePosition(s: Sim, id: number, reason = "Close") {
  const p = s.positions.find((x) => x.id === id);
  if (!p) return { sim: s, toast: null };
  const r = fill(s, p.mkt, p.side === "long" ? "short" : "long", p.size, s.markets[p.mkt].px, p.lev, null, null, reason);
  const toast: Omit<Toast, "id"> = {
    title: `${reason === "Close" ? "Closed" : reason} ${p.mkt}-PERP ${p.side.toUpperCase()}`,
    body: `Realized ${signed(r.realized)} USDC`,
    tone: r.realized >= 0 ? "pos" : "neg",
  };
  return { sim: r.sim, toast };
}

/* ── market switching ───────────────────────────────────── */
export function withMarket(s: Sim, cur: MarketKey, iv: Interval, r: () => number): Sim {
  const m = s.markets[cur];
  const series = genHistory(m.px, iv, seriesSeed(cur, iv));
  return { ...s, cur, iv, series, candles: toCandles(series, seriesSeed(cur, iv) + 1), book: buildBook(m, r), tape: [] };
}

/* ── one simulation tick ────────────────────────────────── */
export function step(s0: Sim, r: () => number) {
  const toasts: Omit<Toast, "id">[] = [];
  const markets = { ...s0.markets };
  for (const k of Object.keys(markets) as MarketKey[]) markets[k] = stepPrice(markets[k], r);
  let s: Sim = { ...s0, markets, tick: s0.tick + 1 };
  const m = markets[s.cur];

  const series = s.series.slice();
  series[series.length - 1] = m.px;
  if (s.tick % 6 === 0) {
    series.push(m.px);
    series.shift();
  }
  s.series = series;
  // The live candle tracks the mark; a new one opens when the series rolls.
  const candles = s.candles.slice();
  const lastC = candles[candles.length - 1];
  candles[candles.length - 1] = { ...lastC, c: m.px, h: Math.max(lastC.h, m.px), l: Math.min(lastC.l, m.px), v: lastC.v + r() * 0.12 };
  if (s.tick % 6 === 0) {
    candles.push({ o: m.px, h: m.px, l: m.px, c: m.px, v: 0.05 });
    candles.shift();
  }
  s.candles = candles;
  s.book = buildBook(m, r);
  if (r() < 0.7) {
    const buy = r() > 0.48;
    const t: Trade = {
      id: s.tick,
      px: m.px + (buy ? 1 : -1) * m.step * Math.floor(r() * 2),
      sz: +(m.depth * r() * 0.4 + m.depth * 0.01).toFixed(m.sdec),
      buy,
      t: clock(),
    };
    s.tape = [t, ...s.tape].slice(0, 60);
  }

  // limit orders
  const keep: Order[] = [];
  for (const o of s.orders) {
    const px = markets[o.mkt].px;
    const hit = o.side === "long" ? px <= o.price : px >= o.price;
    if (!hit) {
      keep.push(o);
      continue;
    }
    const res = fill({ ...s, orders: keep }, o.mkt, o.side, o.size, o.price, o.lev, o.tp, o.sl, "Limit");
    s = res.sim;
    const mk = markets[o.mkt];
    toasts.push({
      title: `Limit filled · ${o.side === "long" ? "BUY" : "SELL"} ${fmt(o.size, mk.sdec)} ${o.mkt}`,
      body: `at ${fmt(o.price, mk.dec)} · fee ${usd(res.fee)}`,
      tone: o.side === "long" ? "pos" : "neg",
    });
  }
  s.orders = keep;

  // take profit / stop loss
  for (const p of [...s.positions]) {
    const px = markets[p.mkt].px;
    const L = p.side === "long";
    const reason = p.tp && (L ? px >= p.tp : px <= p.tp) ? "Take profit" : p.sl && (L ? px <= p.sl : px >= p.sl) ? "Stop loss" : null;
    if (reason) {
      const res = closePosition(s, p.id, reason);
      s = res.sim;
      if (res.toast) toasts.push(res.toast);
    }
  }

  // evaluation rules
  if (!s.breached) {
    const eq = equity(s);
    const breached = s.dayStart - eq >= DAILY ? "max daily loss (3%)" : START - eq >= DD ? "max drawdown (6%)" : null;
    if (breached) {
      s = { ...s, breached, orders: [] };
      toasts.push({ title: "Rule breached", body: breached, tone: "neg" });
    }
  }
  return { sim: s, toasts };
}
