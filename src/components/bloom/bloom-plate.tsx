"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { initBloom, setPaletteUniforms, uploadThreshold } from "./gl";
import { PALETTES } from "./palettes";
import { PLATE_DEFAULTS, type PlateSettings } from "./plate-settings";

/**
 * A live Bloom backplate: the same shader as /bloom, drawn behind content.
 * The lines drift and breathe slowly. It pauses off screen, draws a single still
 * frame under reduced motion, and stays hidden (showing whatever sits beneath it)
 * if WebGL or the threshold image is unavailable.
 */
export { PLATE_DEFAULTS, type PlateSettings } from "./plate-settings";

export function BloomPlate({
  src,
  aspect,
  settings = PLATE_DEFAULTS,
  growMs = 2200,
  className,
}: {
  src: string;
  aspect: number;
  settings?: PlateSettings;
  /** How long the lines take to grow in from the centre. */
  growMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  // The frame loop reads settings through a ref so tweaks apply without restarting WebGL.
  const settingsRef = useRef(settings);
  const kickRef = useRef<() => void>(() => {});
  useEffect(() => {
    settingsRef.current = settings;
    kickRef.current();
  }, [settings]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = initBloom(canvas);
    if (!ctx) return;
    const { gl, u } = ctx;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let visible = true;
    let loaded = false;
    let cancelled = false;
    const start = performance.now();

    const draw = (now: number) => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      const w = Math.max(2, Math.round(r.width * dpr));
      const h = Math.max(2, Math.round(r.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const st = settingsRef.current;
      const css = getComputedStyle(document.documentElement);
      const light = document.documentElement.getAttribute("data-theme") === "light";
      gl.viewport(0, 0, w, h);
      gl.uniform2f(u.uRes, w, h);
      gl.uniform2f(u.uPos, st.x, st.y);
      gl.uniform1f(u.uTime, reduced ? 0 : ((now - start) / 1000) * st.motion);
      gl.uniform1f(u.uSeed, 7);
      // zoom 1 fits the whole flower to the plate height rather than covering its width.
      gl.uniform1f(u.uScale, Math.min(1, r.height / r.width) * st.zoom);
      gl.uniform1f(u.uCols, Math.min(r.width, r.height) / st.spacing);
      gl.uniform1f(u.uDash, 0.14);
      gl.uniform1f(u.uGrain, st.grain);
      // Colour plates are pictures, so they look the same in both themes.
      gl.uniform1f(u.uInk, light && !st.palette ? st.ink * 0.65 : st.ink);
      gl.uniform1f(u.uStem, 0);
      gl.uniform1f(u.uGrow, reduced ? 1 : Math.min(1, (now - start) / growMs));
      gl.uniform1f(u.uMode, 1);
      gl.uniform1f(u.uImgAspect, aspect);
      gl.uniform1f(u.uThresh, st.threshold);
      gl.uniform1f(u.uGain, st.contrast);
      gl.uniform1f(u.uInvert, 0);
      gl.uniform1i(u.uImg, 0);
      if (st.palette) setPaletteUniforms(ctx, PALETTES[st.palette]);
      else setPaletteUniforms(ctx, { bg: css.getPropertyValue("--hp-bg-page").trim() || "#14120b" });
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const loop = (now: number) => {
      draw(now);
      raf = !reduced && visible ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      if (loaded && !raf) raf = requestAnimationFrame(loop);
    };
    kickRef.current = kick;

    const img = new Image();
    img.onload = () => {
      if (cancelled || !uploadThreshold(gl, img)) return;
      loaded = true;
      setReady(true);
      kick();
    };
    img.src = src;

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) kick();
    });
    io.observe(canvas);
    // Still frames need a redraw on resize and theme change.
    const ro = new ResizeObserver(kick);
    ro.observe(canvas);
    const mo = new MutationObserver(kick);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      mo.disconnect();
    };
  }, [src, aspect, growMs]);

  return <canvas ref={ref} aria-hidden className={cn("transition-[opacity] duration-700 ease-out", ready ? "opacity-100" : "opacity-0", className)} />;
}
