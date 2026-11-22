/** Settings for a Bloom backplate. Plain module (no "use client") so server components can import the defaults. */
export type PlateSettings = {
  /** 1 fits the whole flower to the plate height; higher zooms in. */
  zoom: number;
  x: number;
  y: number;
  /** Brightness that counts as a thick line. Higher shows fewer, brighter edges. */
  threshold: number;
  /** How sharply lines split between thin and thick. */
  contrast: number;
  /** CSS px per line. */
  spacing: number;
  /** How far lines stand out from the ground, 0 to 1. */
  ink: number;
  /** Motion speed; 0 holds still. */
  motion: number;
  grain: number;
};

export const PLATE_DEFAULTS: PlateSettings = {
  zoom: 1.55,
  x: 0,
  y: 0,
  threshold: 0.62,
  contrast: 3,
  spacing: 9.5,
  ink: 0.16,
  motion: 1,
  grain: 0.5,
};
