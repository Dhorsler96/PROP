"use client";

import * as React from "react";
import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import { Toggle } from "@base-ui/react/toggle";
import { cn } from "@/lib/utils";

/* ── Slider ─────────────────────────────────────────────── */
export function Slider({ className, ...props }: SliderPrimitive.Root.Props<number>) {
  return (
    <SliderPrimitive.Root className={cn("w-full", className)} {...props}>
      <SliderPrimitive.Control className="flex h-5 w-full touch-none items-center select-none">
        <SliderPrimitive.Track className="h-0.5 w-full bg-input">
          <SliderPrimitive.Indicator className="bg-primary" />
          <SliderPrimitive.Thumb
            aria-label="Leverage"
            className="size-3 bg-primary outline-offset-2 has-[:focus-visible]:outline has-[:focus-visible]:outline-ring"
          />
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

/* ── Progress ───────────────────────────────────────────── */
const tones = {
  primary: "bg-primary",
  positive: "bg-positive",
  warning: "bg-warning",
  destructive: "bg-destructive",
  muted: "bg-muted-foreground",
} as const;

export function Progress({
  value,
  tone = "primary",
  className,
  label,
}: {
  value: number;
  tone?: keyof typeof tones;
  className?: string;
  label: string;
}) {
  return (
    <ProgressPrimitive.Root value={Math.max(0, Math.min(100, value))} aria-label={label} className={className}>
      <ProgressPrimitive.Track className="h-0.5 w-full overflow-hidden bg-input">
        <ProgressPrimitive.Indicator
          className={cn("h-full transition-[width] duration-300 ease-out", tones[tone])}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
}

/* ── Accordion ──────────────────────────────────────────── */
export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return <AccordionPrimitive.Item className={cn("border-b border-border", className)} {...props} />;
}

export function AccordionTrigger({ className, children, ...props }: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header>
      <AccordionPrimitive.Trigger
        className={cn(
          "group flex w-full items-center justify-between gap-6 py-5 text-left type-body-md text-foreground",
          "transition-[color] duration-150 ease-out hover:text-primary",
          className,
        )}
        {...props}
      >
        {children}
        <span
          aria-hidden
          className="relative size-3 shrink-0 text-muted-foreground group-data-panel-open:text-primary"
        >
          <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-current" />
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-current transition-[scale] duration-150 ease-out group-data-panel-open:scale-y-0" />
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({ className, children, ...props }: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      className={cn(
        "h-(--accordion-panel-height) overflow-hidden data-ending-style:h-0 data-starting-style:h-0",
        "motion-safe:transition-[height] motion-safe:duration-200 motion-safe:ease-out",
        className,
      )}
      {...props}
    >
      <div className="max-w-[60ch] pb-5 type-body text-secondary-text [text-wrap:pretty]">{children}</div>
    </AccordionPrimitive.Panel>
  );
}

/* ── ToggleGroup (order side) ───────────────────────────── */
export const ToggleGroup = ToggleGroupPrimitive;

export function SideToggle({
  value,
  tone,
  children,
}: {
  value: string;
  tone: "buy" | "sell";
  children: React.ReactNode;
}) {
  return (
    <Toggle
      value={value}
      className={cn(
        "-ml-px flex h-8 flex-1 items-center justify-center border border-input type-label text-muted-foreground first:ml-0",
        "transition-[background-color,border-color,color] duration-150 ease-out hover:text-foreground",
        "data-pressed:relative",
        tone === "buy"
          ? "data-pressed:border-positive data-pressed:bg-pos-wash data-pressed:text-positive"
          : "data-pressed:border-destructive data-pressed:bg-neg-wash data-pressed:text-destructive",
      )}
    >
      {children}
    </Toggle>
  );
}
