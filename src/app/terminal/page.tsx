import type { Metadata } from "next";
import { Terminal } from "@/components/terminal/terminal";

export const metadata: Metadata = {
  title: "Terminal — Hyperprop",
  description: "Trade BTC, ETH, SOL and HYPE perps on the Hyperprop evaluation terminal (demo with simulated prices).",
};

export default function TerminalPage() {
  return <Terminal />;
}
