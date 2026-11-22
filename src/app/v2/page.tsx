import type { Metadata } from "next";
import { SiteHeader, Ticker } from "@/components/site/header";
import { HeroSwitch } from "@/components/site/hero-switch";
import { Pricing } from "@/components/site/pricing";
import { SiteLoader } from "@/components/site/site-loader";
import { Closing, Faq, Footer, HowItWorks, Rules, TerminalSection } from "@/components/site/sections";

export const metadata: Metadata = {
  title: "Tendril — Trade our capital",
  // Alternate landing for comparison; keep it out of search results.
  robots: { index: false, follow: false },
};

/** Landing v2: terminal-snapshot hero. Everything below the hero matches the main landing. */
export default function LandingV2() {
  return (
    <div className="has-loader">
      <SiteLoader />
      <SiteHeader />
      <Ticker />
      <main>
        <HeroSwitch initial="terminal" />
        <HowItWorks />
        <Pricing />
        <Rules />
        <TerminalSection />
        <Faq />
        <Closing />
      </main>
      <Footer />
    </div>
  );
}
