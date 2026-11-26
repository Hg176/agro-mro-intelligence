import { render, screen } from "@testing-library/react";

import type { ConclusaoPlanejamento } from "@/api/tipos";
import {
  Destaque,
  FaixaConclusao,
  fraseDaConclusao,
  type ModelosDeFrase,
} from "@/componentes/FaixaConclusao";

const modelos: ModelosDeFrase<ConclusaoPlanejamento> = {
  nenhum_caso: (v) => <>Nenhum caso. {v.posicoes_abaixo_pp} abaixo do PP.</>,
  prontos_para_exportar: (v) => (
    <>
      <Destaque>{v.casos_exportaveis} casos</Destaque> prontos.
    </>
  ),
  aguardando_validacao: (v) => <>{v.casos_a_validar} aguardam.</>,
};

describe("FaixaConclusao", () => {
  it("escolhe o modelo pelo código da API e preenche com os valores", () => {
    render(
      <FaixaConclusao
        frase={fraseDaConclusao<ConclusaoPlanejamento>(
          {
            tipo: "prontos_para_exportar",
            valores: { casos_exportaveis: 3, casos_com_dados_novos: 1 },
          },
          modelos,
        )}
      />,
    );
    expect(screen.getByRole("region", { name: "Conclusão" })).toHaveTextContent("3 casos prontos.");
  });

  it("código desconhecido: faixa sem frase, sem quebrar, aviso só no console", () => {
    const aviso = vi.spyOn(console, "warn").mockImplementation(() => {});
    const desconhecido = { tipo: "situacao_nova", valores: {} } as unknown as ConclusaoPlanejamento;
    render(<FaixaConclusao frase={fraseDaConclusao(desconhecido, modelos)} />);
    expect(screen.getByRole("region", { name: "Conclusão" })).toBeInTheDocument();
    expect(aviso).toHaveBeenCalledWith(expect.stringContaining("situacao_nova"));
    aviso.mockRestore();
  });

  it("conclusão nula não mostra frase", () => {
    expect(fraseDaConclusao<ConclusaoPlanejamento>(null, modelos)).toBeNull();
  });
});
