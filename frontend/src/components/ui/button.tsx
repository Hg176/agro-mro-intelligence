/**
 * Botão do shadcn revisado para o Agro MRO (F1-5):
 * - variantes do produto: default (verde-700), cta (ouro-500, só comprar/assinar/testar),
 *   secundario, fantasma, perigo;
 * - altura mínima 44px; "grande" 52px (botões principais, lei de Fitts);
 * - foco: o do tema (outline verde-700 + halo sombra-foco, em src/index.css), sem ring padrão;
 * - desabilitado (disabled ou aria-disabled): tinta-300 sobre borda, como pede o tokens.css.
 */
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-transparent text-botao whitespace-nowrap no-underline",
    "transition-colors motion-reduce:transition-none",
    "disabled:cursor-not-allowed disabled:border-borda disabled:bg-borda disabled:text-tinta-300",
    "aria-disabled:cursor-not-allowed aria-disabled:border-borda aria-disabled:bg-borda aria-disabled:text-tinta-300",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-[18px]",
  ],
  {
    variants: {
      variant: {
        default: "bg-verde-700 text-branco hover:bg-verde-800",
        cta: "bg-ouro-500 text-verde-950 hover:bg-ouro-300",
        secundario: "border-borda bg-branco text-verde-800 hover:bg-verde-50",
        fantasma: "bg-transparent text-verde-700 hover:bg-verde-50",
        perigo: "bg-status-ruptura text-branco hover:bg-status-ruptura-texto",
      },
      size: {
        default: "min-h-11 px-5",
        grande: "min-h-[52px] px-6",
        icone: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
