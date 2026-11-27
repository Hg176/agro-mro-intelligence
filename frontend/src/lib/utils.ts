import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge com a escala do tema (src/index.css). Sem isto, ele trataria
 * "text-titulo-m" como cor e apagaria "text-tinta-900" ao juntar as duas.
 */
const juntarClasses = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "display-xl",
        "display-l",
        "titulo-m",
        "numero-l",
        "titulo-pagina",
        "titulo-secao",
        "numero-kpi",
        "titulo-s",
        "corpo-l",
        "corpo-m",
        "corpo-s",
        "rotulo",
        "botao",
      ],
      font: ["sans", "display"],
      radius: ["pill"],
      shadow: ["foco", "previa"],
      spacing: ["esp-4", "esp-8", "esp-12", "esp-16", "esp-24", "esp-32", "esp-48", "esp-80"],
    },
  },
});

/** Junta classes e resolve conflitos do Tailwind (padrão do shadcn/ui). */
export function cn(...entradas: ClassValue[]) {
  return juntarClasses(clsx(entradas));
}
