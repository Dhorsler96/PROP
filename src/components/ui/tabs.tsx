"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";

/**
 * shadcn <Tabs> on Base UI. The active tab is a filled pill in the bright brand tone
 * (Figma terminal, Nov 2026). The pill is one indicator element that glides between tabs
 * using Base UI's --active-tab-* variables; the label colour fades over the same 200ms so
 * text never sits dark on the empty track. Under reduced motion the pill moves instantly.
 *
 * The indicator can only be measured in the browser, so until the list has mounted the
 * active tab paints its own pill (server HTML and first paint stay correct), and the
 * indicator's first placement doesn't animate.
 */
export const Tabs = TabsPrimitive.Root;

const GLIDE = "duration-200 ease-[cubic-bezier(0.2,0,0,1)]";

export function TabsList({ className, children, ...props }: TabsPrimitive.List.Props) {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    // Two frames: Base UI measures the active tab, then we enable the glide.
    let b = 0;
    const a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
    };
  }, []);

  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-ready={ready}
      className={cn("group/tabs relative isolate flex items-center gap-1 border-b border-border p-1", className)}
      {...props}
    >
      <TabsPrimitive.Indicator
        aria-hidden
        className={cn(
          "absolute top-(--active-tab-top) left-0 -z-10 h-(--active-tab-height) w-(--active-tab-width) translate-x-(--active-tab-left)",
          "rounded-md bg-primary opacity-0 group-data-[ready=true]/tabs:opacity-100",
          "group-data-[ready=true]/tabs:motion-safe:transition-[translate,width]",
          GLIDE,
        )}
      />
      {children}
    </TabsPrimitive.List>
  );
}

export function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-[30px] items-center gap-1.5 rounded-md px-3 type-label whitespace-nowrap text-muted-foreground",
        "transition-[color,scale]",
        GLIDE,
        "hover:text-foreground data-active:text-primary-foreground data-active:hover:text-primary-foreground motion-safe:active:scale-[0.96]",
        // Static pill until the sliding indicator is ready.
        "group-data-[ready=false]/tabs:data-active:bg-primary",
        className,
      )}
      {...props}
    />
  );
}

export const TabsContent = TabsPrimitive.Panel;
