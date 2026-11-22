import type { Metadata } from "next";
import { BloomStudio } from "@/components/bloom/bloom-studio";
import { SiteHeader } from "@/components/site/header";

export const metadata: Metadata = {
  title: "Bloom — Tendril brand image tool",
  description: "Generate Tendril brand backplates: flowers that emerge from columns of chart bars on a textured ground.",
};

export default function BloomPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-8 sm:px-8">
        <div className="flex max-w-2xl flex-col gap-3">
          <p className="type-eyebrow text-muted-foreground">Brand tool</p>
          <h1 className="type-heading">Bloom</h1>
          <p className="type-body-md text-secondary-text [text-wrap:pretty]">
            Textured backplates for brand imagery. Continuous lines cover a flat ground, stepping thicker and thinner like candles on a chart, and an image emerges where they swell. Start from the marigold or upload your own threshold image.
          </p>
        </div>
        <BloomStudio />
      </main>
    </>
  );
}
