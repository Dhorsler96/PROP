import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

/**
 * Marketing CTA with the hover language adapted from icomat.co.uk:
 * the fill's top half flips down to reveal a brighter gradient, the label rolls up to a
 * fresh copy of itself, and the ↗ arrow turns to → as a circle grows behind it.
 * Styles live in globals.css (.cta-flap, .text-roll, .cta-arrow). Hover-capable pointers
 * only; under reduced motion the fill still brightens but nothing moves.
 */
const ctaClass = (size: "sm" | "default" | "lg", className?: string) =>
  cn(
    buttonVariants({ variant: "default", size }),
    "cta-flap gap-3 hover:border-primary hover:bg-primary",
    size === "sm" ? "pl-3 pr-2.5" : "pr-5",
    className,
  );

function Inner({ children }: { children: React.ReactNode }) {
  return (
    <>
      <span className="cta-flap__bg" aria-hidden />
      <span className="text-roll">
        <span>{children}</span>
      </span>
      <span className="cta-arrow" aria-hidden>
        <ArrowRight strokeWidth={2} />
      </span>
    </>
  );
}

export function CtaLink({
  size = "lg",
  className,
  children,
  ...props
}: React.ComponentProps<typeof Link> & { size?: "sm" | "default" | "lg" }) {
  return (
    <Link data-slot="cta" className={ctaClass(size, className)} {...props}>
      <Inner>{children}</Inner>
    </Link>
  );
}

export function CtaButton({
  size = "lg",
  className,
  children,
  type = "button",
  ...props
}: React.ComponentProps<"button"> & { size?: "sm" | "default" | "lg" }) {
  return (
    <button data-slot="cta" type={type} className={ctaClass(size, className)} {...props}>
      <Inner>{children}</Inner>
    </button>
  );
}

/** Secondary link whose arrow slides right on hover (icomat inline links: 300ms ease). */
export function ArrowLink({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Link>) {
  return (
    <Link
      data-slot="arrow-link"
      className={cn(buttonVariants({ variant: "outline", size: "lg" }), "group gap-3", className)}
      {...props}
    >
      <span>{children}</span>
      <ArrowRight
        aria-hidden
        strokeWidth={2}
        className="size-3.5 motion-safe:transition-[translate] motion-safe:duration-300 motion-safe:ease-out motion-safe:group-hover:translate-x-1/2"
      />
    </Link>
  );
}
