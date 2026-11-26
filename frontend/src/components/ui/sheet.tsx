/**
 * Sheet (gaveta) do shadcn revisado (F1-5): fundo verde-950/50, painel branco sem sombra,
 * desliza só com motion-safe, botão Fechar de 44px com texto em português.
 */
import { XIcon } from "lucide-react";
import { Dialog as SheetPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger({ ...props }: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose({ ...props }: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal({ ...props }: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-verde-950/50",
        "motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0",
        "motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:fade-out-0",
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "right" | "left";
  showCloseButton?: boolean;
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed inset-y-0 z-50 flex h-full w-full flex-col gap-esp-16 overflow-y-auto bg-branco text-tinta-900 sm:max-w-[520px]",
          "motion-safe:transition motion-safe:ease-out motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:duration-200 motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:duration-300",
          side === "right" &&
            "right-0 border-l border-borda motion-safe:data-[state=closed]:slide-out-to-right motion-safe:data-[state=open]:slide-in-from-right",
          side === "left" &&
            "left-0 border-r border-borda motion-safe:data-[state=closed]:slide-out-to-left motion-safe:data-[state=open]:slide-in-from-left",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close className="absolute top-3 right-3 grid size-11 cursor-pointer place-items-center rounded-lg text-tinta-600 hover:bg-verde-50 hover:text-tinta-900">
            <XIcon aria-hidden="true" className="size-5" />
            <span className="sr-only">Fechar</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 px-esp-24 pt-esp-24 pr-16", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "mt-auto flex flex-wrap justify-end gap-3 border-t border-borda px-esp-24 py-esp-16",
        className,
      )}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("font-display text-titulo-s text-tinta-900", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-corpo-m text-tinta-600", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
};
