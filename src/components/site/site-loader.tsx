import { Logo } from "@/components/logo";

// Candle heights for the loader's growth wave: a rising, uneven run like a chart breaking out.
const BARS = [22, 30, 26, 38, 34, 46, 40, 52, 48, 62, 56, 70, 64, 78, 72, 88, 80, 96, 90, 100];

/**
 * Homepage load: candles grow in a wave under the wordmark, then the cover lifts away.
 * Pure CSS (styles in globals.css under "Site loader"), so it paints with the first frame
 * and needs no JavaScript; it runs on every visit to the homepage, including client
 * navigations back to it. Hidden from assistive tech; the page beneath is always in the DOM.
 * Under reduced motion it is a brief fade instead.
 */
export function SiteLoader() {
  return (
    <div aria-hidden className="site-loader">
      <div className="site-loader__inner">
        <div className="site-loader__bars">
          {BARS.map((h, i) => (
            <span
              key={i}
              className="site-loader__bar"
              style={{ "--h": `${h}%`, "--i": i } as React.CSSProperties}
            />
          ))}
        </div>
        <Logo className="site-loader__logo h-6 w-auto" />
      </div>
    </div>
  );
}
