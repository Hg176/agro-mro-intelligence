import { telasDoMenu, tituloDaAba } from "@/rotas/mapa";

describe("mapa das telas", () => {
  it("a chave recursos.matrizTmer tira a TMER do menu sem apagar o resto", () => {
    const ligada = telasDoMenu({ matrizTmer: true }).map((t) => t.caminho);
    const desligada = telasDoMenu({ matrizTmer: false }).map((t) => t.caminho);
    expect(ligada).toContain("/app/tmer");
    expect(desligada).not.toContain("/app/tmer");
    expect(desligada).toHaveLength(ligada.length - 1);
  });

  it("menu na ordem do design", () => {
    expect(telasDoMenu({ matrizTmer: true }).map((t) => t.titulo)).toEqual([
      "Visão geral",
      "Materiais",
      "Planejamento",
      "Importar dados",
      "Regras e letras",
      "Tipos de movimento",
      "Nível de serviço",
      "Matriz TMER",
      "Casos de controle",
      "Academia",
      "Suporte",
    ]);
  });

  it("título da aba", () => {
    expect(tituloDaAba("Visão geral")).toBe("Visão geral · Agro MRO Intelligence");
  });
});
