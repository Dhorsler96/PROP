import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * shadcn <InputGroup> + <Input> + <InputGroupAddon>.
 * Mono, tabular. 16px on small screens so iOS doesn't zoom on focus (better-typography).
 */
export function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "flex h-10 items-stretch border border-border bg-muted transition-[border-color] duration-150 ease-out",
        "focus-within:border-ring has-aria-invalid:border-destructive has-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn(
        "min-w-0 flex-1 bg-transparent px-3 font-mono text-base tabular-nums text-foreground outline-none sm:text-sm",
        "placeholder:text-muted-foreground/70 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  );
}

export function InputGroupAddon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="input-group-addon"
      className={cn("flex items-center border-l border-border px-3 type-label text-muted-foreground", className)}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label data-slot="label" className={cn("type-label text-muted-foreground", className)} {...props} />;
}
