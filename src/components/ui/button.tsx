import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Kbd } from "./kbd";

/**
 * shadcn <Button>, Tendril styling. 14px / 500 sentence-case label (x.ai scale).
 * Press feedback: scale 0.96 over 150ms ease-out (better-ui), never when disabled,
 * only without the reduced-motion preference.
 */
export const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md border select-none",
    "font-sans text-sm leading-5 font-medium tracking-[-0.005em] [-webkit-tap-highlight-color:transparent]",
    "transition-[scale,background-color,border-color,color,opacity] duration-150 ease-out",
    "motion-safe:not-disabled:not-aria-disabled:active:scale-[0.96]",
    "disabled:pointer-events-none disabled:opacity-40 aria-disabled:pointer-events-none aria-disabled:opacity-40",
  ],
  {
    variants: {
      variant: {
        default:
          "border-primary bg-primary text-primary-foreground hover:border-brand-bright hover:bg-brand-bright",
        secondary: "border-border bg-secondary text-secondary-foreground hover:border-input",
        outline: "border-input bg-transparent text-foreground hover:border-primary hover:text-primary",
        ghost: "border-transparent bg-transparent text-muted-foreground hover:text-foreground",
        destructive: "border-destructive bg-destructive text-background hover:opacity-90",
        positive: "border-positive bg-positive text-background hover:opacity-90",
        /** White in Dark, ink in Light: the order submit and wallet buttons. */
        inverse: "border-foreground bg-foreground text-background hover:opacity-90",
        link: "h-auto border-transparent px-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3",
        default: "h-10 px-5",
        lg: "h-11 rounded-lg px-6 text-base leading-6",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type Shared = VariantProps<typeof buttonVariants> & {
  /** Optional keyboard shortcut shown as an inline <Kbd>. */
  shortcut?: string;
};

function Content({ children, shortcut, variant }: { children: React.ReactNode } & Shared) {
  const onFill = variant === "default" || variant === "destructive" || variant === "positive" || variant === "inverse";
  return (
    <>
      {children}
      {shortcut ? (
        <Kbd className={cn(onFill && "bg-black/15 text-current")} aria-hidden>
          {shortcut}
        </Kbd>
      ) : null}
    </>
  );
}

export function Button({
  className,
  variant,
  size,
  shortcut,
  children,
  type = "button",
  ...props
}: React.ComponentProps<"button"> & Shared) {
  return (
    <button
      type={type}
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      <Content variant={variant} shortcut={shortcut}>
        {children}
      </Content>
    </button>
  );
}

export function ButtonLink({
  className,
  variant,
  size,
  shortcut,
  children,
  href,
  ...props
}: React.ComponentProps<typeof Link> & Shared) {
  return (
    <Link
      href={href}
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      <Content variant={variant} shortcut={shortcut}>
        {children}
      </Content>
    </Link>
  );
}
