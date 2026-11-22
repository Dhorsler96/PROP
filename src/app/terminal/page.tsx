import type { Metadata } from "next";
import { Terminal } from "@/components/terminal/terminal";

export const metadata: Metadata = {
  title: "Terminal — Tendril",
  description: "Trade BTC, ETH, SOL and HYPE perps on the Tendril evaluation terminal (demo with simulated prices).",
};

export default function TerminalPage() {
  return <Terminal />;
}
