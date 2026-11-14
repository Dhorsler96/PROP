import Link from "next/link";
import { Logo } from "@/components/logo";
import { CtaLink } from "@/components/ui/cta";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/#how", label: "How it works" },
  { href: "/#pricing", label: "Evaluations" },
  { href: "/terminal", label: "Terminal" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-input bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center gap-8 px-4 sm:px-8">
        <Link href="/" aria-label="Hyperprop home" className="shrink-0">
          <Logo className="h-4 w-auto" />
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="link-draw inline-flex h-8 items-center px-2.5 type-label text-muted-foreground transition-[color] duration-300 ease-out hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <CtaLink href="/terminal" size="sm">
            Launch terminal
          </CtaLink>
        </div>
      </div>
    </header>
  );
}

export function Ticker() {
  const items: [string, string, string, boolean][] = [
    ["BTC", "61,204.0", "+1.84%", true],
    ["ETH", "3,388.5", "−0.92%", false],
    ["SOL", "168.42", "+4.10%", true],
    ["ARB", "0.9142", "+2.31%", true],
    ["AVAX", "27.11", "−1.05%", false],
    ["LINK", "14.88", "+3.02%", true],
    ["HYPE", "38.06", "+6.44%", true],
    ["DOGE", "0.1621", "−2.18%", false],
  ];
  const row = (aria: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={aria || undefined}>
      {items.map(([s, p, c, up]) => (
        <span key={s} className="flex items-center gap-2 px-4 type-data-sm">
          <span className="text-muted-foreground">{s}</span>
          <span className="text-foreground">{p}</span>
          <span className={up ? "text-positive" : "text-destructive"}>{c}</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="group flex h-8 items-center overflow-hidden border-b border-border" aria-label="Market prices">
      <div className="flex w-max motion-safe:animate-[ticker_40s_linear_infinite] group-hover:[animation-play-state:paused]">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
