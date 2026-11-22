/**
 * Bloom palettes. Tone-on-tone plates set only a ground (`bg`): the lines are drawn as a
 * shade of it. Colour plates also set `a` (thin lines) and `b` (thick lines); the line
 * colour blends from a to b as lines swell, and the ground takes a slow painterly drift.
 * The colour plates take their combinations from David Hockney's landscapes and pools:
 * saturated greens against magenta, ochre fields, pool blues, lavender lanes.
 */
export type BloomPalette = { label: string; bg: string; a?: string; b?: string };

export const PALETTES = {
  clay: { label: "Clay", bg: "#e8853d" },
  brand: { label: "Brand", bg: "#4566fa" },
  growth: { label: "Growth", bg: "#8dcd8e" },
  paper: { label: "Paper", bg: "#f1f1ee" },
  ink: { label: "Ink", bg: "#1b1816" },
  lane: { label: "Lane", bg: "#2f8f3e", a: "#a6d64b", b: "#c95fb5" },
  hedgerow: { label: "Hedgerow", bg: "#1d5c2f", a: "#57b04a", b: "#f2913a" },
  field: { label: "Field", bg: "#e9a93a", a: "#f6d873", b: "#2f7d3c" },
  pool: { label: "Pool", bg: "#2a8fd8", a: "#8fd6f6", b: "#f4fbff" },
  lavender: { label: "Lavender", bg: "#a77ad0", a: "#e9b7e6", b: "#2f8a43" },
  sky: { label: "Sky", bg: "#4aa8e8", a: "#bfe6fa", b: "#35a04a" },
  dusk: { label: "Dusk", bg: "#3b2f8f", a: "#e86fb0", b: "#ffb347" },
} as const satisfies Record<string, BloomPalette>;

export type PaletteKey = keyof typeof PALETTES;
