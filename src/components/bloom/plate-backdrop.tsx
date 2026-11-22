import { cn } from "@/lib/utils";
import { BloomPlate } from "./bloom-plate";
import { PLATE_DEFAULTS, type PlateSettings } from "./plate-settings";

/**
 * A UI showcase set on a coloured Bloom plate, the way product shots sit on painted
 * backdrops: the plate fills the panel and the UI floats on it with padding and a shadow.
 * Colour plates read the same in both themes, like a photograph would.
 */
export function PlateBackdrop({
  settings,
  className,
  children,
}: {
  settings: Partial<PlateSettings>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("relative isolate overflow-hidden rounded-2xl p-4 sm:p-8 lg:p-10", className)}>
      <BloomPlate
        src="/bloom/marigold.webp"
        aspect={1024 / 1021}
        settings={{ ...PLATE_DEFAULTS, ink: 0.55, grain: 0.8, ...settings }}
        className="pointer-events-none absolute inset-0 -z-10 size-full"
      />
      {children}
    </div>
  );
}
