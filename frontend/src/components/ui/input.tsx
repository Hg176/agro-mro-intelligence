/**
 * Campo de texto do shadcn revisado (F1-5): 48px, raio-md, borda do token, placeholder
 * tinta-300; foco = borda verde-700 + sombra-foco; erro (aria-invalid) = borda status-ruptura.
 */
import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-md border border-borda bg-branco px-3.5 text-corpo-m text-tinta-900",
        "placeholder:text-tinta-300 selection:bg-verde-100 selection:text-verde-950",
        "transition-[border-color,box-shadow] motion-reduce:transition-none",
        "focus-visible:border-verde-700 focus-visible:shadow-foco focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:bg-creme-100 disabled:text-tinta-300",
        "aria-invalid:border-status-ruptura",
        "file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-tinta-900",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
