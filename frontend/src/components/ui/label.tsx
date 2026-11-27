/** Rótulo do shadcn revisado (F1-5): sempre acima do campo, tinta-900, peso 600. */
import { Label as LabelPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-5 font-semibold text-tinta-900 select-none",
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:text-tinta-300",
        "peer-disabled:cursor-not-allowed peer-disabled:text-tinta-300",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
