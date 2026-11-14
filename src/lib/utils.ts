import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number with thousands separators and fixed decimals. */
export function fmt(n: number, d = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

/** Signed number, e.g. +12.40 / −3.10 (true minus sign). */
export function signed(n: number, d = 2) {
  return (n >= 0 ? "+" : "−") + fmt(Math.abs(n), d);
}

export function usd(n: number, d = 2) {
  return (n < 0 ? "−$" : "$") + fmt(Math.abs(n), d);
}
