import type { Metadata } from "next";
import { BloomStudio } from "@/components/bloom/bloom-studio";
import { SiteHeader } from "@/components/site/header";

export const metadata: Metadata = {
  title: "Bloom — Prop brand image tool",
  description: "Generate Prop brand images: flowers grown from the terminal's chart lines, area fills, grids and depth bars.",
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
            Flowers grown from the terminal’s charts. Each petal layer is a price line wrapped into a circle, with the chart’s area fill, gridlines and order-book depth bars around it.
          </p>
        </div>
        <BloomStudio />
      </main>
    </>
  );
}
