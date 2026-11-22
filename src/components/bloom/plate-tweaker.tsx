"use client";

import { useState } from "react";
import { Check, Copy, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import { PLATE_DEFAULTS, type PlateSettings } from "./bloom-plate";

const CONTROLS: { key: Exclude<keyof PlateSettings, "palette">; label: string; min: number; max: number; step: number; fmt: (v: number) => string }[] = [
  { key: "zoom", label: "Zoom", min: 0.5, max: 4, step: 0.05, fmt: (v) => `${v.toFixed(2)}×` },
  { key: "x", label: "Position X", min: -1, max: 1, step: 0.01, fmt: (v) => v.toFixed(2) },
  { key: "y", label: "Position Y", min: -1, max: 1, step: 0.01, fmt: (v) => v.toFixed(2) },
  { key: "threshold", label: "Threshold", min: 0, max: 1, step: 0.01, fmt: (v) => `${Math.round(v * 100)}%` },
  { key: "contrast", label: "Contrast", min: 0.5, max: 8, step: 0.1, fmt: (v) => v.toFixed(1) },
  { key: "spacing", label: "Line spacing", min: 5, max: 20, step: 0.5, fmt: (v) => `${v}px` },
  { key: "ink", label: "Line strength", min: 0, max: 1, step: 0.01, fmt: (v) => `${Math.round(v * 100)}%` },
  { key: "motion", label: "Motion", min: 0, max: 3, step: 0.05, fmt: (v) => `${v.toFixed(2)}×` },
  { key: "grain", label: "Grain", min: 0, max: 2, step: 0.05, fmt: (v) => `${Math.round(v * 100)}%` },
];

/**
 * Live controls for the hero backplate. Shown only when the URL has ?tweak, so
 * visitors never see it. Settings persist in this browser; "Copy settings" puts
 * them on the clipboard as JSON to hand over and bake in as the defaults.
 */
export function PlateTweaker({ value, onChange }: { value: PlateSettings; onChange: (v: PlateSettings) => void }) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(value, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked; nothing to do */
    }
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="absolute left-4 bottom-4 z-20 bg-card" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="size-3.5" strokeWidth={2} aria-hidden /> Tweak backplate
      </Button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Backplate settings"
      className="enter absolute left-4 bottom-4 z-20 flex max-h-[calc(100%-2rem)] w-[min(320px,calc(100%-2rem))] flex-col gap-3 overflow-y-auto overscroll-contain rounded-xl border border-input bg-popover p-4 text-left shadow-pop"
    >
      <div className="flex items-center justify-between">
        <span className="type-label text-muted-foreground">Backplate</span>
        <button
          type="button"
          aria-label="Close settings"
          onClick={() => setOpen(false)}
          className="grid size-7 place-items-center rounded-md text-muted-foreground transition-[color,scale] duration-150 ease-out hover:text-foreground motion-safe:active:scale-[0.96]"
        >
          <X className="size-3.5" strokeWidth={2} aria-hidden />
        </button>
      </div>
      {CONTROLS.map((c) => (
        <div key={c.key} className="grid grid-cols-[92px_minmax(0,1fr)_48px] items-center gap-3">
          <span className="type-body-sm text-secondary-text">{c.label}</span>
          <Slider aria-label={c.label} value={value[c.key]} min={c.min} max={c.max} step={c.step} onValueChange={(v) => onChange({ ...value, [c.key]: v as number })} />
          <output className={cn("text-right type-data-sm text-foreground")}>{c.fmt(value[c.key])}</output>
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onChange(PLATE_DEFAULTS)}>
          <RotateCcw className="size-3.5" strokeWidth={2} aria-hidden /> Reset
        </Button>
        <Button size="sm" className="flex-1" onClick={copy}>
          {copied ? <Check className="size-3.5" strokeWidth={2} aria-hidden /> : <Copy className="size-3.5" strokeWidth={2} aria-hidden />}
          <span aria-live="polite">{copied ? "Copied" : "Copy settings"}</span>
        </Button>
      </div>
      <p className="type-body-sm text-muted-foreground">Saved in this browser only. Copy the settings and send them over to make them the default.</p>
    </div>
  );
}
