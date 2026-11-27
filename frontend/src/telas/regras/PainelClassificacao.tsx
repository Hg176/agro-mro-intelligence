/**
 * Painel de uma classificação (RegrasLetras.dc.html): o que é, regra padrão, barra dos
 * cortes (frações prontas da API), letras, exemplo e o formulário de cortes (ou "Onde você
 * informa"). Salvar pede a confirmação "Isso recalcula o estoque todo".
 */
import { useId, type FormEvent } from "react";
import { Link } from "react-router";

import type { AbaRegras, CortesDoEspaco, PainelRegra } from "@/api/tipos";
import { Botao } from "@/componentes/Botao";
import { inteiro, larguraDaFracao } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { AcaoProtegida } from "@/sessao/AcaoProtegida";

import {
  ABAS,
  COR_LETRA_ABC,
  COR_LETRA_NEUTRA,
  COR_LETRA_NOVO,
  ERRO_FORMATO_DECIMAL,
  ERRO_FORMATO_INTEIRO,
  FORMATO_DECIMAL,
  FORMATO_INTEIRO,
  type Rascunho,
} from "./textos";

type Props = {
  aba: AbaRegras;
  painel: PainelRegra;
  rascunho: Rascunho;
  salvo: Rascunho;
  padrao: CortesDoEspaco;
  aoMudar: (chave: keyof CortesDoEspaco, valor: string) => void;
  aoDesfazer: () => void;
  aoPedirSalvar: () => void;
  salvando: boolean;
  erroSalvar: string | null;
};

/** Texto do valor padrão para "Padrão: 80 %" (só troca o ponto pela vírgula). */
const comoTexto = (v: string | number) => String(v).replace(".", ",");

function corDaLetra(aba: AbaRegras, letra: string): string {
  if (letra === "N" || letra === "n") return COR_LETRA_NOVO;
  return aba === "abc" ? (COR_LETRA_ABC[letra] ?? COR_LETRA_NEUTRA) : COR_LETRA_NEUTRA;
}

export function PainelClassificacao({
  aba,
  painel,
  rascunho,
  salvo,
  padrao,
  aoMudar,
  aoDesfazer,
  aoPedirSalvar,
  salvando,
  erroSalvar,
}: Props) {
  const def = ABAS[aba];
  const base = useId();
  const campos = def.campos ?? [];
  const mudou = campos.some((c) => rascunho[c.chave] !== salvo[c.chave]);
  const errosFormato = Object.fromEntries(
    campos.map((c) => {
      const v = rascunho[c.chave].trim();
      const ok = (c.inteiro ? FORMATO_INTEIRO : FORMATO_DECIMAL).test(v);
      return [c.chave, ok ? null : c.inteiro ? ERRO_FORMATO_INTEIRO : ERRO_FORMATO_DECIMAL];
    }),
  ) as Record<keyof CortesDoEspaco, string | null>;
  const temErroFormato = campos.some((c) => errosFormato[c.chave]);
  const letras = def.letras(rascunho);

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (mudou && !temErroFormato && !salvando) aoPedirSalvar();
  };

  return (
    <div className="flex flex-wrap gap-x-10 gap-y-7 rounded-xl border border-borda bg-branco p-7 motion-safe:animate-entrada">
      <div className="min-w-0 flex-[3_1_460px]">
        <span
          className={cn(
            "inline-flex items-center rounded-pill px-3 py-1 text-xs leading-4 font-semibold",
            def.calculada ? "bg-verde-100 text-verde-700" : "bg-ouro-100 text-ouro-700",
          )}
        >
          {def.calculada ? "Calculada pelo Agro MRO" : "Informada por você"}
        </span>
        <h2 className="mt-3 text-titulo-m">{def.nome}</h2>
        <p className="mt-1.5 text-[17px] leading-[27px]">{def.frase}</p>
        <p className="mt-2 text-corpo-s text-tinta-600">
          <b className="font-semibold">Padrão Agro MRO:</b> {def.regra}
        </p>

        {painel.barra && def.escala && (
          <div className="mt-5">
            <div
              aria-hidden="true"
              className="relative h-9 overflow-hidden rounded-[10px] bg-creme-100"
            >
              {painel.barra.map((g) => {
                const esquerda = larguraDaFracao(g.inicio);
                const fim = larguraDaFracao(g.fim);
                if (!esquerda || !fim) return null;
                return (
                  <div
                    key={g.letra}
                    className={cn(
                      "absolute inset-y-0 grid place-items-center overflow-hidden font-display text-[13px] leading-none font-bold motion-safe:transition-[left,width] motion-safe:duration-500",
                      def.escala?.cores[g.letra],
                    )}
                    style={{ left: esquerda, width: `calc(${fim} - ${esquerda})` }}
                  >
                    {g.letra}
                  </div>
                );
              })}
            </div>
            <div
              aria-hidden="true"
              className="mt-1.5 flex justify-between text-xs leading-4 font-medium tabular-nums text-tinta-600"
            >
              <span>{def.escala.inicio}</span>
              <span>{def.escala.fim}</span>
            </div>
          </div>
        )}

        <dl className="m-0 mt-5 flex flex-col gap-2">
          {letras.map((l, i) => {
            const n = painel.contagens?.[l.letra];
            return (
              <div key={l.letra} className="flex items-center gap-3.5 rounded-[10px] px-2.5 py-2">
                <dt
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-lg text-sm leading-none font-semibold",
                    corDaLetra(aba, l.letra),
                  )}
                >
                  {l.letra}
                </dt>
                <dd className="m-0 flex flex-1 flex-wrap items-center justify-between gap-2 text-corpo-m">
                  <span>{l.texto}</span>
                  {n !== undefined && (
                    <span className="text-sm leading-5 font-semibold whitespace-nowrap tabular-nums text-tinta-600">
                      {i === 0
                        ? `${inteiro(n)} posições${aba === "item_novo" ? " hoje" : ""}`
                        : inteiro(n)}
                    </span>
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
        {def.notaContagem && painel.contagens && (
          <p className="mt-2 ml-2.5 text-xs leading-4 text-tinta-600">
            {mudou
              ? "Contagens atuais. Elas mudam depois de salvar os novos cortes."
              : "Quantas posições estão em cada letra hoje."}
          </p>
        )}
      </div>

      <div className="flex min-w-0 flex-[2_1_340px] flex-col gap-4">
        <div className="rounded-[14px] bg-ouro-100 px-[18px] py-4">
          <p className="text-rotulo uppercase text-ouro-700">Exemplo</p>
          <p className="mt-1.5 text-corpo-m text-tinta-900">{painel.exemplo}</p>
        </div>

        {campos.length > 0 ? (
          <form
            noValidate
            onSubmit={enviar}
            aria-labelledby={`${base}-titulo`}
            className="flex flex-col gap-3.5 rounded-[14px] border border-borda p-[18px]"
          >
            <div>
              <h3 id={`${base}-titulo`} className="text-base leading-6 font-bold">
                {def.cortesTitulo}
              </h3>
              <p className="mt-0.5 text-corpo-s text-tinta-600">{def.cortesNota}</p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3">
              {campos.map((c) => {
                const id = `${base}-${c.chave}`;
                const erro = mudou ? errosFormato[c.chave] : null;
                const alterado = rascunho[c.chave] !== salvo[c.chave];
                return (
                  <div key={c.chave} className="flex flex-col gap-1.5">
                    <label htmlFor={id} className="text-[13px] leading-[18px] font-semibold">
                      {c.rotulo}
                    </label>
                    <div className="relative">
                      <input
                        id={id}
                        type="text"
                        inputMode={c.inteiro ? "numeric" : "decimal"}
                        autoComplete="off"
                        value={rascunho[c.chave]}
                        aria-invalid={erro ? true : undefined}
                        aria-describedby={`${id}-padrao${erro ? ` ${id}-erro` : ""}`}
                        onChange={(e) => aoMudar(c.chave, e.target.value)}
                        className={cn(
                          "h-[52px] w-full rounded-[10px] bg-branco py-3.5 pr-14 pl-4 text-base leading-6 font-semibold tabular-nums text-tinta-900",
                          "focus-visible:shadow-foco focus-visible:outline-none",
                          erro
                            ? "border-2 border-status-ruptura"
                            : alterado
                              ? "border-2 border-ouro-500"
                              : "border border-borda focus-visible:border-verde-700",
                        )}
                      />
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute top-3.5 right-3.5 text-sm leading-5 font-medium text-tinta-600"
                      >
                        {c.sufixo}
                      </span>
                    </div>
                    <span id={`${id}-padrao`} className="text-xs leading-4 text-tinta-600">
                      Padrão: {comoTexto(padrao[c.chave])} {c.sufixo}
                    </span>
                    {erro && (
                      <span
                        id={`${id}-erro`}
                        className="text-xs leading-4 font-medium text-status-ruptura-texto"
                      >
                        {erro}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {erroSalvar && (
              <p role="alert" className="m-0 text-corpo-s text-status-ruptura-texto">
                {erroSalvar}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2.5">
              <AcaoProtegida permissao="editar_regras">
                <Botao
                  type="submit"
                  size="grande"
                  disabled={!mudou || temErroFormato || salvando}
                  aria-busy={salvando || undefined}
                >
                  {salvando ? "Salvando e recalculando…" : def.salvarRotulo}
                </Botao>
              </AcaoProtegida>
              {mudou && !salvando && (
                <button
                  type="button"
                  onClick={aoDesfazer}
                  className="min-h-11 cursor-pointer border-0 bg-transparent px-3 text-sm leading-5 font-semibold text-tinta-600 underline"
                >
                  Desfazer
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="rounded-[14px] border border-borda p-[18px]">
            <h3 className="text-base leading-6 font-bold">Onde você informa</h3>
            <p className="mt-1 text-corpo-s text-tinta-600">{def.ondeInforma}</p>
            <Link
              to="/app/materiais"
              className="mt-2 inline-flex min-h-11 items-center text-sm leading-5 font-semibold text-verde-700 no-underline hover:text-verde-800"
            >
              Abrir Materiais →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
