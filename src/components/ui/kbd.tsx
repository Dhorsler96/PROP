import * as React from "react";
import { cn } from "@/lib/utils";

/** shadcn <Kbd>. Keyboard shortcut chip. */
export function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex h-4 min-w-4 items-center justify-center rounded-sm bg-input px-1 font-mono text-[10px] leading-none font-medium tracking-normal text-foreground normal-case",
        className,
      )}
      {...props}
    />
  );
}
