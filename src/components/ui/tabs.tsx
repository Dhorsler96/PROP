"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";

/**
 * shadcn <Tabs> on Base UI. Active tab is a filled pill in the bright brand tone
 * with dark text (Figma terminal, Nov 2026).
 */
export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, children, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("flex items-center gap-1 border-b border-border p-1", className)}
      {...props}
    >
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
        "transition-[color,background-color] duration-150 ease-out hover:text-foreground",
        "data-active:bg-brand-bright data-active:text-card data-active:hover:text-card",
        className,
      )}
      {...props}
    />
  );
}

export const TabsContent = TabsPrimitive.Panel;
