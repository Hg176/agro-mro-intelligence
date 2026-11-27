/**
 * "Caso selecionado" (NivelServico.dc.html): referência V3, origem, meta efetiva e o impacto
 * no estoque de segurança. O impacto da meta digitada vem de GET …/impacto (o front não
 * calcula a Inversa Normal); o campo só confere o formato.
 */
import { useEffect, useId, useState } from "react";

import { useImpactoMeta } from "@/api/hooks";
import type { CasoNivelServico, Decimal } from "@/api/tipos";
import { Botao } from "@/componentes/Botao";
import { decimal, larguraDaFracao, percentualDeFracao } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { AcaoProtegida } from "@/sessao/AcaoProtegida";

import {
  AJUDA_META,
  ERRO_META,
  FORMATO_META,
  origemDoCaso,
  TEXTO_ABC,
  TEXTO_PQR,
  TEXTO_XYZ,
} from "./textos";

const ESPERA_IMPACTO_MS = 300;
const SEM_META = "Sem meta, a matriz não dá nível de serviço a estes itens (NC).";
const META_ZERO =
  "Com 0%, a Inversa Normal fica indisponível e o estoque de segurança destes itens pode zerar.";

/** "1.96" → "1,96" (o fator z já vem com 2 casas da API). */
const fz = (z: Decimal | null) => (z === null ? "—" : z.replace(".", ","));
/** Meta da API ("0.975") como texto do campo ("97,5"): é só a formatação de %. */
const metaNoCampo = (v: Decimal | null) =>
  v === null ? "" : percentualDeFracao(v).replace("%", "");
const ehZero = (t: string) => /^0(?:[.,]0*)?$/.test(t);

type Props = {
  caso: CasoNivelServico;
  matrizPropria: boolean;
  salvando: boolean;
  removendo: boolean;
  erro: string | null;
  aoSalvar: (meta: Decimal) => void;
  aoRemover: () => void;
};

export function EditorCaso({
  caso,
  matrizPropria,
  salvando,
  removendo,
  erro,
  aoSalvar,
  aoRemover,
}: Props) {
  const id = useId();
  const inicial = metaNoCampo(caso.service_level);
  const [rascunho, setRascunho] = useState(inicial);
  const texto = rascunho.trim();
  const mudou = texto !== inicial;
  const formatoOk = texto !== "" && FORMATO_META.test(texto);
  const erroFormato = mudou && texto !== "" && !formatoOk;
  const meta = mudou && formatoOk ? (texto.replace(",", ".") as Decimal) : null;

  // Pede o impacto só depois de uma pausa na digitação.
  const [metaPedida, setMetaPedida] = useState<Decimal | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setMetaPedida(meta), ESPERA_IMPACTO_MS);
    return () => clearTimeout(t);
  }, [meta]);
  const impacto = useImpactoMeta(caso.case, meta !== null && metaPedida === meta ? meta : null);

  const atual = caso.service_level;
  let frase: string;
  let barraNova: string | null = null;
  let novaMenor = false;
  if (meta === null) {
    frase =
      atual === null
        ? SEM_META
        : atual === "0"
          ? META_ZERO
          : `Meta atual de ${percentualDeFracao(atual)} corresponde a um fator z de ${fz(caso.fator_z)}. Digite outra meta para comparar.`;
  } else if (ehZero(texto)) {
    frase = META_ZERO;
  } else if (!impacto.data) {
    frase = impacto.isError
      ? "Não foi possível calcular o impacto agora."
      : "Calculando o impacto…";
  } else {
    const i = impacto.data;
    barraNova = larguraDaFracao(i.fracao_barra_nova);
    const zAtualSemProtecao =
      i.fator_z_atual === null || i.fator_z_atual === "0" || i.fator_z_atual.startsWith("-");
    if (zAtualSemProtecao || i.variacao_percentual === null) {
      frase = `Fator z passa a ser ${fz(i.fator_z_novo)}. Hoje não há proteção calculada para comparar.`;
    } else {
      novaMenor = i.variacao_percentual.startsWith("-");
      const tamanho = i.variacao_percentual.replace(/^-/, "");
      frase = `De ${percentualDeFracao(atual)} para ${decimal(meta)}%: o estoque de segurança destes itens fica cerca de ${tamanho}% ${novaMenor ? "menor" : "maior"} (fator z ${fz(i.fator_z_atual)} → ${fz(i.fator_z_novo)}).`;
    }
  }
  const barraAtual = larguraDaFracao(caso.fracao_barra_z);
  const podeRemover = caso.origem === "cliente" || caso.origem === "v3_adotada";

  return (
    <aside
      aria-labelledby={`${id}-caso`}
      className="flex min-w-0 flex-[2_1_340px] flex-col gap-4 rounded-xl border border-borda bg-branco p-6 motion-safe:animate-entrada"
    >
      <div>
        <p className="text-rotulo uppercase text-ouro-700">Caso selecionado</p>
        <h2
          id={`${id}-caso`}
          className="mt-1.5 font-display text-[32px] leading-[38px] font-extrabold tracking-[0.04em]"
        >
          {caso.case}
        </h2>
        <p className="mt-0.5 text-corpo-s text-tinta-600">
          {TEXTO_PQR[caso.pqr]} · {TEXTO_ABC[caso.abc]} · criticidade {caso.xyz} (
          {TEXTO_XYZ[caso.xyz]})
        </p>
        <p className="mt-2 text-corpo-m">
          {caso.xyz === "Z"
            ? "Objetivo: priorizar a continuidade do item vital."
            : "Objetivo: equilibrar disponibilidade e capital."}
        </p>
      </div>

      <dl className="m-0 grid grid-cols-2 gap-3 tabular-nums">
        <div className="rounded-xl bg-creme-100 px-3.5 py-3">
          <dt className="text-rotulo uppercase text-tinta-600">Referência V3</dt>
          <dd className="m-0 mt-1 font-display text-2xl leading-[30px] font-bold">
            {percentualDeFracao(caso.referencia_v3)}
          </dd>
        </div>
        <div className="rounded-xl bg-creme-100 px-3.5 py-3">
          <dt className="text-rotulo uppercase text-tinta-600">Origem</dt>
          <dd className="m-0 mt-1.5 text-sm leading-5 font-semibold">
            {origemDoCaso(caso, matrizPropria)}
          </dd>
        </div>
      </dl>

      <div className="flex flex-col gap-2">
        <label htmlFor={`${id}-meta`} className="text-[13px] leading-[18px] font-semibold">
          Meta efetiva
        </label>
        <div className="relative">
          <input
            id={`${id}-meta`}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={rascunho}
            placeholder="NC"
            aria-invalid={erroFormato ? true : undefined}
            aria-describedby={`${id}-ajuda${erroFormato ? ` ${id}-erro` : ""}`}
            onChange={(e) => setRascunho(e.target.value)}
            className={cn(
              "h-14 w-full rounded-[10px] bg-branco py-3.5 pr-11 pl-4 font-display text-[22px] leading-7 font-bold tabular-nums text-tinta-900 placeholder:text-tinta-300",
              "focus-visible:shadow-foco focus-visible:outline-none",
              erroFormato
                ? "border-2 border-status-ruptura"
                : mudou
                  ? "border-2 border-ouro-500"
                  : "border border-borda focus-visible:border-verde-700",
            )}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-3.5 right-4 text-base leading-6 font-semibold text-tinta-600"
          >
            %
          </span>
        </div>
        <span id={`${id}-ajuda`} className="text-xs leading-4 text-tinta-600">
          {AJUDA_META}
        </span>
        {erroFormato && (
          <span id={`${id}-erro`} role="alert" className="text-corpo-s text-status-ruptura-texto">
            {ERRO_META}
          </span>
        )}
      </div>

      <div className="rounded-xl border border-borda px-4 py-3.5">
        <p className="text-rotulo uppercase text-tinta-600">O que muda no estoque de segurança</p>
        <div aria-hidden="true" className="relative mt-2.5 h-2.5 rounded-[5px] bg-creme-100">
          {barraAtual && (
            <div
              className="absolute top-0 left-0 h-2.5 rounded-[5px] bg-verde-300 motion-safe:transition-[width] motion-safe:duration-500"
              style={{ width: barraAtual }}
            />
          )}
          {barraNova && (
            <div
              className={cn(
                "absolute top-[3px] left-0 h-1 rounded-[2px] motion-safe:transition-[width] motion-safe:duration-500",
                novaMenor ? "bg-status-alerta" : "bg-verde-700",
              )}
              style={{ width: barraNova }}
            />
          )}
        </div>
        <p aria-live="polite" className="mt-2.5 text-sm leading-5 text-tinta-900">
          {frase}
        </p>
        <p className="mt-1 text-xs leading-4 text-tinta-600">
          Pelo método Inversa Normal. O valor em unidades depende do histórico de cada item.
        </p>
      </div>

      {erro && (
        <p role="alert" className="m-0 text-corpo-s text-status-ruptura-texto">
          {erro}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <AcaoProtegida permissao="editar_regras">
          <Botao
            size="grande"
            disabled={!mudou || !formatoOk || salvando}
            aria-busy={salvando || undefined}
            onClick={() => {
              if (meta !== null && !salvando) aoSalvar(meta);
            }}
          >
            {salvando ? "Salvando…" : `Salvar meta de ${caso.case}`}
          </Botao>
        </AcaoProtegida>
        {podeRemover && (
          <AcaoProtegida permissao="editar_regras">
            <button
              type="button"
              aria-busy={removendo || undefined}
              onClick={() => {
                if (!removendo) aoRemover();
              }}
              className="min-h-11 cursor-pointer border-0 bg-transparent px-2 text-sm leading-5 font-semibold text-status-ruptura-texto"
            >
              Remover configuração
            </button>
          </AcaoProtegida>
        )}
      </div>
    </aside>
  );
}
