/** Matriz ABC × PQR (lei de Prägnanz). Faixa e destaque vêm da API; a célula abre Materiais. */
import type { ClasseAbc, ClassePqr, MatrizAbcPqr } from "@/api/tipos";
import { GradeMatriz } from "@/componentes/GradeMatriz";
import { SeloClasse } from "@/componentes/Selos";
import { inteiro } from "@/lib/formato";
import { linkMateriais } from "@/rotas/links";

const LINHAS = ["P", "Q", "R", "S"] as const;
const COLUNAS = ["A", "B", "C", "D"] as const;

export function MatrizConsumo({ matriz }: { matriz: MatrizAbcPqr }) {
  const achar = (l: string, c: string) =>
    matriz.celulas.find((x) => x.linha === l && x.coluna === c) ?? null;
  const ap = matriz.celulas.find((x) => x.destaque && x.linha === "P" && x.coluna === "A");

  return (
    <section
      aria-labelledby="t-mat"
      className="min-w-0 flex-[1_1_460px] rounded-xl border border-borda bg-branco p-esp-24"
    >
      <p className="text-rotulo uppercase text-ouro-700">Consumo × frequência</p>
      <h2 id="t-mat" className="mt-1.5 font-display text-titulo-secao text-tinta-900">
        Onde se cruzam valor e uso
      </h2>
      <p className="mt-2 text-corpo-s text-tinta-500">
        Quantidade de posições. A = mais valor consumido; P = sai com mais frequência. Clique numa
        célula para ver os itens.
      </p>
      <div className="mt-5 -mx-1.5">
        <GradeMatriz
          titulo="Posições por classe ABC (colunas) e PQR (linhas)"
          linhas={LINHAS}
          colunas={COLUNAS}
          eixos={{ linhas: "PQR", colunas: "ABC" }}
          larga
          cabecalhoColuna={(c) => <SeloClasse classe={c as ClasseAbc} />}
          cabecalhoLinha={(l) => (
            <span className="inline-grid size-7 place-items-center rounded-[7px] bg-creme-100 text-xs font-semibold text-tinta-600">
              {l}
            </span>
          )}
          celula={(l, c) => {
            const x = achar(l, c);
            return x
              ? {
                  texto: inteiro(x.posicoes),
                  faixa: x.faixa,
                  destaque: x.destaque,
                  rotulo: `${c}${l}: ${inteiro(x.posicoes)} posições`,
                }
              : null;
          }}
          linkDaCelula={(l, c) => linkMateriais({ abc: c as ClasseAbc, pqr: l as ClassePqr })}
        />
      </div>
      {ap && (
        <p className="mt-4 flex items-center gap-2 text-corpo-s text-tinta-600">
          <span aria-hidden="true" className="size-3.5 rounded-[4px] border-2 border-ouro-500" />
          AP: {inteiro(ap.posicoes)} itens mais caros e mais usados. Cuidar primeiro.
        </p>
      )}
      {matriz.fora_da_grade > 0 && (
        <p className="mt-2 text-xs leading-4 text-tinta-500">
          {inteiro(matriz.fora_da_grade)} posições sem classe (N) ficam fora da grade.
        </p>
      )}
    </section>
  );
}
