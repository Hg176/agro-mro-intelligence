import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Junta classes e resolve conflitos do Tailwind (padrão do shadcn/ui). */
export function cn(...entradas: ClassValue[]) {
  return twMerge(clsx(entradas));
}
