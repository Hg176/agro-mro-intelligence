/**
 * Dialog do shadcn revisado (F1-5): mesmo tratamento do AlertDialog (fundo verde-950/50,
 * cartão branco sem sombra, motion-safe), botão Fechar de 44px em português.
 */
import { XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
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

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-esp-16 rounded-xl border border-borda bg-branco p-esp-24 text-tinta-900 outline-none sm:max-w-lg",
          "motion-safe:duration-200 motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=open]:slide-in-from-bottom-2",
          "motion-safe:data-[state=closed]:animate-out motion-safe:data-[state=closed]:fade-out-0",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-3 right-3 grid size-11 cursor-pointer place-items-center rounded-lg text-tinta-600 hover:bg-verde-50 hover:text-tinta-900"
          >
            <XIcon aria-hidden="true" className="size-5" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-esp-8 pr-10 text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-titulo-s text-tinta-900", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-corpo-m text-tinta-600", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
