/**
 * Passo 2 · Colunas (ImportarDados.dc.html): cada campo do sistema ligado a uma coluna do
 * arquivo. O reconhecimento, a confiança, o exemplo e o mapeamento lembrado vêm da API
 * (GET …/colunas); a tela só deixa trocar a coluna e manda o mapeamento na prévia.
 */
import { RotateCcw } from "lucide-react";

import type { ColunasDoArquivo } from "@/api/tipos";
import type { Mapeamento } from "@/api/importacao";
import { Botao } from "@/componentes/Botao";
import { Esqueleto } from "@/componentes/Esqueleto";
import { dataDoInstante, inteiro, TRACO } from "@/lib/formato";
import { cn } from "@/lib/utils";

import { CONFIANCA, ESCOLHA_MANUAL, NOME_ERP } from "./textos";

type Props = {
  colunas: ColunasDoArquivo | undefined;
  carregando: boolean;
  erro: string | null;
  mapeamento: Mapeamento;
  aoMudar: (campo: string, coluna: string | null) => void;
  lembrar: boolean;
  aoMudarLembrar: (lembrar: boolean) => void;
  aoVoltar: () => void;
  aoVerPrevia: () => void;
  gerandoPrevia: boolean;
  erroPrevia: string | null;
};

const CLASSE_TH =
  "px-3 py-2.5 text-left text-[10px] leading-[14px] font-semibold tracking-[0.1em] uppercase text-tinta-500";

export function PassoColunas({
  colunas,
  carregando,
  erro,
  mapeamento,
  aoMudar,
  lembrar,
  aoMudarLembrar,
  aoVoltar,
  aoVerPrevia,
  gerandoPrevia,
  erroPrevia,
}: Props) {
  if (carregando) {
    return (
      <div role="status" aria-label="Reconhecendo as colunas" className="mt-8 flex flex-col gap-3">
        <Esqueleto className="h-12 w-full rounded-xl" />
        <Esqueleto className="h-72 w-full rounded-xl" />
      </div>
    );
  }
  if (erro || !colunas) {
    return (
      <div className="mt-8 flex flex-col items-start gap-4">
        <p role="alert" className="text-corpo-m font-medium text-status-ruptura-texto">
          {erro ?? "Não foi possível ler as colunas do arquivo."}
        </p>
        <Botao variant="secundario" size="grande" onClick={aoVoltar}>
          Voltar
        </Botao>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-5">
      {colunas.lembrado && (
        <div className="flex items-center gap-3 rounded-xl bg-verde-50 px-[18px] py-3.5 text-sm leading-5">
          <RotateCcw aria-hidden="true" className="size-[18px] shrink-0 text-verde-700" />
          <span>
            <b className="font-semibold">Lembramos do seu último mapeamento</b> (
            {NOME_ERP[colunas.lembrado.erp]}, carga de {dataDoInstante(colunas.lembrado.carga_em)}).{" "}
            {inteiro(colunas.campos_ligados)} de {inteiro(colunas.total_campos)} campos já estão
            ligados; confira os que pedem atenção.
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse">
          <caption className="sr-only">Campos do sistema e colunas do seu arquivo</caption>
          <thead>
            <tr className="border-b border-borda">
              <th scope="col" className={cn(CLASSE_TH, "pl-0")}>
                Campo do sistema
              </th>
              <th scope="col" className={CLASSE_TH}>
                Coluna no seu arquivo
              </th>
              <th scope="col" className={CLASSE_TH}>
                Exemplo da 1ª linha
              </th>
              <th scope="col" className={cn(CLASSE_TH, "pr-0")}>
                Confiança
              </th>
            </tr>
          </thead>
          <tbody>
            {colunas.campos.map((c) => {
              const escolhida = mapeamento[c.campo] ?? null;
              const original = escolhida === c.coluna;
              const confianca = original
                ? CONFIANCA[c.confianca]
                : escolhida
                  ? ESCOLHA_MANUAL
                  : CONFIANCA.nenhuma;
              return (
                <tr key={c.campo} className="border-b border-borda">
                  <th scope="row" className="py-3.5 pr-3 text-left font-normal">
                    <div className="font-semibold">{c.nome}</div>
                    <div className="text-xs leading-4 text-tinta-600">
                      {c.obrigatorio ? "Obrigatório" : "Opcional"}
                      {c.detalhe ? ` · ${c.detalhe}` : ""}
                    </div>
                  </th>
                  <td className="px-3 py-3.5">
                    <select
                      aria-label={`Coluna para ${c.nome}`}
                      value={escolhida ?? ""}
                      onChange={(e) => aoMudar(c.campo, e.target.value || null)}
                      className={cn(
                        "h-11 w-full max-w-[260px] rounded-[10px] bg-branco px-3 text-[15px] leading-5 text-tinta-900",
                        "focus-visible:border-verde-700 focus-visible:shadow-foco focus-visible:outline-none",
                        original && c.confianca === "media"
                          ? "border-2 border-status-alerta"
                          : "border border-borda",
                      )}
                    >
                      <option value="">
                        {c.coluna === null && escolhida === null
                          ? "Nenhuma coluna encontrada"
                          : "Não usar"}
                      </option>
                      {colunas.colunas_do_arquivo.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3.5 tabular-nums text-tinta-600">
                    {original ? (c.exemplo ?? TRACO) : TRACO}
                  </td>
                  <td className="py-3.5 pl-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-pill px-3 py-[5px] text-xs leading-[14px] font-semibold whitespace-nowrap",
                        confianca.classe,
                      )}
                    >
                      {confianca.texto}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {erroPrevia && (
        <p role="alert" className="text-corpo-m font-medium text-status-ruptura-texto">
          {erroPrevia}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Botao variant="secundario" size="grande" onClick={aoVoltar}>
          Voltar
        </Botao>
        <span className="flex-1" />
        <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-tinta-600">
          <input
            type="checkbox"
            checked={lembrar}
            onChange={(e) => aoMudarLembrar(e.target.checked)}
            className="m-0 size-5 accent-verde-700"
          />
          Lembrar este mapeamento
        </label>
        <Botao size="grande" aria-busy={gerandoPrevia || undefined} onClick={aoVerPrevia}>
          {gerandoPrevia ? "Gerando a prévia…" : "Ver prévia"}
        </Botao>
      </div>
    </div>
  );
}
