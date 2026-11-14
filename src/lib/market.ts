/**
 * Simulated market data. Deterministic from a seed so the server render and the first
 * client render match (no hydration mismatch); the live random walk starts after mount.
 */

export type MarketKey = "BTC" | "ETH" | "SOL" | "HYPE";

export type Market = {
  key: MarketKey;
  px: number;
  anchor: number;
  dec: number; // price decimals
  sdec: number; // size decimals
  step: number; // tick size
  open: number;
  high: number;
  low: number;
  fund: number; // funding %/8h
  oi: number;
  vol: number;
  depth: number; // typical level size
};

export const MARKET_KEYS: MarketKey[] = ["BTC", "ETH", "SOL", "HYPE"];

export function initialMarkets(): Record<MarketKey, Market> {
  const m = (key: MarketKey, v: Omit<Market, "key" | "anchor">): Market => ({ key, anchor: v.px, ...v });
  return {
    BTC: m("BTC", { px: 61204, dec: 1, sdec: 3, step: 2, open: 60098, high: 61940, low: 59720, fund: 0.0091, oi: 1.24e9, vol: 842.1e6, depth: 0.9 }),
    ETH: m("ETH", { px: 3388.5, dec: 1, sdec: 2, step: 0.5, open: 3420, high: 3461.2, low: 3352.8, fund: -0.0034, oi: 612e6, vol: 391.4e6, depth: 12 }),
    SOL: m("SOL", { px: 168.42, dec: 2, sdec: 1, step: 0.02, open: 161.79, high: 170.1, low: 160.9, fund: 0.0127, oi: 288e6, vol: 204.7e6, depth: 140 }),
    HYPE: m("HYPE", { px: 38.06, dec: 3, sdec: 1, step: 0.004, open: 35.76, high: 38.6, low: 35.2, fund: 0.021, oi: 141e6, vol: 96.3e6, depth: 600 }),
  };
}

/** Small seeded PRNG (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const INTERVALS = ["1m", "5m", "15m", "1H", "4H", "1D"] as const;
export type Interval = (typeof INTERVALS)[number];
export const INTERVAL_VOL: Record<Interval, number> = { "1m": 0.0006, "5m": 0.0012, "15m": 0.002, "1H": 0.0035, "4H": 0.006, "1D": 0.012 };
export const INTERVAL_SEC: Record<Interval, number> = { "1m": 60, "5m": 300, "15m": 900, "1H": 3600, "4H": 14400, "1D": 86400 };

/** History that walks backwards from the current price so the last point equals `px`. */
export function genHistory(px: number, iv: Interval, seed: number, n = 140) {
  const r = rng(seed);
  const vol = INTERVAL_VOL[iv];
  let v = px;
  const out = [v];
  for (let i = 1; i < n; i++) {
    v = v / (1 + (r() - 0.5) * 2 * vol + vol * 0.06);
    out.unshift(v);
  }
  return out;
}

/** One mean-reverting tick of the random walk. */
export function stepPrice(m: Market, r: () => number): Market {
  const drift = (r() - 0.5) * 0.0016 + ((m.anchor - m.px) / m.anchor) * 0.02;
  let px = Math.max(m.step, m.px * (1 + drift));
  px = Math.round(px / m.step) * m.step;
  return { ...m, px, high: Math.max(m.high, px), low: Math.min(m.low, px), vol: m.vol + px * m.depth * r() * 0.02 };
}

export type Level = { px: number; sz: number; total: number };

export function buildBook(m: Market, r: () => number, rows = 14) {
  const base = Math.round(m.px / m.step) * m.step;
  const lvl = (i: number) => +(m.depth * (0.15 + r() * 0.9) * (1 + i * 0.08)).toFixed(m.sdec);
  const asks: Level[] = [];
  const bids: Level[] = [];
  let ca = 0;
  let cb = 0;
  for (let i = 0; i < rows; i++) {
    const a = lvl(i);
    ca += a;
    asks.push({ px: base + m.step * (i + 1), sz: a, total: ca });
    const b = lvl(i);
    cb += b;
    bids.push({ px: base - m.step * i, sz: b, total: cb });
  }
  return { asks, bids, max: Math.max(ca, cb) };
}
