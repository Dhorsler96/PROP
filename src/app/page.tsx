import { SiteHeader, Ticker } from "@/components/site/header";
import { Hero } from "@/components/site/hero";
import { Pricing } from "@/components/site/pricing";
import { Closing, Faq, Footer, HowItWorks, Rules, TerminalSection } from "@/components/site/sections";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <Ticker />
      <main>
        <Hero />
        <HowItWorks />
        <Pricing />
        <Rules />
        <TerminalSection />
        <Faq />
        <Closing />
      </main>
      <Footer />
    </>
  );
}
