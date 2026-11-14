import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { ArrowLink, CtaLink } from "@/components/ui/cta";
import { Kbd } from "@/components/ui/kbd";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Progress } from "@/components/ui/misc";
import { rng } from "@/lib/market";
import { marketsLabel, marketsPhrase } from "@/lib/venue";
import { TerminalPreview } from "./terminal-preview";

function SectionHead({ eyebrow, title, id, children, small }: { eyebrow: string; title: string; id: string; children?: React.ReactNode; small?: boolean }) {
  return (
    <div className="flex max-w-xl flex-col gap-5">
      <p className="type-eyebrow text-muted-foreground">{eyebrow}</p>
      <h2 id={id} className={small ? "type-heading" : "type-display"}>
        {title}
      </h2>
      {children ? <p className="type-body-md text-secondary-text [text-wrap:pretty]">{children}</p> : null}
    </div>
  );
}

const wrap = "mx-auto flex max-w-[1440px] flex-col gap-12 px-4 py-24 sm:px-8 md:px-20 md:py-28";

export function HowItWorks() {
  const steps = [
    ["1", "Buy an evaluation", "Pick an account size from $5K to $100K and pay a one-time fee in USDC from your wallet.", "Fee from", "60 USDC"],
    ["2", "Hit the target", `Trade ${marketsPhrase} until you reach a 10% profit target, without breaching the daily loss or drawdown limit.`, "Profit target", "10%"],
    ["3", "Split the profits", "Pass and you trade a funded account. Withdraw your share of the profit to your wallet when you request a payout.", "Your split", "80–90%"],
  ];
  return (
    <section id="how" aria-labelledby="how-title" className="scroll-mt-14 border-b border-border">
      <div className={wrap}>
        <SectionHead eyebrow="How it works" title="Three steps to funded" id="how-title" />
        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map(([n, t, d, kl, kv]) => (
            <li key={n} className="flex flex-col gap-3">
              <Kbd className="h-5 w-fit px-1.5 type-label">Step {n}</Kbd>
              <div className="group/card flex flex-1 flex-col rounded-xl border border-border bg-card transition-[background-color,border-color,color] duration-300 ease-out hover:border-foreground hover:bg-foreground hover:text-background">
                <div className="flex flex-col gap-2 p-6 pb-4">
                  <h3 className="type-title-display">{t}</h3>
                  <p className="type-body text-muted-foreground transition-[color] duration-300 ease-out [text-wrap:pretty] group-hover/card:text-background/60">{d}</p>
                </div>
                <div className="mt-auto flex items-center justify-between px-6 pb-6">
                  <span className="type-body-sm text-muted-foreground transition-[color] duration-300 ease-out group-hover/card:text-background/60">{kl}</span>
                  <span className="type-data text-foreground transition-[color] duration-300 ease-out group-hover/card:text-background">{kv}</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Rules() {
  const rules = [
    ["Profit target", "10%", "Reach it on the evaluation balance to pass and get funded."],
    ["Max daily loss", "3%", "The most your equity can fall in one trading day."],
    ["Max drawdown", "6%", "The most your equity can fall below the starting balance, in total."],
    ["Leverage", "5:1", "Up to five times your account balance on any market."],
  ];
  const meters: [string, string, number, "positive" | "muted" | "warning"][] = [
    ["Profit target", "$3,120 / $5,000", 62.4, "positive"],
    ["Daily loss used", "$0 / $1,500", 0, "muted"],
    ["Drawdown used", "$1,940 / $3,000", 64.7, "warning"],
  ];
  return (
    <section id="rules" aria-labelledby="rules-title" className="scroll-mt-14 border-b border-border">
      <div className={wrap}>
        <SectionHead eyebrow="The rules" title="Four numbers to watch" id="rules-title">
          The rules are the same at every size. Your terminal shows each limit live, so you always know how much room you have.
        </SectionHead>
        <div className="grid items-start gap-16 lg:grid-cols-2">
          <dl className="border-t border-border">
            {rules.map(([t, v, d]) => (
              <div key={t} className="flex items-center gap-6 border-b border-border py-6">
                <div className="flex flex-1 flex-col gap-1.5">
                  <dt className="type-label text-muted-foreground">{t}</dt>
                  <dd className="type-body text-secondary-text">{d}</dd>
                </div>
                <dd className="type-stat-xl text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
          <figure className="overflow-hidden rounded-xl border border-border bg-card" aria-label="Example evaluation account">
            <figcaption className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3.5">
              <span className="type-data text-foreground">50K evaluation · #4021</span>
              <Badge variant="warning">Evaluation</Badge>
              <span className="ml-auto type-label text-muted-foreground">Example</span>
            </figcaption>
            <div className="grid grid-cols-3 border-b border-border">
              {[
                ["Balance", "$53,120.40", "text-foreground"],
                ["Today", "+$412.18", "text-positive"],
                ["Open PnL", "—", "text-muted-foreground"],
              ].map(([l, v, c], i) => (
                <div key={l} className={`flex flex-col gap-1.5 px-5 py-4 ${i < 2 ? "border-r border-border" : ""}`}>
                  <span className="type-label text-muted-foreground">{l}</span>
                  <span className={`type-stat-lg ${c}`}>{v}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-5 p-5">
              {meters.map(([l, v, pct, tone]) => (
                <div key={l} className="flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span className="type-body-sm text-muted-foreground">{l}</span>
                    <span className="type-data-sm text-secondary-text">{v}</span>
                  </div>
                  <Progress value={pct} tone={tone} label={l} />
                </div>
              ))}
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}

export function TerminalSection() {
  return (
    <section id="terminal" aria-labelledby="terminal-title" className="scroll-mt-14 border-b border-border">
      <div className={wrap}>
        <div className="grid overflow-hidden rounded-2xl border border-border lg:grid-cols-2">
          <div className="flex flex-col justify-center gap-6 border-b border-border p-6 sm:p-12 lg:border-r lg:border-b-0">
            <p className="type-eyebrow text-primary">
              <span className="mr-2 inline-block size-1.5 rounded-full bg-primary align-middle motion-safe:animate-[pulse-dot_2s_infinite]" />
              Settled on-chain
            </p>
            <h2 id="terminal-title" className="type-display">
              The same terminal from day one
            </h2>
            <p className="type-body-md text-secondary-text [text-wrap:pretty]">
              You evaluate on the terminal funded traders use, with live prices and depth. Every trade settles on-chain. Pass, and the capital behind it is real.
            </p>
            <dl className="border-t border-border">
              {[
                ["Markets", marketsLabel],
                ["Leverage", "Up to 5:1"],
                ["Payouts", "USDC to your wallet"],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between border-b border-border py-3">
                  <dt className="type-body text-muted-foreground">{l}</dt>
                  <dd className="type-data text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
            <ArrowLink href="/terminal" className="w-fit">
              Try the terminal
            </ArrowLink>
          </div>
          <TerminalPreview />
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  const qa = [
    ["What is an evaluation?", "A simulated account sized to the tier you buy. Reach the 10% profit target without breaching the 3% daily loss or 6% drawdown limit, and you move to a funded account."],
    ["What happens if I breach a rule?", "The evaluation ends and the account closes. You can buy a new evaluation at any size and start again."],
    ["How do payouts work?", "On a funded account you request a payout from the terminal. Your share of the profit, 80% or 90% depending on the split you chose, is paid in USDC to your connected wallet."],
    ["What is the 90% boost?", "An add-on at checkout that raises your gain split from 80% to 90%. It adds about 10% to the evaluation fee, for example 495 + 50 = 545 USDC on the 50K tier."],
    ["What do I need to get started?", "An EVM wallet with USDC. Connect it, pick a size, approve the payment, and your evaluation account opens on the terminal."],
  ];
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-14 border-b border-border">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-24 sm:px-8 md:px-20 md:py-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-20">
        <SectionHead eyebrow="FAQ" title="Before you start" id="faq-title" small />
        <Accordion defaultValue={["q0"]} className="border-t border-border">
          {qa.map(([q, a], i) => (
            <AccordionItem key={q} value={`q${i}`}>
              <AccordionTrigger>{q}</AccordionTrigger>
              <AccordionContent>{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

export function Closing() {
  // Deterministic "number field" texture behind the closing CTA.
  const r = rng(5);
  const cols = Array.from({ length: 16 }, () =>
    Array.from({ length: 22 }, () => (r() < 0.5 ? "" : (r() * 99999).toFixed(1))),
  );
  return (
    <section aria-labelledby="closing-title" className="relative overflow-hidden border-b border-border">
      <div aria-hidden className="pointer-events-none absolute inset-0 flex justify-between px-6 font-mono text-[10px] leading-[22px] text-primary opacity-25 select-none">
        {cols.map((c, i) => (
          <div key={i} className="flex flex-col">
            {c.map((v, j) => (
              <span key={j} style={{ opacity: v ? 0.25 + ((i * 7 + j * 3) % 10) / 14 : 0 }}>
                {v || "0"}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_50%,var(--background)_10%,transparent_100%)]" />
      <div className="relative mx-auto flex max-w-[1440px] flex-col items-center gap-6 px-4 py-32 text-center sm:px-8">
        <h2 id="closing-title" className="type-hero">
          Prove it. <span className="text-primary">Get funded.</span>
        </h2>
        <p className="type-body-md text-secondary-text">One evaluation between you and up to $100,000 of trading capital.</p>
        <CtaLink href="/#pricing">
          Buy evaluation
        </CtaLink>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer>
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-start justify-between gap-10 px-4 py-12 sm:px-8 md:px-20">
        <div className="flex max-w-sm flex-col gap-4">
          <Logo className="h-4 w-fit" />
          <p className="type-body-sm text-muted-foreground [text-wrap:pretty]">
            Trading perpetual futures carries a high level of risk. Evaluation accounts are simulated. Figures on this site are illustrative.
          </p>
        </div>
        <nav aria-label="Footer" className="flex gap-16">
          {[
            ["Product", [["Evaluations", "/#pricing"], ["Terminal", "/terminal"], ["Rules", "/#rules"]]],
            ["Resources", [["FAQ", "/#faq"], ["How it works", "/#how"]]],
          ].map(([h, ls]) => (
            <div key={h as string} className="group/links flex flex-col gap-2.5">
              <span className="type-label text-muted-foreground">{h as string}</span>
              {(ls as string[][]).map(([l, href]) => (
                <a key={l} href={href} className="w-fit type-body text-foreground transition-[opacity] duration-300 ease-out group-hover/links:opacity-30 hover:!opacity-100">
                  {l}
                </a>
              ))}
            </div>
          ))}
        </nav>
      </div>
    </footer>
  );
}
