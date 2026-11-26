/** Skeleton do shadcn revisado (F1-5): bloco cor da borda com brilho (só com motion-safe). */
import type * as React from "react";

import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("rounded-md bg-borda motion-safe:brilho-skeleton", className)}
      {...props}
    />
  );
}

export { Skeleton };
