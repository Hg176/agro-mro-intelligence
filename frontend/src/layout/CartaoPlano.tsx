import { Link } from "react-router";

import { dataDoInstante, inteiro, larguraDaFracao } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { useSessao } from "@/sessao/contexto";

/**
 * Cartão do plano no rodapé do menu (VisaoGeral.dc.html, Planos*.dc.html).
 * Textos de useSessao(); a largura da barra é a fração que a API manda (fracao_uso).
 */
export function CartaoPlano() {
  const { plano } = useSessao();
  const demonstracao = plano.estado === "demonstracao";
  const leitura = plano.estado === "somente_leitura";

  const uso =
    plano.itens_limite === null
      ? `${inteiro(plano.itens_usados)} itens`
      : `${inteiro(plano.itens_usados)} de ${inteiro(plano.itens_limite)} itens`;

  const largura = larguraDaFracao(plano.fracao_uso);
  const nota = demonstracao
    ? "Assine para liberar tudo"
    : leitura
      ? "● Somente leitura"
      : plano.renova_em
        ? `Renova em ${dataDoInstante(plano.renova_em)}`
        : null;

  return (
    <Link
      to="/app/plano"
      className="block rounded-[14px] border border-verde-300/30 bg-verde-800 p-esp-16 text-verde-100 no-underline hover:border-verde-300/60"
    >
      <span className="block text-rotulo uppercase text-ouro-300">
        {demonstracao ? "Demonstração" : "Plano Intelligence"}
      </span>
      <span className="mt-esp-8 block font-semibold tabular-nums text-branco">{uso}</span>
      {largura !== null && (
        <span
          role="progressbar"
          aria-label="Itens usados do plano"
          aria-valuenow={plano.itens_usados}
          aria-valuemin={0}
          aria-valuemax={plano.itens_limite ?? undefined}
          className="mt-2.5 block h-1.5 rounded-[3px] bg-verde-100/20"
        >
          <span
            className={cn(
              "block h-1.5 rounded-[3px]",
              leitura ? "bg-status-ruptura" : "bg-ouro-500",
            )}
            // Largura vem pronta da API (fracao_uso); o front não divide usado por limite.
            style={{ width: largura }}
          />
        </span>
      )}
      {nota && <span className="mt-2.5 block text-xs leading-4 text-verde-100">{nota}</span>}
    </Link>
  );
}
