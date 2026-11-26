/**
 * Abas do shadcn revisadas (F1-5), como no VisaoGeral.dc.html: lista em creme-100 com
 * padding 4px e raio 12px; abas de 44px, raio 9px; ativa em branco, peso 600.
 * Variante "pilula": abas soltas com borda (RegrasLetras/NivelServico), ativa em verde-900.
 */
import { cva, type VariantProps } from "class-variance-authority";
import { Tabs as TabsPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("group/tabs flex flex-col gap-esp-16", className)}
      {...props}
    />
  );
}

const tabsListVariants = cva("group/tabs-list inline-flex w-fit flex-wrap items-center", {
  variants: {
    variant: {
      default: "gap-1 rounded-lg bg-creme-100 p-1",
      pilula: "gap-2",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 px-4 text-sm leading-5 whitespace-nowrap",
        "transition-colors motion-reduce:transition-none",
        "disabled:cursor-not-allowed disabled:text-tinta-300",
        // padrão (segmentada)
        "group-data-[variant=default]/tabs-list:rounded-[9px] group-data-[variant=default]/tabs-list:font-medium group-data-[variant=default]/tabs-list:text-tinta-600",
        "group-data-[variant=default]/tabs-list:data-[state=active]:bg-branco group-data-[variant=default]/tabs-list:data-[state=active]:font-semibold group-data-[variant=default]/tabs-list:data-[state=active]:text-tinta-900",
        // pílula
        "group-data-[variant=pilula]/tabs-list:rounded-pill group-data-[variant=pilula]/tabs-list:border group-data-[variant=pilula]/tabs-list:border-borda group-data-[variant=pilula]/tabs-list:bg-branco group-data-[variant=pilula]/tabs-list:font-semibold group-data-[variant=pilula]/tabs-list:text-tinta-900",
        "group-data-[variant=pilula]/tabs-list:data-[state=active]:border-verde-900 group-data-[variant=pilula]/tabs-list:data-[state=active]:bg-verde-900 group-data-[variant=pilula]/tabs-list:data-[state=active]:text-branco",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants };
