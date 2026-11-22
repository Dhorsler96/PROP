"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Download, ImageUp, RotateCcw, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CtaButton } from "@/components/ui/cta";
import { Slider } from "@/components/ui/misc";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { hexRgb, initBloom, uploadThreshold, type BloomGl } from "./gl";

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
  thresh: number;
  gain: number;
};

const DEFAULTS: Params = { seed: 7, petals: 6, layers: 4, scale: 1, x: 0, y: 0, cols: 72, cover: 0.8, dash: 0.12, grain: 1, ink: 0.3, thresh: 0.5, gain: 2.0 };

const DEFAULT_IMAGE = "/bloom/marigold.webp";

export function BloomStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<BloomGl | null>(null);
  const [params, setParams] = useState<Params>(DEFAULTS);
  const [palette, setPalette] = useState<Palette>("clay");
  const [format, setFormat] = useState<Format>("1:1");
  const [cards, setCards] = useState(false);
  const [stem, setStem] = useState(true);
  const [live, setLive] = useState(true);
  const [failed, setFailed] = useState(false);
  const [source, setSource] = useState<"image" | "flower">("image");
  const [invert, setInvert] = useState(false);
  const [imageUrl, setImageUrl] = useState(DEFAULT_IMAGE);
  const [imageName, setImageName] = useState("Marigold (default)");
  const [copied, setCopied] = useState<"idle" | "done" | "failed">("idle");
  const fileRef = useRef<HTMLInputElement>(null);

  // Everything the draw call reads lives in a ref so the frame loop never goes stale.
  const stateRef = useRef({ params, palette, stem, live, source, invert, imgAspect: 1, imgReady: false, growStart: 0, time: 0 });
  useEffect(() => {
    Object.assign(stateRef.current, { params, palette, stem, live, source, invert });
  });

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
    gl.uniform1f(u.uMode, s.source === "image" && s.imgReady ? 1 : 0);
    gl.uniform1f(u.uImgAspect, s.imgAspect);
    gl.uniform1f(u.uThresh, s.params.thresh);
    gl.uniform1f(u.uGain, s.params.gain);
    gl.uniform1f(u.uInvert, s.invert ? 1 : 0);
    gl.uniform1i(u.uImg, 0);
    gl.uniform1f(u.uGrow, grow);
    gl.uniform3fv(u.uBg, hexRgb(PALETTES[s.palette].bg));
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return grow;
  }, []);

  // Set up WebGL once.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = initBloom(canvas);
    if (!ctx) {
      setFailed(true);
      return;
    }
    glRef.current = ctx;
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

  // Load the threshold image into a small mipmapped texture. Downscaling first
  // averages the photo so each line step reads a calm brightness, not pixel noise.
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      const ctx = glRef.current;
      if (cancelled || !ctx) return;
      if (!uploadThreshold(ctx.gl, img)) return;
      stateRef.current.imgAspect = img.naturalWidth / img.naturalHeight;
      stateRef.current.imgReady = true;
    };
    img.src = imageUrl;
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imageUrl.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
    setImageName(file.name);
    setSource("image");
    e.target.value = "";
  };

  const set = <K extends keyof Params>(k: K, v: Params[K]) => setParams((p) => ({ ...p, [k]: v }));
  const regrow = () => {
    stateRef.current.growStart = performance.now();
  };
  const shuffle = () => {
    set("seed", Math.floor(Math.random() * 999) + 1);
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) regrow();
  };

  /** Render the full bloom at export size and return it as a PNG data URL. */
  const renderFull = () => {
    const canvas = canvasRef.current;
    if (!canvas || !glRef.current) return null;
    const [w, h] = FORMATS[format];
    const long = 2400;
    const prev = [canvas.width, canvas.height];
    canvas.width = w >= h ? long : Math.round((long * w) / h);
    canvas.height = h >= w ? long : Math.round((long * h) / w);
    const keep = stateRef.current.growStart;
    stateRef.current.growStart = -1e6;
    draw(performance.now());
    const url = canvas.toDataURL("image/png");
    stateRef.current.growStart = keep;
    canvas.width = prev[0];
    canvas.height = prev[1];
    return url;
  };

  const exportPng = () => {
    const url = renderFull();
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `tendril-bloom-${params.seed}-${format.replace(":", "x")}.png`;
    a.click();
  };

  const copyPng = async () => {
    const url = renderFull();
    if (!url) return;
    try {
      // Passing a promise keeps Safari happy: the write starts inside the click.
      const blob = fetch(url).then((r) => r.blob());
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopied("done");
    } catch {
      setCopied("failed");
    }
    window.setTimeout(() => setCopied("idle"), 2000);
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

        <Group label="Source">
          <Pick value={source} onChange={(v) => setSource(v as "image" | "flower")} options={[["image", "Threshold image"], ["flower", "Generated flower"]]} label="Source" />
          {source === "image" ? (
            <>
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="size-12 shrink-0 rounded-md object-cover grayscale" />
                <span className="min-w-0 flex-1 truncate type-body-sm text-secondary-text">{imageName}</span>
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                  <ImageUp className="size-3.5" strokeWidth={2} aria-hidden /> Change
                </Button>
                <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-label="Upload threshold image" onChange={onFile} />
              </div>
              <Row label="Threshold" value={`${Math.round(params.thresh * 100)}%`}>
                <Slider aria-label="Threshold" value={params.thresh} min={0} max={1} step={0.01} onValueChange={(v) => set("thresh", v as number)} />
              </Row>
              <Row label="Image contrast" value={params.gain.toFixed(1)}>
                <Slider aria-label="Image contrast" value={params.gain} min={0.5} max={8} step={0.1} onValueChange={(v) => set("gain", v as number)} />
              </Row>
              <div className="flex gap-2 pt-1">
                <Switch on={invert} onChange={setInvert}>Invert</Switch>
                {imageUrl !== DEFAULT_IMAGE ? (
                  <Switch on={false} onChange={() => { setImageUrl(DEFAULT_IMAGE); setImageName("Marigold (default)"); }}>Reset image</Switch>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <Row label="Petals" value={String(params.petals)}>
                <Slider aria-label="Petals" value={params.petals} min={3} max={12} step={1} onValueChange={(v) => set("petals", v as number)} />
              </Row>
              <Row label="Layers" value={String(params.layers)}>
                <Slider aria-label="Layers" value={params.layers} min={1} max={6} step={1} onValueChange={(v) => set("layers", v as number)} />
              </Row>
              <Row label="Ground weight" value={`${Math.round(params.cover * 100)}%`}>
                <Slider aria-label="Ground weight" value={params.cover} min={0} max={1} step={0.01} onValueChange={(v) => set("cover", v as number)} />
              </Row>
              <div className="flex gap-2 pt-1">
                <Switch on={stem} onChange={setStem}>Stem</Switch>
              </div>
            </>
          )}
        </Group>

        <Group label="Framing">
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
            <Switch on={live} onChange={setLive}>Motion</Switch>
            <Switch on={cards} onChange={setCards}>Cards</Switch>
          </div>
        </Group>

        <Group label="Output">
          <Pick value={format} onChange={(v) => setFormat(v as Format)} options={Object.keys(FORMATS).map((k) => [k, k])} label="Format" />
        </Group>

        <div className="mt-auto flex gap-2">
          <Button variant="outline" size="lg" className="flex-1 px-4" onClick={copyPng} disabled={failed}>
            {copied === "done" ? <Check className="size-3.5" strokeWidth={2} aria-hidden /> : <Copy className="size-3.5" strokeWidth={2} aria-hidden />}
            <span aria-live="polite">{copied === "done" ? "Copied" : copied === "failed" ? "Couldn’t copy" : "Copy image"}</span>
          </Button>
          <CtaButton className="flex-1 justify-between px-4" onClick={exportPng} disabled={failed}>
            <span className="inline-flex items-center gap-2">
              <Download className="size-3.5" strokeWidth={2} aria-hidden /> Export
            </span>
          </CtaButton>
        </div>
        <p className="type-body-sm text-muted-foreground">Copies and exports at 2400px on the long edge, fully bloomed, without the sample cards. Seed {params.seed}.</p>
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
    <div className="grid grid-cols-[100px_minmax(0,1fr)_44px] items-center gap-3">
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
