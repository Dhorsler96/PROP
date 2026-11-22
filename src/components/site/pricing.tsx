"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CtaButton } from "@/components/ui/cta";
import { cn, fmt } from "@/lib/utils";

const SIZES = [5000, 10000, 25000, 50000, 100000];
const FEES = { "80": [60, 110, 275, 495, 999], "90": [66, 121, 302, 545, 1099] } as const;
type Split = keyof typeof FEES;

const short = (n: number) => `$${n / 1000}K`;

export function Pricing() {
  const [split, setSplit] = useState<Split>("90");
  const [tier, setTier] = useState(3);
  const size = SIZES[tier];

  const rows: { label: string; value: (s: number, i: number) => string; fee?: boolean }[] = [
    { label: "Gain split", value: () => `${split}%` },
    { label: "Profit target", value: (s) => `$${fmt(s * 0.1, 0)}` },
    { label: "Max drawdown", value: (s) => `$${fmt(s * 0.06, 0)}` },
    { label: "Max daily loss", value: () => "3%" },
    { label: "Leverage", value: () => "Up to 5:1" },
    { label: "Evaluation fee", value: (_, i) => fmt(FEES[split][i], 0), fee: true },
  ];

  return (
    <section id="pricing" aria-labelledby="pricing-title" className="scroll-mt-14 border-b border-border">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-12 px-4 py-24 sm:px-8 md:px-20 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex max-w-xl flex-col gap-3">
            <p className="type-eyebrow text-muted-foreground">Evaluations</p>
            <h2 id="pricing-title" className="type-display">Pick your size</h2>
            <p className="type-body-md text-secondary-text [text-wrap:pretty]">
              Choose the account size and gain split you want. Every tier has the same rules, scaled to its balance.
            </p>
          </div>
          <Tabs value={split} onValueChange={(v) => setSplit(v as Split)}>
            <TabsList aria-label="Gain split">
              <TabsTrigger value="80">80% gain split</TabsTrigger>
              <TabsTrigger value="90">90% split · +10% boost</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div>
          <div className="overflow-x-auto overscroll-x-contain rounded-t-xl border border-border bg-card">
            <table className="w-full min-w-[760px] table-fixed border-collapse tabular-nums">
              <caption className="sr-only">Evaluation tiers</caption>
              <thead>
                <tr>
                  <th scope="col" className="w-56 border-r border-b border-border bg-muted px-5 text-left type-label font-normal text-muted-foreground">
                    Account size
                  </th>
                  {SIZES.map((s, i) => {
                    const on = i === tier;
                    return (
                      <th key={s} scope="col" className={cn("border-b border-border p-0 font-normal", i < 4 && "border-r", on && "bg-accent")}>
                        <button
                          type="button"
                          onClick={() => setTier(i)}
                          aria-pressed={on}
                          className={cn(
                            "flex w-full flex-col items-center gap-1.5 border-t-2 py-5 transition-[background-color,border-color] duration-150 ease-out hover:bg-inset [&>span]:transition-[scale] [&>span]:duration-150 [&>span]:ease-out motion-safe:active:[&>span]:scale-[0.96]",
                            on ? "border-primary" : "border-transparent",
                          )}
                        >
                          <span className="type-stat-xl text-foreground">{short(s)}</span>
                          <span className={cn("type-label", on ? "text-primary" : "text-muted-foreground")}>{on ? "Selected" : "Select"}</span>
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, ri) => (
                  <tr key={r.label}>
                    <th scope="row" className={cn("border-r border-border bg-muted px-5 text-left type-label font-normal text-muted-foreground", ri < rows.length - 1 && "border-b")}>
                      {r.label}
                    </th>
                    {SIZES.map((s, i) => {
                      const on = i === tier;
                      return (
                        <td key={s} className={cn("h-13 border-border text-center", ri < rows.length - 1 && "border-b", i < 4 && "border-r", on && "bg-accent")}>
                          {r.fee ? (
                            <span className={cn("type-stat-lg", on ? "text-primary" : "text-foreground")}>
                              {r.value(s, i)}
                              <span className="ml-1 type-label text-muted-foreground">USDC</span>
                            </span>
                          ) : (
                            <span className={cn("type-data", on ? "text-foreground" : "text-muted-foreground")}>{r.value(s, i)}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="-mt-px flex flex-wrap items-center gap-x-10 gap-y-4 rounded-b-xl border border-border bg-muted px-6 py-5">
            <dl className="flex flex-wrap gap-x-10 gap-y-3">
              {[
                ["Account", `$${fmt(size, 0)}`],
                ["Gain split", `${split}%`],
                ["Profit target", `$${fmt(size * 0.1, 0)}`],
              ].map(([l, v]) => (
                <div key={l} className="flex flex-col gap-1">
                  <dt className="type-label text-muted-foreground">{l}</dt>
                  <dd className="type-data text-foreground">{v}</dd>
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <dt className="type-label text-muted-foreground">Total due</dt>
                <dd className="type-stat-lg text-primary" aria-live="polite">
                  {fmt(FEES[split][tier], 0)} USDC
                </dd>
              </div>
            </dl>
            <CtaButton className="ml-auto max-sm:w-full">
              Buy {short(size).slice(1)} evaluation
            </CtaButton>
          </div>
          <p className="mt-4 type-body-sm text-muted-foreground">One-time fee, paid in USDC. The 90% column includes the boost add-on.</p>
        </div>
      </div>
    </section>
  );
}
