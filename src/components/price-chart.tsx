"use client";

import { useEffect, useRef } from "react";
import { fmt } from "@/lib/utils";

type Props = {
  series: number[];
  dec?: number;
  axis?: boolean;
  grid?: boolean;
  entry?: { price: number; side: "long" | "short"; label: string } | null;
  timeLabels?: (index: number) => string;
  className?: string;
  /** Called with the hovered price/time label, or null when the pointer leaves. */
  onHover?: (info: { price: number; time: string } | null) => void;
};

function cssVar(el: Element, name: string, fallback: string) {
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  return v || fallback;
}

function niceStep(range: number) {
  const raw = range / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / mag;
  return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag;
}

/** Canvas line + area chart. Colours come from the theme tokens, so it follows Dark/Light. */
export function PriceChart({ series, dec = 1, axis = false, grid = true, entry, timeLabels, className, onHover }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const hover = useRef<number | null>(null);
  const draw = useRef<() => void>(() => {});

  draw.current = () => {
    const cv = ref.current;
    if (!cv || series.length < 2) return;
    const w = cv.clientWidth;
    const h = cv.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
    }
    const ctx = cv.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const C = {
      line: cssVar(cv, "--primary", "#97fce4"),
      onLine: cssVar(cv, "--primary-foreground", "#04130e"),
      grid: cssVar(cv, "--border", "#25292e"),
      muted: cssVar(cv, "--muted-foreground", "#7f868f"),
      fg: cssVar(cv, "--foreground", "#fff"),
      raised: cssVar(cv, "--muted", "#1d2024"),
      strong: cssVar(cv, "--input", "#363b41"),
      pos: cssVar(cv, "--positive", "#4ade80"),
      neg: cssVar(cv, "--destructive", "#f87171"),
      mono: getComputedStyle(cv).getPropertyValue("--font-geist-mono").trim() || "ui-monospace, monospace",
    };

    const axisW = axis ? 68 : 0;
    const plotW = w - axisW;
    const top = 16;
    const bot = axis ? h - 24 : h;
    let lo = Math.min(...series);
    let hi = Math.max(...series);
    const pad = (hi - lo) * 0.12 || hi * 0.001;
    lo -= pad;
    hi += pad;
    const y = (v: number) => top + ((hi - v) / (hi - lo)) * (bot - top);
    const step = plotW / (series.length - 1);

    ctx.font = `11px ${C.mono}`;
    if (grid) {
      const st = niceStep(hi - lo);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      for (let v = Math.ceil(lo / st) * st; v <= hi; v += st) {
        const yy = Math.round(y(v)) + 0.5;
        ctx.strokeStyle = C.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, yy);
        ctx.lineTo(plotW, yy);
        ctx.stroke();
        if (axis) {
          ctx.fillStyle = C.muted;
          ctx.fillText(fmt(v, st < 1 ? dec : 0), w - 8, yy);
        }
      }
    }
    if (axis && timeLabels) {
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = C.muted;
      for (let i = 20; i < series.length - 8; i += 30) ctx.fillText(timeLabels(i), i * step, h - 7);
      ctx.strokeStyle = C.grid;
      ctx.beginPath();
      ctx.moveTo(0, bot + 0.5);
      ctx.lineTo(plotW, bot + 0.5);
      ctx.moveTo(plotW + 0.5, 0);
      ctx.lineTo(plotW + 0.5, h);
      ctx.stroke();
    }

    const path = () => {
      ctx.beginPath();
      series.forEach((v, i) => (i ? ctx.lineTo(i * step, y(v)) : ctx.moveTo(0, y(v))));
    };
    path();
    ctx.save();
    ctx.lineTo(plotW, bot);
    ctx.lineTo(0, bot);
    ctx.closePath();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = C.line;
    ctx.fill();
    ctx.restore();
    path();
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (entry && entry.price > lo && entry.price < hi) {
      const yy = Math.round(y(entry.price)) + 0.5;
      const col = entry.side === "long" ? C.pos : C.neg;
      ctx.setLineDash([2, 4]);
      ctx.strokeStyle = col;
      ctx.beginPath();
      ctx.moveTo(0, yy);
      ctx.lineTo(plotW, yy);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = col;
      ctx.fillText(entry.label, 8, yy - 4);
    }

    const last = series[series.length - 1];
    const ly = y(last);
    ctx.fillStyle = C.line;
    ctx.fillRect(plotW - 2, ly - 2, 4, 4);
    if (axis) {
      ctx.fillRect(plotW + 1, ly - 9, axisW - 1, 18);
      ctx.fillStyle = C.onLine;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(fmt(last, dec), w - 8, ly);
    }

    const hx = hover.current;
    if (hx != null && hx < plotW) {
      const i = Math.max(0, Math.min(series.length - 1, Math.round(hx / step)));
      const v = series[i];
      const cx = Math.round(i * step) + 0.5;
      const cy = Math.round(y(v)) + 0.5;
      ctx.strokeStyle = C.strong;
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, bot);
      ctx.moveTo(0, cy);
      ctx.lineTo(plotW, cy);
      ctx.stroke();
      ctx.fillStyle = C.fg;
      ctx.fillRect(cx - 3, cy - 3, 6, 6);
      if (axis) {
        ctx.fillStyle = C.raised;
        ctx.fillRect(plotW + 1, cy - 9, axisW - 1, 18);
        ctx.fillStyle = C.fg;
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(fmt(v, dec), w - 8, cy);
      }
      onHover?.({ price: v, time: timeLabels ? timeLabels(i) : "" });
    }
  };

  useEffect(() => {
    draw.current();
  });

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ro = new ResizeObserver(() => draw.current());
    ro.observe(cv);
    // Redraw when the theme flips so the canvas picks up the new token colours.
    const mo = new MutationObserver(() => draw.current());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={className}
      aria-hidden
      onPointerMove={
        onHover
          ? (e) => {
              hover.current = e.clientX - e.currentTarget.getBoundingClientRect().left;
              draw.current();
            }
          : undefined
      }
      onPointerLeave={
        onHover
          ? () => {
              hover.current = null;
              onHover(null);
              draw.current();
            }
          : undefined
      }
    />
  );
}
