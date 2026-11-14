"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, RotateCcw, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CtaButton } from "@/components/ui/cta";
import { Slider } from "@/components/ui/misc";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { FRAG, VERT } from "./shader";

// Backplate grounds. Bars are drawn tone on tone, so one colour defines a plate.
const PALETTES = {
  clay: { label: "Clay", bg: "#e8853d" },
  brand: { label: "Brand", bg: "#7297f6" },
  growth: { label: "Growth", bg: "#8dcd8e" },
  paper: { label: "Paper", bg: "#f1f1ee" },
  ink: { label: "Ink", bg: "#1b1816" },
} as const;
type Palette = keyof typeof PALETTES;

const FORMATS = {
  "1:1": [1, 1],
  "4:5": [4, 5],
  "16:9": [16, 9],
  "9:16": [9, 16],
} as const;
type Format = keyof typeof FORMATS;

type Params = {
  seed: number;
  petals: number;
  layers: number;
  scale: number;
  x: number;
  y: number;
  cols: number;
  cover: number;
  dash: number;
  grain: number;
  ink: number;
};

const DEFAULTS: Params = { seed: 7, petals: 6, layers: 4, scale: 1.15, x: 0, y: 0.1, cols: 44, cover: 0.8, dash: 0.3, grain: 1, ink: 0.3 };

const UNIFORMS = ["uRes", "uPos", "uTime", "uSeed", "uPetals", "uLayers", "uScale", "uCols", "uCover", "uDash", "uGrain", "uStem", "uGrow", "uInk", "uBg"] as const;

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function BloomStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<{ gl: WebGLRenderingContext; u: Record<string, WebGLUniformLocation | null> } | null>(null);
  const [params, setParams] = useState<Params>(DEFAULTS);
  const [palette, setPalette] = useState<Palette>("clay");
  const [format, setFormat] = useState<Format>("1:1");
  const [cards, setCards] = useState(false);
  const [stem, setStem] = useState(true);
  const [live, setLive] = useState(true);
  const [failed, setFailed] = useState(false);

  // Everything the draw call reads lives in a ref so the frame loop never goes stale.
  const stateRef = useRef({ params, palette, stem, live, growStart: 0, time: 0 });
  stateRef.current = { ...stateRef.current, params, palette, stem, live };

  const draw = useCallback((now: number) => {
    const ctx = glRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const { gl, u } = ctx;
    const s = stateRef.current;
    if (s.live) s.time = now / 1000;
    const grow = Math.min(1, (now - s.growStart) / 2600);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(u.uRes, canvas.width, canvas.height);
    gl.uniform2f(u.uPos, s.params.x, s.params.y);
    gl.uniform1f(u.uTime, s.time);
    gl.uniform1f(u.uSeed, s.params.seed);
    gl.uniform1f(u.uPetals, s.params.petals);
    gl.uniform1f(u.uLayers, s.params.layers);
    gl.uniform1f(u.uScale, s.params.scale);
    gl.uniform1f(u.uCols, s.params.cols);
    gl.uniform1f(u.uCover, s.params.cover);
    gl.uniform1f(u.uDash, s.params.dash);
    gl.uniform1f(u.uGrain, s.params.grain);
    gl.uniform1f(u.uInk, s.params.ink);
    gl.uniform1f(u.uStem, s.stem ? 1 : 0);
    gl.uniform1f(u.uGrow, grow);
    gl.uniform3fv(u.uBg, rgb(PALETTES[s.palette].bg));
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return grow;
  }, []);

  // Set up WebGL once.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false });
    if (!gl) {
      setFailed(true);
      return;
    }
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? "shader");
      return sh;
    };
    try {
      const prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? "link");
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "aPos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      const u: Record<string, WebGLUniformLocation | null> = {};
      for (const name of UNIFORMS) u[name] = gl.getUniformLocation(prog, name);
      glRef.current = { gl, u };
    } catch (e) {
      console.error(e);
      setFailed(true);
      return;
    }
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setLive(false);
      stateRef.current.growStart = -1e6; // fully grown, no growth animation
    } else {
      stateRef.current.growStart = performance.now();
    }

    // Keep the drawing buffer matched to the displayed size.
    const fit = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(2, Math.round(r.width * dpr));
      canvas.height = Math.max(2, Math.round(r.height * dpr));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);

    let raf = 0;
    const loop = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [draw]);

  const set = <K extends keyof Params>(k: K, v: Params[K]) => setParams((p) => ({ ...p, [k]: v }));
  const regrow = () => {
    stateRef.current.growStart = performance.now();
  };
  const shuffle = () => {
    set("seed", Math.floor(Math.random() * 999) + 1);
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) regrow();
  };

  const exportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas || !glRef.current) return;
    const [w, h] = FORMATS[format];
    const long = 2400;
    const prev = [canvas.width, canvas.height];
    canvas.width = w >= h ? long : Math.round((long * w) / h);
    canvas.height = h >= w ? long : Math.round((long * h) / w);
    const keep = stateRef.current.growStart;
    stateRef.current.growStart = -1e6; // export the full bloom
    draw(performance.now());
    const url = canvas.toDataURL("image/png");
    stateRef.current.growStart = keep;
    canvas.width = prev[0];
    canvas.height = prev[1];
    const a = document.createElement("a");
    a.href = url;
    a.download = `prop-bloom-${params.seed}-${format.replace(":", "x")}.png`;
    a.click();
  };

  const [fw, fh] = FORMATS[format];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* stage */}
      <div
        className={cn(
          "enter flex items-center justify-center overflow-hidden rounded-xl p-4 [--stage-h:70dvh] sm:p-8 lg:[--stage-h:max(420px,calc(100dvh-18rem))]",
          "bg-card",
        )}
      >
        {failed ? (
          <p className="type-body text-muted-foreground">This browser can’t run WebGL, so the preview is unavailable.</p>
        ) : (
          <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: `${fw} / ${fh}`, width: `min(100%, calc(var(--stage-h) * ${fw / fh}))` }}>
            <canvas ref={canvasRef} role="img" aria-label="Generated backplate: a flower formed by columns of chart bars" className="absolute inset-0 size-full" />
            {cards ? (
              // Sample cards, to judge the plate behind UI. Not part of the export.
              <div aria-hidden className="absolute top-[18%] right-0 flex w-[56%] flex-col gap-2">
                {[
                  ["BTC-PERP filled", "Long 0.050 at 61,188.0"],
                  ["Profit target reached", "50K evaluation · #4021"],
                  ["Payout sent", "4,120 USDC to 0x7f3a…9b21"],
                ].map(([t, d]) => (
                  <div key={t} className="flex flex-col gap-0.5 rounded-l-xl bg-card px-5 py-4 shadow-pop">
                    <span className="type-body-md font-medium text-foreground">{t}</span>
                    <span className="type-body text-muted-foreground">{d}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* controls */}
      <aside aria-label="Bloom controls" className="enter flex flex-col gap-4 rounded-xl bg-card p-5" style={{ "--enter-delay": "100ms" } as React.CSSProperties}>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={shuffle}>
            <Shuffle className="size-3.5" strokeWidth={2} aria-hidden /> Shuffle
          </Button>
          <Button variant="outline" className="flex-1" onClick={regrow}>
            <RotateCcw className="size-3.5" strokeWidth={2} aria-hidden /> Regrow
          </Button>
        </div>

        <Group label="Palette">
          <Pick value={palette} onChange={(v) => setPalette(v as Palette)} options={Object.entries(PALETTES).map(([k, v]) => [k, v.label])} label="Palette" />
        </Group>

        <Group label="Flower">
          <Row label="Petals" value={String(params.petals)}>
            <Slider aria-label="Petals" value={params.petals} min={3} max={12} step={1} onValueChange={(v) => set("petals", v as number)} />
          </Row>
          <Row label="Layers" value={String(params.layers)}>
            <Slider aria-label="Layers" value={params.layers} min={1} max={6} step={1} onValueChange={(v) => set("layers", v as number)} />
          </Row>
          <Row label="Size" value={`${Math.round(params.scale * 100)}%`}>
            <Slider aria-label="Size" value={params.scale} min={0.4} max={2.5} step={0.05} onValueChange={(v) => set("scale", v as number)} />
          </Row>
          <Row label="Position X" value={params.x.toFixed(2)}>
            <Slider aria-label="Position X" value={params.x} min={-0.8} max={0.8} step={0.01} onValueChange={(v) => set("x", v as number)} />
          </Row>
          <Row label="Position Y" value={params.y.toFixed(2)}>
            <Slider aria-label="Position Y" value={params.y} min={-0.8} max={0.8} step={0.01} onValueChange={(v) => set("y", v as number)} />
          </Row>
        </Group>

        <Group label="Lines">
          <Row label="Columns" value={String(params.cols)}>
            <Slider aria-label="Columns" value={params.cols} min={16} max={90} step={1} onValueChange={(v) => set("cols", v as number)} />
          </Row>
          <Row label="Ground weight" value={`${Math.round(params.cover * 100)}%`}>
            <Slider aria-label="Ground weight" value={params.cover} min={0} max={1} step={0.01} onValueChange={(v) => set("cover", v as number)} />
          </Row>
          <Row label="Step length" value={`${Math.round(params.dash * 100)}%`}>
            <Slider aria-label="Step length" value={params.dash} min={0} max={1} step={0.01} onValueChange={(v) => set("dash", v as number)} />
          </Row>
          <Row label="Contrast" value={`${Math.round(params.ink * 100)}%`}>
            <Slider aria-label="Contrast" value={params.ink} min={0} max={1} step={0.01} onValueChange={(v) => set("ink", v as number)} />
          </Row>
          <Row label="Grain" value={`${Math.round(params.grain * 100)}%`}>
            <Slider aria-label="Grain" value={params.grain} min={0} max={2} step={0.05} onValueChange={(v) => set("grain", v as number)} />
          </Row>
          <div className="flex gap-2 pt-1">
            <Switch on={stem} onChange={setStem}>Stem</Switch>
            <Switch on={live} onChange={setLive}>Motion</Switch>
            <Switch on={cards} onChange={setCards}>Cards</Switch>
          </div>
        </Group>

        <Group label="Output">
          <Pick value={format} onChange={(v) => setFormat(v as Format)} options={Object.keys(FORMATS).map((k) => [k, k])} label="Format" />
        </Group>

        <CtaButton className="mt-auto w-full justify-between" onClick={exportPng} disabled={failed}>
          <span className="inline-flex items-center gap-2">
            <Download className="size-3.5" strokeWidth={2} aria-hidden /> Export PNG
          </span>
        </CtaButton>
        <p className="type-body-sm text-muted-foreground">Exports at 2400px on the long edge, fully bloomed, without the sample cards. Seed {params.seed}.</p>
      </aside>
    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3.5">
      <span className="type-label text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function Row({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)_44px] items-center gap-3">
      <span className="type-body-sm text-secondary-text">{label}</span>
      {children}
      <output className="text-right type-data-sm text-foreground">{value}</output>
    </div>
  );
}

function Pick({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: (readonly [string, string] | string[])[]; label: string }) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as string)}>
      <TabsList aria-label={label} className="rounded-lg border border-border">
        {options.map(([k, l]) => (
          <TabsTrigger key={k} value={k} className="flex-1 justify-center px-2">
            {l}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

function Switch({ on, onChange, children }: { on: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn(
        "flex h-8 flex-1 items-center justify-center gap-2 rounded-md border type-label transition-[background-color,border-color,color,scale] duration-150 ease-out motion-safe:active:scale-[0.96]",
        on ? "border-primary bg-accent text-primary" : "border-input text-muted-foreground hover:text-foreground",
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", on ? "bg-primary" : "bg-input")} />
      {children}
    </button>
  );
}
