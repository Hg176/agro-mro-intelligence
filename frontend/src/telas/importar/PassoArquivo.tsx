/**
 * Passo 1 · Arquivo (ImportarDados.dc.html): ERP de origem, arrastar ou escolher a planilha
 * e o que ela precisa ter. Formato e tamanho são conferidos aqui só para avisar cedo; quem
 * lê e valida é o backend (POST /api/v1/importacao/arquivos).
 */
import { useMutation } from "@tanstack/react-query";
import { Check, Minus, Sheet, Upload } from "lucide-react";
import { useId, useRef, useState, type DragEvent } from "react";

import { ApiErro } from "@/api/cliente";
import { enviarPlanilha } from "@/api/importacao";
import type { ArquivoRecebido, ErpOrigem } from "@/api/tipos";
import { Botao } from "@/componentes/Botao";
import { inteiro, tamanhoDeArquivo } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { AcaoProtegida } from "@/sessao/AcaoProtegida";

import {
  AVISO_FORMATO,
  AVISO_TAMANHO,
  ERPS,
  EXTENSOES_ACEITAS,
  LIMITE_ARQUIVO_BYTES,
} from "./textos";

type Props = {
  erp: ErpOrigem;
  aoMudarErp: (erp: ErpOrigem) => void;
  arquivo: ArquivoRecebido | null;
  aoReceber: (arquivo: ArquivoRecebido) => void;
  aoTrocar: () => void;
  aoContinuar: () => void;
};

/** Aviso antecipado; null = pode enviar. */
function avisoDoArquivo(arquivo: File): string | null {
  const nome = arquivo.name.toLowerCase();
  if (!EXTENSOES_ACEITAS.some((e) => nome.endsWith(e))) return AVISO_FORMATO;
  if (arquivo.size > LIMITE_ARQUIVO_BYTES) return AVISO_TAMANHO;
  return null;
}

export function PassoArquivo({
  erp,
  aoMudarErp,
  arquivo,
  aoReceber,
  aoTrocar,
  aoContinuar,
}: Props) {
  const entrada = useRef<HTMLInputElement>(null);
  const idAviso = useId();
  const [aviso, setAviso] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);

  const envio = useMutation({
    mutationFn: (f: File) => enviarPlanilha(f, "master_data", erp),
    onSuccess: aoReceber,
  });

  const receber = (f: File | undefined) => {
    if (!f) return;
    const problema = avisoDoArquivo(f);
    setAviso(problema);
    envio.reset();
    if (!problema) envio.mutate(f);
  };

  const soltar = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setArrastando(false);
    receber(e.dataTransfer.files[0]);
  };

  const erro =
    aviso ??
    (envio.error instanceof ApiErro
      ? envio.error.mensagem
      : envio.error
        ? "Não foi possível enviar o arquivo. Tente de novo."
        : null);

  return (
    <div className="mt-8 flex flex-wrap gap-7">
      <div className="flex min-w-0 flex-[2_1_520px] flex-col gap-6">
        <fieldset className="m-0 border-0 p-0">
          <legend className="p-0 text-[13px] leading-[18px] font-semibold text-tinta-900">
            De qual ERP vem a planilha?
          </legend>
          <div className="mt-2.5 grid grid-cols-4 gap-2.5">
            {ERPS.map((e) => {
              const ativo = e.id === erp;
              return (
                <button
                  key={e.id}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => aoMudarErp(e.id)}
                  className={cn(
                    "flex min-h-[72px] cursor-pointer flex-col items-start justify-center gap-0.5 rounded-xl px-4 py-3 text-left text-tinta-900",
                    ativo
                      ? "border-2 border-verde-700 bg-verde-50"
                      : "border border-borda bg-branco",
                  )}
                >
                  <span className="text-[15px] leading-5 font-semibold">{e.nome}</span>
                  <span className="text-xs leading-4 text-tinta-500">{e.sub}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {arquivo ? (
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-verde-700 bg-verde-50 px-6 py-5">
            <span className="grid size-12 place-items-center rounded-xl border border-borda bg-branco">
              <Sheet aria-hidden="true" className="size-6 text-verde-700" strokeWidth={1.8} />
            </span>
            <span className="min-w-[200px] flex-1">
              <span className="block font-semibold">{arquivo.nome}</span>
              <span className="block text-corpo-s tabular-nums text-tinta-600">
                {[
                  tamanhoDeArquivo(arquivo.tamanho_bytes),
                  `${inteiro(arquivo.linhas)} linhas`,
                  arquivo.abas.length > 0
                    ? `${inteiro(arquivo.abas.length)} ${arquivo.abas.length === 1 ? "aba" : "abas"} (${arquivo.abas.join(", ")})`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-verde-100 py-[5px] pr-3 pl-2.5 text-xs leading-[14px] font-semibold text-verde-700">
              ✓ Arquivo lido
            </span>
            <button
              type="button"
              onClick={aoTrocar}
              className="min-h-11 cursor-pointer border-0 bg-transparent px-3.5 text-sm leading-5 font-semibold text-tinta-600 underline"
            >
              Trocar arquivo
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <AcaoProtegida permissao="importar" className="w-full items-stretch">
              <button
                type="button"
                aria-describedby={erro ? idAviso : undefined}
                aria-busy={envio.isPending || undefined}
                onClick={() => entrada.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setArrastando(true);
                }}
                onDragLeave={() => setArrastando(false)}
                onDrop={soltar}
                className={cn(
                  "flex min-h-60 w-full cursor-pointer flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed p-8 text-tinta-900",
                  arrastando ? "border-verde-700 bg-verde-100" : "border-verde-300 bg-verde-50",
                )}
              >
                <span className="grid size-14 place-items-center rounded-[14px] border border-borda bg-branco">
                  <Upload aria-hidden="true" className="size-[26px] text-verde-700" />
                </span>
                <span className="text-titulo-s">
                  {envio.isPending
                    ? "Lendo a planilha…"
                    : "Arraste a planilha de dados mestres aqui"}
                </span>
                <span className="text-corpo-s text-tinta-600">
                  ou{" "}
                  <span className="font-semibold text-verde-700 underline">
                    escolha o arquivo no computador
                  </span>
                </span>
                <span className="mt-1.5 text-xs text-tinta-600">
                  .xlsx, .xls ou .csv · até 15 MB · vírgula ou ponto, tanto faz
                </span>
              </button>
            </AcaoProtegida>
            <input
              ref={entrada}
              type="file"
              accept={EXTENSOES_ACEITAS.join(",")}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                receber(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {erro && (
              <p
                id={idAviso}
                role="alert"
                className="text-corpo-s font-medium text-status-ruptura-texto"
              >
                {erro}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3">
          <Botao size="grande" disabled={!arquivo} onClick={aoContinuar}>
            Continuar para as colunas
          </Botao>
        </div>
      </div>

      <aside
        aria-labelledby="t-colunas-precisa"
        className="min-w-0 flex-[1_1_300px] rounded-xl bg-creme-100 p-6"
      >
        <p className="text-rotulo uppercase text-ouro-700">O que a planilha precisa ter</p>
        <h3 id="t-colunas-precisa" className="mt-2 text-titulo-s">
          Uma linha por material em cada local
        </h3>
        <ul className="m-0 mt-4 flex list-none flex-col gap-2.5 p-0 text-sm leading-5">
          {["Código do material", "Descrição", "Local (centro e depósito)", "Preço unitário"].map(
            (item) => (
              <li key={item} className="flex gap-2.5">
                <Check
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-verde-700"
                  strokeWidth={2.5}
                />
                {item}
              </li>
            ),
          )}
          <li className="flex gap-2.5 text-tinta-600">
            <Minus aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            Opcional: grupo de material e criticidade
          </li>
        </ul>
        <p className="mt-4 text-corpo-s text-tinta-600">
          Não precisa renomear nada. A gente reconhece as colunas do SAP, TOTVS e Senior e você
          confere no próximo passo.
        </p>
      </aside>
    </div>
  );
}
