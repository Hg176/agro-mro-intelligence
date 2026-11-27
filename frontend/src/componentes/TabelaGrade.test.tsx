/** TabelaDados, GradeMatriz e GraficoBarras. */
import type { ColumnDef } from "@tanstack/react-table";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { Decimal } from "@/api/tipos";
import { GradeMatriz } from "@/componentes/GradeMatriz";
import { GraficoBarras } from "@/componentes/GraficoBarras";
import { TabelaDados } from "@/componentes/TabelaDados";

type Linha = { id: string; nome: string };
const colunas: ColumnDef<Linha, unknown>[] = [
  { id: "nome", header: "Material", cell: ({ row }) => row.original.nome },
  { id: "id", header: "Código", cell: ({ row }) => row.original.id },
];
const dados: Linha[] = [
  { id: "1", nome: "Rolamento" },
  { id: "2", nome: "Correia" },
];

describe("TabelaDados", () => {
  it("cabeçalho com th scope=col e as linhas", () => {
    render(
      <TabelaDados titulo="Materiais" colunas={colunas} dados={dados} idDaLinha={(l) => l.id} />,
    );
    const tabela = screen.getByRole("table", { name: "Materiais" });
    const cabecalhos = within(tabela).getAllByRole("columnheader");
    expect(cabecalhos.map((c) => c.getAttribute("scope"))).toEqual(["col", "col"]);
    expect(within(tabela).getAllByRole("row")).toHaveLength(3);
  });

  it("ordenação é controlada: avisa o clique e mostra aria-sort", async () => {
    const ordenar = vi.fn();
    const { rerender } = render(
      <TabelaDados
        titulo="Materiais"
        colunas={colunas}
        dados={dados}
        idDaLinha={(l) => l.id}
        ordenaveis={["nome"]}
        aoOrdenar={ordenar}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Material" }));
    expect(ordenar).toHaveBeenCalledWith({ coluna: "nome", direcao: "asc" });
    rerender(
      <TabelaDados
        titulo="Materiais"
        colunas={colunas}
        dados={dados}
        idDaLinha={(l) => l.id}
        ordenaveis={["nome"]}
        aoOrdenar={ordenar}
        ordenacao={{ coluna: "nome", direcao: "asc" }}
      />,
    );
    expect(screen.getByRole("columnheader", { name: /Material/ })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
  });

  it("paginação usa pagina/paginas/total da API", async () => {
    const mudar = vi.fn();
    render(
      <TabelaDados
        titulo="Materiais"
        colunas={colunas}
        dados={dados}
        idDaLinha={(l) => l.id}
        nomeDasLinhas="posições"
        paginacao={{ pagina: 1, paginas: 9, total: 812, aoMudarPagina: mudar }}
      />,
    );
    expect(screen.getByRole("navigation", { name: "Paginação" })).toHaveTextContent(
      "Página 1 de 9 · 812 posições",
    );
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));
    expect(mudar).toHaveBeenCalledWith(2);
  });

  it("estados carregando, vazio e erro embutidos", async () => {
    const tentar = vi.fn();
    const { rerender, container } = render(
      <TabelaDados
        titulo="T"
        colunas={colunas}
        dados={[]}
        idDaLinha={(l) => l.id}
        estado="carregando"
      />,
    );
    expect(container.querySelectorAll("[data-slot='skeleton']")).toHaveLength(5);
    rerender(
      <TabelaDados
        titulo="T"
        colunas={colunas}
        dados={[]}
        idDaLinha={(l) => l.id}
        vazio={{ titulo: "Nada encontrado" }}
      />,
    );
    expect(screen.getByRole("heading", { name: "Nada encontrado" })).toBeInTheDocument();
    rerender(
      <TabelaDados
        titulo="T"
        colunas={colunas}
        dados={[]}
        idDaLinha={(l) => l.id}
        estado="erro"
        aoTentarDeNovo={tentar}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível carregar a lista.");
    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(tentar).toHaveBeenCalledTimes(1);
  });

  it("linha destacada ganha o brilho verde (motion-safe)", () => {
    render(
      <TabelaDados
        titulo="T"
        colunas={colunas}
        dados={dados}
        idDaLinha={(l) => l.id}
        linhasDestacadas={new Set(["2"])}
      />,
    );
    const [, , correia] = screen.getAllByRole("row");
    expect(correia).toHaveClass("motion-safe:animate-brilho-linha");
  });
});

describe("GradeMatriz", () => {
  const celula = (l: string, c: string) => ({
    texto: `${c}${l}`,
    faixa: 2 as const,
    destaque: l === "P" && c === "A",
    rotulo: `${c}${l}: exemplo`,
  });

  it("cabeçalhos com scope, célula destacada com contorno e clique", async () => {
    const selecionar = vi.fn();
    render(
      <GradeMatriz
        titulo="Consumo × frequência"
        linhas={["P", "Q"]}
        colunas={["A", "B"]}
        celula={celula}
        aoSelecionar={selecionar}
      />,
    );
    expect(screen.getAllByRole("rowheader").map((h) => h.textContent)).toEqual(["P", "Q"]);
    const ap = screen.getByRole("button", { name: "AP: exemplo" });
    expect(ap).toHaveClass("outline-ouro-600");
    await userEvent.click(ap);
    expect(selecionar).toHaveBeenCalledWith("P", "A");
  });

  it("funciona pelo teclado (Tab + Enter)", async () => {
    const selecionar = vi.fn();
    render(
      <GradeMatriz
        titulo="G"
        linhas={["P"]}
        colunas={["A", "B"]}
        celula={celula}
        aoSelecionar={selecionar}
      />,
    );
    await userEvent.tab();
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(selecionar).toHaveBeenCalledWith("P", "B");
  });
});

describe("GraficoBarras", () => {
  it("tem tabela equivalente com o texto formatado do Decimal", () => {
    render(
      <GraficoBarras
        titulo="% do valor por classe"
        formatar={(v) => `${v ?? "—"}%`}
        pontos={[
          { rotulo: "A", valor: "71" as Decimal },
          { rotulo: "B", valor: null },
        ]}
      />,
    );
    const tabela = screen.getByRole("table", { name: "% do valor por classe" });
    expect(within(tabela).getByRole("rowheader", { name: "A" }).nextSibling).toHaveTextContent(
      "71%",
    );
    expect(within(tabela).getByRole("rowheader", { name: "B" }).nextSibling).toHaveTextContent(
      "—%",
    );
  });
});
