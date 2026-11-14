"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Menu } from "@base-ui/react/menu";
import { ChevronDown } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { PriceChart } from "@/components/price-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, InputGroup, InputGroupAddon, Label } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress, SideToggle, Slider, ToggleGroup } from "@/components/ui/misc";
import { INTERVALS, INTERVAL_SEC, MARKET_KEYS, rng, type Interval, type MarketKey } from "@/lib/market";
import { cn, fmt, signed, usd } from "@/lib/utils";
import {
  DAILY,
  DD,
  FEE,
  START,
  TARGET,
  available,
  closePosition,
  equity,
  fill,
  initialSim,
  liqOf,
  maxSize,
  pnl,
  step,
  withMarket,
  type Side,
  type Sim,
  type Toast,
} from "./sim";

const num = (s: string) => {
  const v = parseFloat(s.replace(/,/g, ""));
  return Number.isFinite(v) ? v : NaN;
};

export function Terminal() {
  const rand = useRef(rng(42));
  const [sim, setSimState] = useState<Sim>(() => initialSim(rng(42)));
  // The ref always holds the latest state, so ticks and user actions never act on a stale copy.
  const simRef = useRef(sim);
  const setSim = useCallback((next: Sim | ((s: Sim) => Sim)) => {
    const v = typeof next === "function" ? next(simRef.current) : next;
    simRef.current = v;
    setSimState(v);
  }, []);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const pushToasts = useCallback((list: Omit<Toast, "id">[]) => {
    if (!list.length) return;
    const withIds = list.map((t) => ({ ...t, id: ++toastId.current }));
    setToasts((cur) => [...cur, ...withIds].slice(-4));
    for (const t of withIds) window.setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== t.id)), 3600);
  }, []);

  // Live simulation starts after mount so the first render matches the server.
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setInterval(() => {
      const res = step(simRef.current, rand.current);
      setSim(res.sim);
      pushToasts(res.toasts);
    }, reduce ? 2000 : 700);
    return () => window.clearInterval(id);
  }, [pushToasts, setSim]);

  /* ── order form ───────────────────────────────────────── */
  const [type, setType] = useState<"market" | "limit">("market");
  const [side, setSide] = useState<Side>("long");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("0.250");
  const [lev, setLev] = useState(5);
  const [tp, setTp] = useState("");
  const [sl, setSl] = useState("");
  const [tried, setTried] = useState(false);

  const m = sim.markets[sim.cur];
  const orderPx = type === "market" ? m.px : num(price);

  const v = useMemo(() => {
    const sz = num(size);
    const tpv = tp.trim() ? num(tp) : null;
    const slv = sl.trim() ? num(sl) : null;
    const errs: Partial<Record<"all" | "price" | "size" | "tp" | "sl", string>> = {};
    if (sim.breached) errs.all = `Trading is locked: ${sim.breached}.`;
    if (type === "limit" && !(orderPx > 0)) errs.price = "Enter a limit price.";
    if (!(sz > 0)) errs.size = "Enter a size greater than 0.";
    const L = side === "long";
    if (tpv != null && (!(tpv > 0) || (orderPx > 0 && (L ? tpv <= orderPx : tpv >= orderPx))))
      errs.tp = L ? "Take profit must be above the entry price." : "Take profit must be below the entry price.";
    if (slv != null && (!(slv > 0) || (orderPx > 0 && (L ? slv >= orderPx : slv <= orderPx))))
      errs.sl = L ? "Stop loss must be below the entry price." : "Stop loss must be above the entry price.";
    const value = sz * orderPx;
    const margin = value / lev;
    const fee = value * FEE;
    const p = sim.positions.find((x) => x.mkt === sim.cur);
    const reducing = p && p.side !== side ? (Math.min(p.size, sz) * orderPx) / p.lev : 0;
    if (!errs.size && orderPx > 0 && margin + fee - reducing > available(sim) + 1e-6)
      errs.size = `Not enough margin. Max ${fmt(maxSize(sim, orderPx, lev), m.sdec)} ${sim.cur} at ${lev}×.`;
    return { sz, tpv, slv, value, margin, fee, errs, ok: Number.isFinite(value) && value > 0 };
  }, [size, tp, sl, sim, type, orderPx, side, lev, m.sdec]);

  const shown = tried ? v.errs : {};
  const formError = v.errs.all || Object.values(shown)[0] || "";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    if (Object.keys(v.errs).length) return;
    if (type === "market") {
      const r = fill(simRef.current, sim.cur, side, v.sz, m.px, lev, v.tpv, v.slv, "Market");
      setSim(r.sim);
      pushToasts([
        {
          title: `Filled ${side === "long" ? "BUY" : "SELL"} ${fmt(v.sz, m.sdec)} ${sim.cur}`,
          body: `at ${fmt(m.px, m.dec)} · fee ${usd(r.fee)}${r.realized ? ` · realized ${signed(r.realized)}` : ""}`,
          tone: side === "long" ? "pos" : "neg",
        },
      ]);
      setBottom("positions");
    } else {
      setSim((s) => ({
        ...s,
        nextId: s.nextId + 1,
        orders: [...s.orders, { id: s.nextId, mkt: s.cur, side, size: v.sz, price: orderPx, lev, tp: v.tpv, sl: v.slv, t: new Date().toTimeString().slice(0, 8) }],
      }));
      pushToasts([{ title: "Limit order placed", body: `${side === "long" ? "Buy" : "Sell"} ${fmt(v.sz, m.sdec)} ${sim.cur} at ${fmt(orderPx, m.dec)}` }]);
      setBottom("orders");
    }
    setTried(false);
    setTp("");
    setSl("");
  }

  function setMarket(k: MarketKey) {
    setSim((s) => withMarket(s, k, s.iv, rand.current));
    const mk = sim.markets[k];
    setSize(fmt(Math.max(mk.step, 15000 / mk.px), mk.sdec).replace(/,/g, ""));
    if (type === "limit") setPrice(mk.px.toFixed(mk.dec));
    setTp("");
    setSl("");
  }

  /* ── bottom panel ─────────────────────────────────────── */
  const [bottom, setBottom] = useState<"positions" | "orders" | "history">("positions");
  const [bottomH, setBottomH] = useState(240);

  const close = (id: number) => {
    const r = closePosition(simRef.current, id);
    setSim(r.sim);
    if (r.toast) pushToasts([r.toast]);
  };
  const closeAll = () => {
    let s = simRef.current;
    const ev: Omit<Toast, "id">[] = [];
    for (const p of s.positions) {
      const r = closePosition(s, p.id);
      s = r.sim;
      if (r.toast) ev.push(r.toast);
    }
    setSim(s);
    pushToasts(ev);
  };

  /* ── derived account numbers ──────────────────────────── */
  const eq = equity(sim);
  const daily = Math.max(0, sim.dayStart - eq);
  const dd = Math.max(0, START - eq);
  const prog = eq - START;
  const chg = (m.px / m.open - 1) * 100;
  const entryPos = sim.positions.find((p) => p.mkt === sim.cur);
  const [hover, setHover] = useState<{ price: number; time: string } | null>(null);
  const timeLabel = useCallback(
    (i: number) => {
      const d = new Date(Date.now() - (sim.series.length - 1 - i) * INTERVAL_SEC[sim.iv] * 1000);
      return INTERVAL_SEC[sim.iv] >= 86400 ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : d.toTimeString().slice(0, 5);
    },
    [sim.series.length, sim.iv],
  );

  const big = (n: number) => (n >= 1e9 ? `$${fmt(n / 1e9, 2)}B` : `$${fmt(n / 1e6, 1)}M`);

  return (
    <div className="flex min-h-dvh flex-col xl:h-dvh">
      {/* header */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-input px-4 sm:gap-6 sm:px-6">
        <Link href="/" aria-label="Hyperprop home" className="shrink-0">
          <Logo className="h-4 w-auto" />
        </Link>
        <nav aria-label="Primary" className="hidden min-w-0 items-center gap-1 sm:flex">
          <Link href="/#pricing" className="px-2.5 py-2 type-label whitespace-nowrap text-secondary-text transition-[color] duration-150 ease-out hover:text-primary">
            Buy evaluation
          </Link>
          <span aria-current="page" className="px-2.5 py-2 type-label text-primary">
            Trade
          </span>
          <button
            type="button"
            onClick={() => pushToasts([{ title: "Payouts unlock on funded accounts", body: "Reach the profit target to get funded." }])}
            className="hidden px-2.5 py-2 type-label text-secondary-text transition-[color] duration-150 ease-out hover:text-primary sm:block"
          >
            Payout
          </button>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden h-8 items-center gap-2 border border-border px-3 type-body-sm text-secondary-text md:flex">
            Momentum book <span className="type-label text-muted-foreground">$25K</span>
          </span>
          <ThemeToggle />
          <Button size="sm" onClick={() => pushToasts([{ title: "Wallet 0x7f3a…9b21", body: "Connected (demo)" }])}>
            0x7f3a…9b21
          </Button>
        </div>
      </header>

      <div
        className={cn(
          "grid flex-1 grid-cols-[minmax(0,1fr)] xl:min-h-0 xl:overflow-hidden",
          "md:grid-cols-[minmax(0,1fr)_340px]",
          "xl:grid-cols-[minmax(0,1fr)_300px_360px] xl:grid-rows-[56px_minmax(0,1fr)_5px_var(--bottom-h)]",
        )}
        style={{ "--bottom-h": `${bottomH}px` } as React.CSSProperties}
      >
        {/* asset bar */}
        <div className="col-span-full flex h-14 items-center gap-6 overflow-x-auto border-b border-border px-4 [scrollbar-width:none] xl:col-span-2">
          <Menu.Root>
            <Menu.Trigger className="flex shrink-0 items-center gap-2 py-1.5 type-stat-lg text-base font-semibold text-foreground">
              {sim.cur}-PERP <ChevronDown className="size-3.5 text-muted-foreground" strokeWidth={1.5} />
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner sideOffset={8} align="start" className="z-50">
                <Menu.Popup className="min-w-72 origin-(--transform-origin) overscroll-contain rounded-lg border border-input bg-popover p-1 shadow-pop outline-none transition-[scale,opacity] duration-150 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
                  <div className="px-2.5 py-1.5 type-label text-muted-foreground">Markets</div>
                  {MARKET_KEYS.map((k) => {
                    const mk = sim.markets[k];
                    const c = (mk.px / mk.open - 1) * 100;
                    return (
                      <Menu.Item
                        key={k}
                        onClick={() => setMarket(k)}
                        className={cn(
                          "grid cursor-default grid-cols-[1fr_auto_auto] gap-4 rounded-sm px-2.5 py-2 type-data outline-none data-highlighted:bg-accent data-highlighted:text-primary",
                          k === sim.cur && "text-primary",
                        )}
                      >
                        <span>{k}-PERP</span>
                        <span className="text-secondary-text">{fmt(mk.px, mk.dec)}</span>
                        <span className={c >= 0 ? "text-positive" : "text-destructive"}>{signed(c)}%</span>
                      </Menu.Item>
                    );
                  })}
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
          {[
            ["Mark", fmt(m.px, m.dec), ""],
            ["24h change", `${signed(chg)}%`, chg >= 0 ? "text-positive" : "text-destructive"],
            ["24h high", fmt(m.high, m.dec), ""],
            ["24h low", fmt(m.low, m.dec), ""],
            ["Funding / 8h", `${signed(m.fund, 4)}%`, m.fund >= 0 ? "text-positive" : "text-destructive"],
            ["Open interest", big(m.oi), ""],
            ["24h volume", big(m.vol), ""],
          ].map(([l, val, c]) => (
            <div key={l} className="flex shrink-0 flex-col gap-0.5">
              <span className="type-label text-muted-foreground">{l}</span>
              <span className={cn("type-data text-foreground", c)}>{val}</span>
            </div>
          ))}
        </div>

        {/* chart */}
        <section aria-label="Price chart" className="flex h-[380px] flex-col border-b border-border md:border-r xl:h-auto xl:min-h-0">
          <div className="flex h-8 shrink-0 items-center border-b border-border" role="group" aria-label="Chart interval">
            {INTERVALS.map((iv) => (
              <button
                key={iv}
                type="button"
                aria-pressed={sim.iv === iv}
                onClick={() => setSim((s) => withMarket(s, s.cur, iv as Interval, rand.current))}
                className="h-full px-3 type-label text-muted-foreground transition-[color] duration-150 ease-out hover:text-foreground aria-pressed:text-primary"
              >
                {iv}
              </button>
            ))}
            <span className="ml-auto px-3 type-data-sm text-muted-foreground">
              {hover ? `${hover.time} · ${fmt(hover.price, m.dec)}` : `${sim.cur}-PERP · ${sim.iv}`}
            </span>
          </div>
          <PriceChart
            series={sim.series}
            dec={m.dec}
            axis
            timeLabels={timeLabel}
            onHover={setHover}
            entry={entryPos ? { price: entryPos.entry, side: entryPos.side, label: `ENTRY ${entryPos.side.toUpperCase()} ${fmt(entryPos.size, m.sdec)}` } : null}
            className="min-h-0 w-full flex-1 cursor-crosshair"
          />
        </section>

        {/* order book */}
        <section aria-label="Order book" className="flex h-[420px] min-h-0 flex-col overflow-hidden border-b border-border md:col-start-1 md:border-r xl:col-start-auto xl:h-auto">
          <Tabs defaultValue="book" className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center pr-3">
              <TabsList className="flex-1">
                <TabsTrigger value="book">Book</TabsTrigger>
                <TabsTrigger value="trades">Trades</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="book" className="flex min-h-0 flex-1 flex-col">
              <div className="grid grid-cols-3 border-b border-border px-3 py-1.5 type-label text-muted-foreground">
                <span>Price</span>
                <span className="text-right">Size ({sim.cur})</span>
                <span className="text-right">Total</span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col justify-end overflow-hidden">
                {[...sim.book.asks].reverse().map((l) => (
                  <BookRow key={`a${l.px}`} side="ask" {...l} max={sim.book.max} dec={m.dec} sdec={m.sdec} onPick={() => { setType("limit"); setPrice(l.px.toFixed(m.dec)); }} />
                ))}
              </div>
              <div className="flex justify-between border-y border-border px-3 py-1.5 type-label text-muted-foreground">
                <span>Spread</span>
                <span className="type-data-sm tracking-normal text-foreground normal-case">
                  {fmt(sim.book.asks[0].px - sim.book.bids[0].px, m.dec)} · {(((sim.book.asks[0].px - sim.book.bids[0].px) / m.px) * 100).toFixed(3)}%
                </span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {sim.book.bids.map((l) => (
                  <BookRow key={`b${l.px}`} side="bid" {...l} max={sim.book.max} dec={m.dec} sdec={m.sdec} onPick={() => { setType("limit"); setPrice(l.px.toFixed(m.dec)); }} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="trades" className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="grid grid-cols-3 border-b border-border px-3 py-1.5 type-label text-muted-foreground">
                <span>Price</span>
                <span className="text-right">Size</span>
                <span className="text-right">Time</span>
              </div>
              {sim.tape.length === 0 ? (
                <p className="p-3 type-body-sm text-muted-foreground">Waiting for trades…</p>
              ) : (
                sim.tape.map((t) => (
                  <div key={t.id} className="grid h-[22px] grid-cols-3 items-center px-3 type-data-sm motion-safe:animate-[flash_600ms_ease-out]">
                    <span className={t.buy ? "text-positive" : "text-destructive"}>{fmt(t.px, m.dec)}</span>
                    <span className="text-right text-secondary-text">{fmt(t.sz, m.sdec)}</span>
                    <span className="text-right text-muted-foreground">{t.t}</span>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </section>

        {/* order rail */}
        <aside
          aria-label="Place order"
          className="border-b border-border bg-card md:col-start-2 md:row-span-2 md:row-start-2 md:border-l xl:col-start-3 xl:row-span-4 xl:row-start-1 xl:overflow-y-auto xl:overscroll-contain"
        >
          <form onSubmit={submit} noValidate className="flex flex-col gap-3 border-b border-border px-4 pb-4">
            <Tabs value={type} onValueChange={(t) => { setType(t as "market" | "limit"); if (t === "limit" && !price) setPrice(m.px.toFixed(m.dec)); }}>
              <TabsList aria-label="Order type" className="-mx-4 px-2">
                <TabsTrigger value="market">Market</TabsTrigger>
                <TabsTrigger value="limit">Limit</TabsTrigger>
              </TabsList>
            </Tabs>
            <ToggleGroup value={[side]} onValueChange={(val) => val[0] && setSide(val[0] as Side)} aria-label="Side" className="flex">
              <SideToggle value="long" tone="buy">Buy / Long</SideToggle>
              <SideToggle value="short" tone="sell">Sell / Short</SideToggle>
            </ToggleGroup>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="f-price">Price (USDC)</Label>
              <InputGroup>
                <Input
                  id="f-price"
                  inputMode="decimal"
                  autoComplete="off"
                  disabled={type === "market"}
                  placeholder="Market"
                  value={type === "market" ? "" : price}
                  onChange={(e) => setPrice(e.target.value)}
                  aria-invalid={!!shown.price || undefined}
                />
                <InputGroupAddon>{type === "market" ? "Mkt" : "Lmt"}</InputGroupAddon>
              </InputGroup>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <Label htmlFor="f-size">Size</Label>
                <span className="type-label text-muted-foreground">Max {orderPx > 0 ? fmt(maxSize(sim, orderPx, lev), m.sdec) : "—"}</span>
              </div>
              <InputGroup>
                <Input id="f-size" inputMode="decimal" autoComplete="off" value={size} onChange={(e) => setSize(e.target.value)} aria-invalid={!!shown.size || undefined} />
                <InputGroupAddon>{sim.cur}</InputGroupAddon>
              </InputGroup>
              <div className="grid grid-cols-4">
                {[25, 50, 75, 100].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      const q = Math.floor(maxSize(sim, orderPx, lev) * (p / 100) * 10 ** m.sdec) / 10 ** m.sdec;
                      setSize(q.toFixed(m.sdec));
                    }}
                    className="-ml-px h-6 border border-border type-data-sm text-muted-foreground transition-[color,border-color] duration-150 ease-out first:ml-0 first:rounded-l-md last:rounded-r-md hover:relative hover:border-primary hover:text-primary"
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="type-label text-muted-foreground">Leverage</span>
              <Slider value={lev} min={1} max={5} step={1} onValueChange={(val) => setLev(val as number)} className="flex-1" />
              <output className="w-8 text-right type-data text-foreground">{lev}×</output>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="type-label text-muted-foreground">Take profit / Stop loss</span>
              <div className="grid grid-cols-2 gap-2">
                <InputGroup>
                  <Input aria-label="Take profit price" inputMode="decimal" autoComplete="off" placeholder="TP price" value={tp} onChange={(e) => setTp(e.target.value)} aria-invalid={!!shown.tp || undefined} />
                </InputGroup>
                <InputGroup>
                  <Input aria-label="Stop loss price" inputMode="decimal" autoComplete="off" placeholder="SL price" value={sl} onChange={(e) => setSl(e.target.value)} aria-invalid={!!shown.sl || undefined} />
                </InputGroup>
              </div>
            </div>

            <dl className="flex flex-col gap-2 border-t border-border pt-3">
              <Metric label="Order value" value={v.ok ? usd(v.value) : "—"} />
              <Metric label="Margin required" value={v.ok ? usd(v.margin) : "—"} />
              <Metric label="Liq. price" value={orderPx > 0 ? fmt(liqOf(orderPx, side, lev), m.dec) : "—"} className="text-destructive" />
              <Metric label="Fees (0.04%)" value={v.ok ? usd(v.fee) : "—"} />
            </dl>

            <Button type="submit" size="lg" variant={side === "long" ? "positive" : "destructive"} disabled={!!sim.breached} className="w-full">
              {side === "long" ? "Buy / Long" : "Sell / Short"} {sim.cur}
              {type === "limit" ? " · Limit" : ""}
            </Button>
            <p role="alert" className="min-h-4 type-body-sm text-destructive">
              {formError}
            </p>
          </form>

          <div className="flex flex-col gap-2 px-4 pt-3 pb-5">
            <div className="mb-1 flex items-center gap-2">
              <span className="type-label text-muted-foreground">Account</span>
              {sim.breached ? <Badge variant="destructive">Breached</Badge> : prog >= TARGET ? <Badge variant="positive">Target reached</Badge> : <Badge variant="warning">Evaluation</Badge>}
            </div>
            <Metric label="Equity" value={usd(eq)} />
            <Metric label="Available margin" value={usd(available(sim))} />
            <Metric label="Daily loss used" value={`${usd(daily)} / ${usd(DAILY)}`} className={daily > 0 ? "text-destructive" : "text-muted-foreground"} />
            <Progress value={(daily / DAILY) * 100} tone={daily / DAILY > 0.66 ? "destructive" : "warning"} label="Daily loss used" />
            <Metric label="Drawdown used" value={`${usd(dd)} / ${usd(DD)}`} className={dd > 0 ? "text-destructive" : "text-muted-foreground"} />
            <Progress value={(dd / DD) * 100} tone={dd / DD > 0.66 ? "destructive" : "warning"} label="Drawdown used" />
            <Metric label="Target progress" value={`${signed(prog, 0)} / $${fmt(TARGET, 0)}`} className={prog > 0 ? "text-positive" : prog < 0 ? "text-destructive" : "text-muted-foreground"} />
            <Progress value={(prog / TARGET) * 100} tone="positive" label="Target progress" />
            {sim.breached ? (
              <div role="alert" className="mt-2 rounded-lg border border-destructive bg-neg-wash p-3 type-body-sm text-destructive">
                Rule breached: {sim.breached}. In a live evaluation this ends the account.
                <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => setSim(initialSim(rng(42)))}>
                  Reset demo account
                </Button>
              </div>
            ) : null}
            <p className="mt-2 type-body-sm text-muted-foreground">Demo with simulated prices. Orders and balances stay in this browser tab.</p>
          </div>
        </aside>

        {/* resize divider (desktop) */}
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize positions panel"
          aria-valuenow={bottomH}
          tabIndex={0}
          className="hidden cursor-row-resize touch-none border-t border-border transition-[background-color] duration-150 ease-out hover:bg-accent focus-visible:bg-accent xl:col-span-2 xl:block"
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") setBottomH((h) => Math.min(window.innerHeight * 0.6, h + 20));
            if (e.key === "ArrowDown") setBottomH((h) => Math.max(120, h - 20));
          }}
          onPointerDown={(e) => {
            const startY = e.clientY;
            const startH = bottomH;
            const el = e.currentTarget;
            el.setPointerCapture(e.pointerId);
            const move = (ev: PointerEvent) => setBottomH(Math.max(120, Math.min(window.innerHeight * 0.6, startH - (ev.clientY - startY))));
            const up = () => {
              el.removeEventListener("pointermove", move);
              el.removeEventListener("pointerup", up);
            };
            el.addEventListener("pointermove", move);
            el.addEventListener("pointerup", up);
          }}
        />

        {/* positions / orders / history */}
        <section aria-label="Account activity" className="col-span-full flex min-h-64 flex-col md:col-span-2 xl:col-span-2 xl:min-h-0">
          <Tabs value={bottom} onValueChange={(t) => setBottom(t as typeof bottom)} className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center gap-2 border-b border-border pr-2">
              <TabsList className="min-w-0 flex-1 overflow-x-auto border-b-0 [scrollbar-width:none]">
                <TabsTrigger value="positions">
                  Positions <Count n={sim.positions.length} />
                </TabsTrigger>
                <TabsTrigger value="orders">
                  Open orders <Count n={sim.orders.length} />
                </TabsTrigger>
                <TabsTrigger value="history">Trade history</TabsTrigger>
              </TabsList>
              {bottom === "positions" ? (
                <Button size="sm" variant="outline" className="h-7" disabled={!sim.positions.length || !!sim.breached} onClick={closeAll}>
                  Close all
                </Button>
              ) : bottom === "orders" ? (
                <Button size="sm" variant="outline" className="h-7" disabled={!sim.orders.length} onClick={() => { setSim((s) => ({ ...s, orders: [] })); pushToasts([{ title: "All orders cancelled" }]); }}>
                  Cancel all
                </Button>
              ) : null}
            </div>
            <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
              <TabsContent value="positions">
                <Table head={["Market", "Side", "Size", "Entry", "Mark", "Liq.", "Unrealized PnL", ""]}>
                  {sim.positions.length === 0 ? (
                    <Empty>No open positions. Place an order from the panel on the right.</Empty>
                  ) : (
                    sim.positions.map((p) => {
                      const mk = sim.markets[p.mkt];
                      const u = pnl(sim, p);
                      const roe = (u / ((p.size * p.entry) / p.lev)) * 100;
                      return (
                        <tr key={p.id} className="border-b border-border transition-[background-color] duration-100 ease-out hover:bg-inset">
                          <Td className="text-foreground">{p.mkt}-PERP</Td>
                          <Td className={p.side === "long" ? "text-positive" : "text-destructive"}>
                            {p.side.toUpperCase()} · {p.lev}×
                          </Td>
                          <Td right>{fmt(p.size, mk.sdec)}</Td>
                          <Td right>{fmt(p.entry, mk.dec)}</Td>
                          <Td right>{fmt(mk.px, mk.dec)}</Td>
                          <Td right className="text-destructive">{fmt(liqOf(p.entry, p.side, p.lev), mk.dec)}</Td>
                          <Td right className={u >= 0 ? "text-positive" : "text-destructive"}>
                            {signed(u)} <span className="ml-1 text-muted-foreground">{signed(roe, 1)}%</span>
                            {p.tp || p.sl ? (
                              <span className="ml-2 type-data-sm text-muted-foreground">
                                {p.tp ? `TP ${fmt(p.tp, mk.dec)}` : ""}
                                {p.tp && p.sl ? " · " : ""}
                                {p.sl ? `SL ${fmt(p.sl, mk.dec)}` : ""}
                              </span>
                            ) : null}
                          </Td>
                          <Td right>
                            <Button size="sm" variant="outline" className="h-6 px-2" disabled={!!sim.breached} onClick={() => close(p.id)}>
                              Close
                            </Button>
                          </Td>
                        </tr>
                      );
                    })
                  )}
                </Table>
              </TabsContent>
              <TabsContent value="orders">
                <Table head={["Market", "Side", "Size", "Limit", "Mark", "Placed", ""]}>
                  {sim.orders.length === 0 ? (
                    <Empty>No open orders. Switch to Limit, or click a price in the order book.</Empty>
                  ) : (
                    sim.orders.map((o) => {
                      const mk = sim.markets[o.mkt];
                      return (
                        <tr key={o.id} className="border-b border-border hover:bg-inset">
                          <Td className="text-foreground">{o.mkt}-PERP</Td>
                          <Td className={o.side === "long" ? "text-positive" : "text-destructive"}>
                            {o.side === "long" ? "BUY" : "SELL"} · {o.lev}×
                          </Td>
                          <Td right>{fmt(o.size, mk.sdec)}</Td>
                          <Td right>{fmt(o.price, mk.dec)}</Td>
                          <Td right>{fmt(mk.px, mk.dec)}</Td>
                          <Td right className="text-muted-foreground">{o.t}</Td>
                          <Td right>
                            <Button size="sm" variant="outline" className="h-6 px-2" onClick={() => { setSim((s) => ({ ...s, orders: s.orders.filter((x) => x.id !== o.id) })); pushToasts([{ title: "Order cancelled" }]); }}>
                              Cancel
                            </Button>
                          </Td>
                        </tr>
                      );
                    })
                  )}
                </Table>
              </TabsContent>
              <TabsContent value="history">
                <Table head={["Time", "Market", "Side", "Size", "Price", "Fee", "Realized PnL"]}>
                  {sim.fills.length === 0 ? (
                    <Empty>No trades yet this session.</Empty>
                  ) : (
                    sim.fills.map((f) => {
                      const mk = sim.markets[f.mkt];
                      return (
                        <tr key={f.id} className="border-b border-border hover:bg-inset">
                          <Td className="text-muted-foreground">{f.t}</Td>
                          <Td className="text-foreground">
                            {f.mkt}-PERP <span className="ml-1 type-data-sm text-muted-foreground">{f.reason}</span>
                          </Td>
                          <Td className={f.side === "long" ? "text-positive" : "text-destructive"}>{f.side === "long" ? "BUY" : "SELL"}</Td>
                          <Td right>{fmt(f.size, mk.sdec)}</Td>
                          <Td right>{fmt(f.price, mk.dec)}</Td>
                          <Td right>{usd(f.fee)}</Td>
                          <Td right className={f.realized > 0 ? "text-positive" : f.realized < 0 ? "text-destructive" : "text-muted-foreground"}>
                            {f.realized ? signed(f.realized) : "—"}
                          </Td>
                        </tr>
                      );
                    })
                  )}
                </Table>
              </TabsContent>
            </div>
          </Tabs>
        </section>
      </div>

      {/* toasts (Sonner-style) */}
      <div role="status" aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(356px,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "rounded-lg border border-input bg-popover px-3.5 py-2.5 shadow-pop motion-safe:animate-[toast-in_300ms_ease-out]",
            )}
          >
            <p className="flex items-center gap-2 type-data text-foreground">
              <span
                aria-hidden
                className={cn("size-1.5 shrink-0 rounded-full", t.tone === "pos" ? "bg-positive" : t.tone === "neg" ? "bg-destructive" : "bg-primary")}
              />
              {t.title}
            </p>
            {t.body ? <p className="type-body-sm text-secondary-text">{t.body}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function BookRow({ side, px, sz, total, max, dec, sdec, onPick }: { side: "ask" | "bid"; px: number; sz: number; total: number; max: number; dec: number; sdec: number; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      title="Set limit price"
      className="relative grid h-[22px] w-full shrink-0 grid-cols-3 items-center px-3 text-left type-data-sm transition-[background-color] duration-100 ease-out hover:bg-muted"
    >
      <span className={cn("absolute inset-y-px right-0 transition-[width] duration-300 ease-out", side === "ask" ? "bg-neg-wash" : "bg-pos-wash")} style={{ width: `${(total / max) * 100}%` }} />
      <span className={cn("relative", side === "ask" ? "text-destructive" : "text-positive")}>{fmt(px, dec)}</span>
      <span className="relative text-right text-secondary-text">{fmt(sz, sdec)}</span>
      <span className="relative text-right text-secondary-text">{fmt(total, sdec)}</span>
    </button>
  );
}

function Metric({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="type-body-sm text-muted-foreground">{label}</dt>
      <dd className={cn("text-right type-data-sm text-foreground", className)}>{value}</dd>
    </div>
  );
}

function Count({ n }: { n: number }) {
  return (
    <span className={cn("inline-flex h-4 min-w-4 items-center justify-center rounded-sm border px-1 font-mono text-[10px] tracking-normal", n > 0 ? "border-brand-line bg-accent text-primary" : "border-input text-muted-foreground")}>
      {n}
    </span>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full min-w-[760px] border-collapse tabular-nums">
      <thead className="sticky top-0 z-10 bg-background">
        <tr className="border-b border-border">
          {head.map((h, i) => (
            <th key={i} scope="col" className={cn("px-3 py-2 type-label font-normal whitespace-nowrap text-muted-foreground", i >= 2 ? "text-right" : "text-left")}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function Td({ children, right, className }: { children: React.ReactNode; right?: boolean; className?: string }) {
  return <td className={cn("h-10 px-3 type-data whitespace-nowrap text-secondary-text", right && "text-right", className)}>{children}</td>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={8} className="px-3 py-7 type-body-sm text-muted-foreground">
        {children}
      </td>
    </tr>
  );
}
