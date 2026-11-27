/**
 * Um caso da fila (Planejamento.dc.html): código · local, descrição, motivo, aviso de dados
 * novos, rodapé, proposta ES / PP / EM antes → depois (valores da API) e selo do estado.
 * Exportado: referência externa opcional + "Confirmar aplicação no ERP" (com confirmação).
 */
import { useId, useState } from "react";
import { Link } from "react-router";

import type { AntesDepois, CasoPlanejamento } from "@/api/tipos";
import { Botao } from "@/componentes/Botao";
import { SeloEstadoCaso } from "@/componentes/Selos";
import { codigoEmBlocos, decimal } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { linkMateriais } from "@/rotas/links";
import { AcaoProtegida } from "@/sessao/AcaoProtegida";

import { rodapeDoCaso } from "./textos";

type Props = {
  caso: CasoPlanejamento;
  ordem: number;
  /** O estado acabou de mudar: brilho na linha e "pop" no selo. */
  destacado: boolean;
  aoConfirmarAplicacao: (caso: CasoPlanejamento, referencia: string | null) => void;
};

function Parametro({ sigla, valor }: { sigla: string; valor: AntesDepois }) {
  // Comparação de texto (o que a API mandou), não conta: mudou → verde.
  const mudou = valor.antes !== valor.depois;
  return (
    <div className="rounded-[10px] bg-creme-100 px-2.5 py-2">
      <dt className="text-[10px] leading-[14px] font-semibold tracking-[0.1em] text-tinta-600">
        {sigla}
      </dt>
      <dd className="m-0 mt-0.5 text-sm leading-5 font-medium whitespace-nowrap">
        <span className="text-tinta-600">{decimal(valor.antes)}</span>
        <span aria-hidden="true"> → </span>
        <span className="sr-only"> passa a </span>
        <b className={mudou ? "font-semibold text-verde-700" : "font-medium text-tinta-600"}>
          {decimal(valor.depois)}
        </b>
      </dd>
    </div>
  );
}

export function CartaoCaso({ caso: c, ordem, destacado, aoConfirmarAplicacao }: Props) {
  const idRef = useId();
  const [referencia, setReferencia] = useState("");
  const rodape = rodapeDoCaso(c);

  return (
    <li
      className={cn(
        "flex flex-wrap items-start gap-x-6 gap-y-4 rounded-[14px] border bg-branco px-5 py-[18px]",
        c.stale ? "border-status-alerta" : "border-borda",
        destacado ? "motion-safe:animate-brilho-linha" : "motion-safe:animate-entrada",
      )}
      style={{ animationDelay: destacado ? "0ms" : `${Math.min(ordem, 12) * 40}ms` }}
    >
      <div className="min-w-0 flex-[1_1_340px]">
        <p className="text-xs leading-4 font-medium tracking-[0.02em] tabular-nums text-tinta-600">
          {codigoEmBlocos(c.code)} · {c.location_name}
        </p>
        <h3 className="mt-0.5 text-base leading-[22px] font-semibold">{c.short_description}</h3>
        <p className="mt-1 text-corpo-s text-tinta-600">{c.reason}</p>
        {c.stale && c.motivo_desatualizado && (
          <p className="mt-2 flex items-start gap-2 rounded-[10px] bg-status-alerta-bg px-3 py-2 text-corpo-s text-status-alerta-texto">
            <span aria-hidden="true">▲</span>
            {c.motivo_desatualizado}
          </p>
        )}
        {rodape && <p className="mt-2 text-corpo-s text-tinta-600">{rodape}</p>}
      </div>

      {c.proposta && (
        <dl
          aria-label="Proposta: antes e depois de estoque de segurança, ponto de pedido e estoque máximo"
          className="m-0 grid flex-[0_1_300px] grid-cols-3 gap-1.5 tabular-nums"
        >
          <Parametro sigla="ES" valor={c.proposta.safety_stock} />
          <Parametro sigla="PP" valor={c.proposta.reorder_point} />
          <Parametro sigla="EM" valor={c.proposta.maximum_stock} />
        </dl>
      )}

      <div className="flex flex-[0_1_260px] flex-col items-end gap-2.5">
        <SeloEstadoCaso estado={c.status} mudou={destacado} />
        {c.status === "exported" && (
          <div className="flex w-full flex-col gap-2">
            <label htmlFor={idRef} className="sr-only">
              Referência externa de {c.short_description}, {c.location_name}
            </label>
            <input
              id={idRef}
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Referência no seu sistema (opcional)"
              className="h-11 rounded-md border border-borda bg-branco px-3 text-sm text-tinta-900 placeholder:text-tinta-300 focus-visible:border-verde-700 focus-visible:shadow-foco focus-visible:outline-none"
            />
            <AcaoProtegida permissao="validar" className="w-full items-stretch">
              <Botao
                variant="secundario"
                className="border-verde-700 text-verde-700"
                onClick={() => aoConfirmarAplicacao(c, referencia.trim() || null)}
              >
                Confirmar aplicação no ERP
              </Botao>
            </AcaoProtegida>
          </div>
        )}
        <Link
          to={linkMateriais({ q: c.code })}
          className="inline-flex min-h-11 items-center gap-1.5 text-sm leading-5 font-semibold text-verde-700 no-underline hover:text-verde-800"
        >
          Examinar e planejar <span aria-hidden="true">›</span>
        </Link>
      </div>
    </li>
  );
}
