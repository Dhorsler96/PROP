import { ArrowLink, CtaLink } from "@/components/ui/cta";
import { BloomPlate } from "@/components/bloom/bloom-plate";
import { PLATE_DEFAULTS, type PlateSettings } from "@/components/bloom/plate-settings";

const PLATE: PlateSettings = { ...PLATE_DEFAULTS, zoom: 1.3, y: 0.18 };

/**
 * Landing v2 hero: a large statement, one primary action, then a snapshot of the real
 * terminal rising out of the bottom of the hero. The snapshot is a static capture of
 * /terminal in each theme (public/landing), swapped by the theme attribute.
 */
export function HeroTerminal() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden border-b border-border">
      <div aria-hidden className="hero-plate pointer-events-none absolute inset-0 -z-10">
        <BloomPlate src="/bloom/marigold.webp" aspect={1024 / 1021} settings={PLATE} className="size-full" />
      </div>
      {/* Brand glow from the top, then the plate settles back into the page colour behind the snapshot. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_42%_30%_at_50%_30%,color-mix(in_srgb,var(--background)_72%,transparent)_0%,transparent_100%),radial-gradient(ellipse_70%_55%_at_50%_0%,color-mix(in_srgb,var(--primary)_30%,transparent)_0%,transparent_70%),linear-gradient(to_bottom,transparent_45%,var(--background)_85%)]"
      />

      <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-6 px-4 pt-24 text-center sm:px-8 md:pt-32">
        <p className="enter type-eyebrow text-brand-text" style={{ "--enter-delay": "0ms" } as React.CSSProperties}>
          <span className="mr-2 inline-block size-1.5 rounded-full bg-primary align-middle motion-safe:animate-[pulse-dot_2s_infinite]" />
          Decentralized prop trading
        </p>
        <h1 id="hero-title" className="enter type-statement max-w-[18ch]" style={{ "--enter-delay": "100ms" } as React.CSSProperties}>
          Trade our capital. Keep <span className="text-brand-text">up to 90%</span> of the profits.
        </h1>
        <p className="enter max-w-[36rem] type-lead text-secondary-text [text-wrap:pretty]" style={{ "--enter-delay": "200ms" } as React.CSSProperties}>
          Prove you can grow an account and trade up to <strong className="font-medium text-foreground">$100K of funded capital</strong>. Every trade settles on-chain,
          and payouts land in your wallet in USDC.
        </p>
        <div className="enter flex flex-wrap justify-center gap-3" style={{ "--enter-delay": "300ms" } as React.CSSProperties}>
          <CtaLink href="/#pricing">Choose an evaluation</CtaLink>
          <ArrowLink href="/terminal" className="bg-background/40">
            Explore the terminal
          </ArrowLink>
        </div>

        {/* Terminal snapshot, cropped by the bottom of the hero. */}
        <div className="enter relative mt-10 w-full max-w-[1280px] md:mt-14" style={{ "--enter-delay": "450ms" } as React.CSSProperties}>
          <a
            href="/terminal"
            aria-label="Open the live terminal"
            className="group block overflow-hidden rounded-t-md border border-b-0 border-input bg-card shadow-pop transition-[border-color] duration-300 ease-out hover:border-brand-line"
          >
            <div className="relative h-[300px] overflow-hidden md:h-[clamp(320px,42vw,560px)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/landing/terminal-dark.webp"
                alt="The Tendril terminal: BTC-PERP candles and volume, order book, order form and open positions."
                width={2400}
                height={1440}
                fetchPriority="high"
                className="snap-dark w-[210%] max-w-none object-cover object-left-top md:w-full transition-[scale] duration-700 ease-out motion-safe:group-hover:scale-[1.01]"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/landing/terminal-light.webp"
                alt="The Tendril terminal: BTC-PERP candles and volume, order book, order form and open positions."
                width={2400}
                height={1440}
                loading="lazy"
                className="snap-light w-[210%] max-w-none object-cover object-left-top md:w-full transition-[scale] duration-700 ease-out motion-safe:group-hover:scale-[1.01]"
              />
              <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-b from-transparent to-background" />
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
