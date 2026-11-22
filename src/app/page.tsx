import { SiteHeader, Ticker } from "@/components/site/header";
import { HeroSwitch } from "@/components/site/hero-switch";
import { Pricing } from "@/components/site/pricing";
import { SiteLoader } from "@/components/site/site-loader";
import { Closing, Faq, Footer, HowItWorks, Rules, TerminalSection } from "@/components/site/sections";

export default function Home() {
  return (
    <div className="has-loader">
      <SiteLoader />
      <SiteHeader />
      <Ticker />
      <main>
        <HeroSwitch />
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
