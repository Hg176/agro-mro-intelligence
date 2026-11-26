/**
 * Saldo × ponto de pedido (Materiais.dc.html, VisaoGeral.dc.html).
 * Não calcula nada: a largura é a fração que a API manda (fracao_barra_saldo_pp) e o
 * modelo do texto sai da situação que a API decidiu (não comparamos saldo com PP).
 */
import type { Decimal, Situacao } from "@/api/tipos";
import { decimal, larguraDaFracao } from "@/lib/formato";
import { cn } from "@/lib/utils";

const COR_BARRA: Record<Situacao, string> = {
  ruptura: "bg-status-ruptura",
  abaixo_pp: "bg-status-alerta",
  parado: "bg-status-parado",
  saudavel: "bg-verde-700",
  sem_calculo: "bg-tinta-300",
};

type Props = {
  saldo: Decimal | null;
  pontoPedido: Decimal | null;
  unidade: string;
  fracao: Decimal | null;
  situacao: Situacao;
  /** Esconde a barra e mostra só o texto (tabela da Visão geral). */
  semBarra?: boolean;
  className?: string;
};

/** Texto do saldo × PP pelo modelo da situação. Sinal negativo é lido do texto, sem conta. */
export function textoSaldoPp({
  saldo,
  pontoPedido,
  unidade,
  situacao,
}: Pick<Props, "saldo" | "pontoPedido" | "unidade" | "situacao">): string {
  const s = decimal(saldo);
  const pp = decimal(pontoPedido);
  if (saldo !== null && saldo.startsWith("-")) {
    return `${s.replace("-", "−")} ${unidade} (negativo) · PP ${pp}`;
  }
  if (pontoPedido === null) return `${s} ${unidade} · sem PP`;
  if (situacao === "ruptura" || situacao === "abaixo_pp") return `${s} de ${pp} ${unidade}`;
  return `${s} ${unidade} · PP ${pp}`;
}

export function BarraSaldoPp(props: Props) {
  const largura = larguraDaFracao(props.fracao);
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", props.className)}>
      <span className="text-sm leading-5 tabular-nums text-tinta-900">{textoSaldoPp(props)}</span>
      {!props.semBarra && largura !== null && (
        <span aria-hidden="true" className="block h-1.5 w-full rounded-[3px] bg-borda">
          <span
            className={cn("block h-1.5 rounded-[3px]", COR_BARRA[props.situacao])}
            style={{ width: largura }}
          />
        </span>
      )}
    </div>
  );
}
