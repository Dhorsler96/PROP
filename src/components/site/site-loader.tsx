import { Logo } from "@/components/logo";
import { BloomPlate } from "@/components/bloom/bloom-plate";
import { PLATE_DEFAULTS, type PlateSettings } from "@/components/bloom/plate-settings";

// Stronger and closer than the hero plate, so the flower reads in the second it is on screen.
const LOADER_PLATE: PlateSettings = { ...PLATE_DEFAULTS, zoom: 1.25, ink: 0.42, threshold: 0.58 };

/**
 * Homepage load: the brand line pattern grows in from the centre behind the wordmark,
 * then the whole cover swipes up to reveal the page. The cover and its timing are CSS
 * (globals.css, "Site loader"), so it paints with the first frame and always clears on
 * time even if WebGL is slow or unavailable; the pattern fades in as soon as it can draw.
 * Runs on every visit to the homepage. Hidden from assistive tech. Under reduced motion
 * it holds a still frame briefly and fades.
 */
export function SiteLoader() {
  return (
    <div aria-hidden className="site-loader">
      <BloomPlate src="/bloom/marigold.webp" aspect={1024 / 1021} settings={LOADER_PLATE} growMs={1100} className="absolute inset-0 size-full" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_35%_30%_at_50%_50%,var(--background)_0%,transparent_100%)]" />
      <Logo className="site-loader__logo relative h-8 w-auto" />
    </div>
  );
}
