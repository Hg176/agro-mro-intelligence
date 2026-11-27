import { render, screen } from "@testing-library/react";

import { ESTADOS_CASO, SeloClasse, SeloEstadoCaso, SeloStatus } from "@/componentes/Selos";

describe("SeloStatus", () => {
  it.each([
    ["ruptura", "●", "Ruptura"],
    ["abaixo_pp", "▲", "Abaixo do PP"],
    ["parado", "■", "Parado +180d"],
    ["saudavel", "✓", "Saudável"],
    ["sem_calculo", "○", "Sem cálculo"],
  ] as const)("%s mostra ícone + texto (nunca só cor)", (situacao, icone, texto) => {
    const { container } = render(<SeloStatus situacao={situacao} />);
    expect(container).toHaveTextContent(`${icone}${texto}`);
    expect(screen.getByText(icone)).toHaveAttribute("aria-hidden", "true");
  });

  it("só a ruptura pulsa, e só com motion-safe", () => {
    const { container: ruptura } = render(<SeloStatus situacao="ruptura" />);
    expect(ruptura.innerHTML).toContain("motion-safe:animate-pulso-lento");
    const { container: alerta } = render(<SeloStatus situacao="abaixo_pp" />);
    expect(alerta.innerHTML).not.toContain("animate-pulso-lento");
  });

  it("aceita texto curto (busca)", () => {
    render(<SeloStatus situacao="parado" texto="Parado" />);
    expect(screen.getByText("Parado")).toBeInTheDocument();
  });
});

describe("SeloClasse", () => {
  it("tem nome acessível e NC para sem classe", () => {
    render(
      <>
        <SeloClasse classe="A" />
        <SeloClasse classe="NC" />
      </>,
    );
    expect(screen.getByRole("img", { name: "Classe A" })).toHaveTextContent("A");
    expect(screen.getByRole("img", { name: "Sem classe (NC)" })).toHaveTextContent("NC");
  });
});

describe("SeloEstadoCaso", () => {
  it("tem os 8 estados do Planejamento", () => {
    expect(Object.keys(ESTADOS_CASO)).toEqual([
      "todo",
      "analysis",
      "testing",
      "ready",
      "validated",
      "exported",
      "applied",
      "discarded",
    ]);
  });

  it("mostra o texto do estado e faz pop quando muda", () => {
    const { container } = render(<SeloEstadoCaso estado="applied" mudou />);
    expect(container).toHaveTextContent("Aplicado no ERP");
    expect(container.innerHTML).toContain("motion-safe:animate-pop");
  });
});
