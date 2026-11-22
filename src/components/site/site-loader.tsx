import { Logo } from "@/components/logo";

// Panels that swipe up in turn: three Hockney colours from the Bloom palettes, then brand blue.
const PANELS = ["#a77ad0", "#e9a93a", "#2f8f3e", "#4566fa"];

/**
 * Homepage load: colour panels swipe up one after another, the last panel is the page
 * background carrying the wordmark, and then the cover fades away to the page.
 * Pure CSS (globals.css, "Site loader"), so it paints with the first frame and needs no
 * JavaScript. Runs on every visit to the homepage. Hidden from assistive tech. Under
 * reduced motion it skips the swipes and briefly shows the wordmark before fading.
 */
export function SiteLoader() {
  return (
    <div aria-hidden className="site-loader">
      {PANELS.map((c, i) => (
        <span key={c} className="site-loader__panel" style={{ background: c, "--i": i } as React.CSSProperties} />
      ))}
      <span className="site-loader__panel site-loader__panel--final" style={{ "--i": PANELS.length } as React.CSSProperties}>
        <Logo className="site-loader__logo h-14 w-auto sm:h-20" />
      </span>
    </div>
  );
}
