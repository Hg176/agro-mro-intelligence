/** Testes dos componentes menores: Botao, CartaoKpi, ChipFiltro, Abas, Gaveta, Stepper, EstadoVazio, BarraSalvar. */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PackageOpen } from "lucide-react";
import { MemoryRouter } from "react-router";

import { Aba, Abas, ConteudoAba, ListaAbas } from "@/componentes/Abas";
import { BarraSalvar } from "@/componentes/BarraSalvar";
import { Botao } from "@/componentes/Botao";
import { CartaoKpi, GrupoKpi } from "@/componentes/CartaoKpi";
import { ChipFiltro } from "@/componentes/ChipFiltro";
import { EstadoVazio } from "@/componentes/EstadoVazio";
import { Gaveta } from "@/componentes/Gaveta";
import { Stepper } from "@/componentes/Stepper";

describe("Botao", () => {
  it.each([
    ["default", "bg-verde-700"],
    ["cta", "bg-ouro-500"],
    ["secundario", "bg-branco"],
    ["fantasma", "bg-transparent"],
    ["perigo", "bg-status-ruptura"],
  ] as const)("variante %s usa o token certo", (variante, classe) => {
    render(<Botao variant={variante}>Ação</Botao>);
    expect(screen.getByRole("button", { name: "Ação" })).toHaveClass(classe);
  });

  it("alvo mínimo de 44px e grande de 52px", () => {
    render(
      <>
        <Botao>Normal</Botao>
        <Botao size="grande">Grande</Botao>
      </>,
    );
    expect(screen.getByRole("button", { name: "Normal" })).toHaveClass("min-h-11");
    expect(screen.getByRole("button", { name: "Grande" })).toHaveClass("min-h-[52px]");
  });

  it("CTA dourado tem texto verde-950 (contraste)", () => {
    render(<Botao variant="cta">Assinar</Botao>);
    expect(screen.getByRole("button", { name: "Assinar" })).toHaveClass("text-verde-950");
  });
});

describe("CartaoKpi", () => {
  it("mostra rótulo, número, apoio e link", () => {
    render(
      <MemoryRouter>
        <GrupoKpi titulo="Dinheiro">
          <CartaoKpi
            rotulo="Valor em estoque"
            valor="R$ 2,4 mi"
            apoio="812 posições com preço"
            link={{ texto: "Ver composição →", para: "/app/materiais" }}
          />
        </GrupoKpi>
      </MemoryRouter>,
    );
    expect(screen.getByRole("region", { name: "Dinheiro" })).toBeInTheDocument();
    expect(screen.getByText("R$ 2,4 mi")).toHaveClass("text-numero-l");
    expect(screen.getByRole("link", { name: "Ver composição →" })).toHaveAttribute(
      "href",
      "/app/materiais",
    );
  });

  it("indisponível mostra o motivo, não zero", () => {
    render(<CartaoKpi rotulo="Saldo negativo" valor={null} motivo="Sem saldo final no cadastro" />);
    expect(screen.getByText("Sem saldo final no cadastro")).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});

describe("ChipFiltro", () => {
  it("alterna com aria-pressed e mostra a contagem da API", async () => {
    const alternar = vi.fn();
    render(<ChipFiltro rotulo="Abaixo do PP" contagem={23} ativo={false} aoAlternar={alternar} />);
    const chip = screen.getByRole("button", { name: /Abaixo do PP/ });
    expect(chip).toHaveAttribute("aria-pressed", "false");
    expect(chip).toHaveTextContent("23");
    await userEvent.click(chip);
    expect(alternar).toHaveBeenCalledTimes(1);
  });

  it("ativo com aoRemover mostra o botão de remover", async () => {
    const remover = vi.fn();
    render(
      <ChipFiltro rotulo="Classe A" contagem={98} ativo aoAlternar={vi.fn()} aoRemover={remover} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Remover filtro Classe A" }));
    expect(remover).toHaveBeenCalledTimes(1);
  });

  it("contagem ausente vira traço", () => {
    render(<ChipFiltro rotulo="Sem cálculo" contagem={null} ativo={false} aoAlternar={vi.fn()} />);
    expect(screen.getByRole("button", { name: /Sem cálculo/ })).toHaveTextContent("—");
  });
});

describe("Abas", () => {
  it("troca de aba pelo teclado (setas)", async () => {
    render(
      <Abas defaultValue="abc">
        <ListaAbas aria-label="Classificação">
          <Aba value="abc">ABC consumo</Aba>
          <Aba value="pqr">PQR saídas</Aba>
        </ListaAbas>
        <ConteudoAba value="abc">Conteúdo ABC</ConteudoAba>
        <ConteudoAba value="pqr">Conteúdo PQR</ConteudoAba>
      </Abas>,
    );
    const abc = screen.getByRole("tab", { name: "ABC consumo" });
    expect(abc).toHaveAttribute("aria-selected", "true");
    abc.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "PQR saídas" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Conteúdo PQR");
  });
});

describe("Gaveta", () => {
  it("abre com título e fecha com o botão Fechar", async () => {
    const mudar = vi.fn();
    render(
      <Gaveta aberta aoMudar={mudar} titulo="Adicionar material">
        <p>Formulário</p>
      </Gaveta>,
    );
    expect(screen.getByRole("dialog", { name: "Adicionar material" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(mudar).toHaveBeenCalledWith(false);
  });
});

describe("Stepper", () => {
  it("marca concluídos e o atual com aria-current=step", () => {
    render(<Stepper passos={["Arquivo", "Colunas", "Prévia", "Concluído"]} atual={1} />);
    const passos = screen.getAllByRole("listitem");
    expect(passos[0]).toHaveTextContent("Arquivo (concluído)");
    expect(passos[1]).toHaveAttribute("aria-current", "step");
    expect(passos[2]).not.toHaveAttribute("aria-current");
  });
});

describe("EstadoVazio", () => {
  it("mostra título, texto e ação", () => {
    render(
      <EstadoVazio
        icone={PackageOpen}
        titulo="Seu catálogo ainda está vazio"
        texto="Importe os dados mestres."
        acao={<Botao>Importar</Botao>}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Seu catálogo ainda está vazio" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Importar" })).toBeInTheDocument();
  });
});

describe("BarraSalvar", () => {
  it("só aparece quando há mudança, e sobe com motion-safe", async () => {
    const salvar = vi.fn();
    const { rerender } = render(
      <BarraSalvar visivel={false} aoSalvar={salvar} aoDescartar={vi.fn()} />,
    );
    expect(screen.queryByRole("region", { name: "Alterações não salvas" })).not.toBeInTheDocument();
    rerender(<BarraSalvar visivel aoSalvar={salvar} aoDescartar={vi.fn()} />);
    const barra = screen.getByRole("region", { name: "Alterações não salvas" });
    expect(barra).toHaveClass("motion-safe:animate-subir");
    await userEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    expect(salvar).toHaveBeenCalledTimes(1);
  });
});
