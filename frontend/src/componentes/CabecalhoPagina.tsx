import type { ReactNode } from "react";

type Props = {
  /** Rótulo dourado em caixa alta (ex.: "PAINEL DE CONTROLE"). */
  rotulo: string;
  titulo: string;
  /** Linha de contexto abaixo do título (ex.: "812 posições ... · leitura de 11/11/2026"). */
  contexto?: ReactNode;
  /** Ações da página. Um único botão principal por tela. */
  acoes?: ReactNode;
};

/**
 * Cabeçalho de página (VisaoGeral.dc.html): rótulo ouro-700 em caixa alta, título em
 * Plus Jakarta (text-titulo-m, como pedido no F1; o design usa 36/44px, ver pendências),
 * linha de contexto tinta-500 e área de ações alinhada à base.
 */
export function CabecalhoPagina({ rotulo, titulo, contexto, acoes }: Props) {
  return (
    <header className="flex flex-wrap items-end gap-x-6 gap-y-4">
      <div className="min-w-0 flex-[1_1_420px]">
        <p className="text-rotulo uppercase text-ouro-700">{rotulo}</p>
        <h1 className="mt-2 font-display text-titulo-m text-tinta-900">{titulo}</h1>
        {contexto && <p className="mt-1 text-corpo-m tabular-nums text-tinta-500">{contexto}</p>}
      </div>
      {acoes && <div className="flex flex-wrap gap-3">{acoes}</div>}
    </header>
  );
}
