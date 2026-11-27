/** "Cargas anteriores" (ImportarDados.dc.html). Lista pronta da API, em ordem do backend. */
import type { CargaImportacao } from "@/api/tipos";
import { dataComHora, inteiro } from "@/lib/formato";
import { cn } from "@/lib/utils";

import { NOME_DATASET, STATUS_CARGA } from "./textos";

const CLASSE_TH =
  "px-3 py-2.5 text-left text-[10px] leading-[14px] font-semibold tracking-[0.1em] uppercase text-tinta-500";

export function Historico({ cargas }: { cargas: CargaImportacao[] }) {
  return (
    <section aria-labelledby="t-hist" className="rounded-xl border border-borda bg-branco p-6">
      <p className="text-rotulo uppercase text-ouro-700">Histórico</p>
      <h2 id="t-hist" className="mt-1.5 font-display text-titulo-secao">
        Cargas anteriores
      </h2>
      {cargas.length === 0 ? (
        <p className="mt-3 text-corpo-m text-tinta-600">Nenhuma carga ainda.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse tabular-nums">
            <thead>
              <tr className="border-b border-borda">
                <th scope="col" className={cn(CLASSE_TH, "pl-0")}>
                  Data
                </th>
                <th scope="col" className={CLASSE_TH}>
                  Tipo
                </th>
                <th scope="col" className={CLASSE_TH}>
                  Arquivo
                </th>
                <th scope="col" className={cn(CLASSE_TH, "text-right")}>
                  Linhas
                </th>
                <th scope="col" className={CLASSE_TH}>
                  Resultado
                </th>
                <th scope="col" className={cn(CLASSE_TH, "pr-0")}>
                  Por
                </th>
              </tr>
            </thead>
            <tbody>
              {cargas.map((c, i) => {
                const status = STATUS_CARGA[c.status];
                return (
                  <tr key={c.id} className={cn(i < cargas.length - 1 && "border-b border-borda")}>
                    <td className="py-3.5 pr-3">{dataComHora(c.recebida_em)}</td>
                    <td className="px-3 py-3.5">{NOME_DATASET[c.dataset]}</td>
                    <td className="px-3 py-3.5 text-tinta-600">{c.arquivo}</td>
                    <td className="px-3 py-3.5 text-right">{inteiro(c.linhas)}</td>
                    <td className="px-3 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-pill py-[5px] pr-3 pl-2.5 text-xs leading-[14px] font-semibold",
                          status.classe,
                        )}
                      >
                        {status.texto}
                      </span>
                    </td>
                    <td className="py-3.5 pl-3 text-tinta-600">{c.por}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
