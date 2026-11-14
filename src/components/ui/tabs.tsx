"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";

/** shadcn <Tabs> on Base UI. Hyperprop uses an underline indicator, not a pill. */
export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, children, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("relative flex items-stretch border-b border-border", className)}
      {...props}
    >
      {children}
      <TabsPrimitive.Indicator
        className={cn(
          "absolute bottom-[-1px] left-0 h-px w-(--active-tab-width) translate-x-(--active-tab-left) bg-primary",
          "motion-safe:transition-[translate,width] motion-safe:duration-150 motion-safe:ease-out",
        )}
      />
    </TabsPrimitive.List>
  );
}

export function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-9 items-center gap-1.5 px-3 type-label whitespace-nowrap text-muted-foreground",
        "transition-[color] duration-150 ease-out hover:text-foreground data-active:text-primary",
        className,
      )}
      {...props}
    />
  );
}

export const TabsContent = TabsPrimitive.Panel;
