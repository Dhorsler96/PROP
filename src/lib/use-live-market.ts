"use client";

import { useEffect, useState } from "react";
import { genHistory, initialMarkets, rng, stepPrice, type Interval, type MarketKey } from "./market";

/**
 * A single live market for marketing visuals. Starts from a deterministic history (matches
 * the server render), then ticks after mount. Slower under reduced motion.
 */
export function useLiveMarket(key: MarketKey = "BTC", iv: Interval = "15m", seed = 7, points = 120) {
  const [state, setState] = useState(() => {
    const m = initialMarkets()[key];
    return { m, series: genHistory(m.px, iv, seed, points), tick: 0 };
  });

  useEffect(() => {
    const r = rng(seed * 31 + 1);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setInterval(
      () =>
        setState((s) => {
          const m = stepPrice(s.m, r);
          const series = s.series.slice();
          series[series.length - 1] = m.px;
          if (s.tick % 5 === 4) {
            series.push(m.px);
            series.shift();
          }
          return { m, series, tick: s.tick + 1 };
        }),
      reduce ? 2500 : 800,
    );
    return () => window.clearInterval(id);
  }, [seed]);

  return state;
}
