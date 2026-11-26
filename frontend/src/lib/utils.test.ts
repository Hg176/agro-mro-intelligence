import { cn } from "@/lib/utils";

describe("cn (tailwind-merge com a escala do tema)", () => {
  it("mantém tamanho de texto e cor de texto juntos", () => {
    expect(cn("text-titulo-m", "text-tinta-900")).toBe("text-titulo-m text-tinta-900");
    expect(cn("text-rotulo", "text-ouro-700")).toBe("text-rotulo text-ouro-700");
  });

  it("resolve conflito dentro da escala de texto", () => {
    expect(cn("text-corpo-s", "text-titulo-m")).toBe("text-titulo-m");
  });

  it("resolve conflito entre cores de token", () => {
    expect(cn("text-tinta-500", "text-verde-700")).toBe("text-verde-700");
    expect(cn("bg-branco", "bg-verde-50")).toBe("bg-verde-50");
  });

  it("conhece sombras, raios e espaçamentos do tema", () => {
    expect(cn("shadow-foco", "shadow-previa")).toBe("shadow-previa");
    expect(cn("rounded-xl", "rounded-pill")).toBe("rounded-pill");
    expect(cn("p-esp-16", "p-esp-24")).toBe("p-esp-24");
  });
});
