/**
 * Grade de classes (lei de Prägnanz): ABC × PQR (Visão geral) e PQR × ABC × XYZ
 * (Nível de serviço, TMER). A cor sai da FAIXA que a API manda (0 a 4), nunca de conta
 * no front. Célula destacada tem contorno. Cada célula é um botão (clique e teclado).
 */
import type { FaixaCelula } from "@/api/tipos";
import { cn } from "@/lib/utils";

export type TomGrade = "verde" | "ouro";

const FAIXAS: Record<TomGrade, Record<FaixaCelula, string>> = {
  verde: {
    0: "bg-creme-100 text-tinta-500",
    1: "bg-verde-50 text-tinta-900",
    2: "bg-verde-100 text-verde-800",
    3: "bg-verde-700 text-branco",
    4: "bg-verde-900 text-branco",
  },
  ouro: {
    0: "bg-creme-100 text-tinta-500",
    1: "bg-ouro-100 text-tinta-900",
    2: "bg-ouro-300 text-verde-950",
    3: "bg-ouro-500 text-verde-950",
    4: "bg-ouro-700 text-branco",
  },
};

export type CelulaGrade = {
  /** Texto já formatado (ex.: "41", "97,5%", "NC"). */
  texto: string;
  faixa: FaixaCelula;
  destaque: boolean;
  /** Nome acessível completo (ex.: "AP: 41 posições"). */
  rotulo: string;
};

type Props = {
  /** Título da grade (caption). */
  titulo: string;
  linhas: readonly string[];
  colunas: readonly string[];
  celula: (linha: string, coluna: string) => CelulaGrade | null;
  tom?: TomGrade;
  selecionada?: { linha: string; coluna: string } | null;
  aoSelecionar?: (linha: string, coluna: string) => void;
  /** Rótulo dos cabeçalhos (ex.: { linhas: "PQR", colunas: "ABC" }). */
  eixos?: { linhas: string; colunas: string };
};

export function GradeMatriz({
  titulo,
  linhas,
  colunas,
  celula,
  tom = "verde",
  selecionada = null,
  aoSelecionar,
  eixos,
}: Props) {
  return (
    <table className="border-separate border-spacing-1.5 tabular-nums">
      <caption className="sr-only">{titulo}</caption>
      <thead>
        <tr>
          <th scope="col" className="text-rotulo text-tinta-500">
            {eixos && <span className="sr-only">{`${eixos.linhas} × ${eixos.colunas}`}</span>}
          </th>
          {colunas.map((c) => (
            <th key={c} scope="col" className="px-1 pb-1 text-sm font-semibold text-tinta-600">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {linhas.map((l) => (
          <tr key={l}>
            <th scope="row" className="pr-2 text-sm font-semibold text-tinta-600">
              {l}
            </th>
            {colunas.map((c) => {
              const dado = celula(l, c);
              if (!dado) {
                return <td key={c} aria-label={`${l}${c}: sem dado`} />;
              }
              const marcada = selecionada?.linha === l && selecionada.coluna === c;
              const classes = cn(
                "grid h-14 min-w-16 place-items-center rounded-sm px-2 text-base font-semibold",
                FAIXAS[tom][dado.faixa],
                dado.destaque && "outline-2 outline-offset-2 outline-ouro-600 outline-solid",
                marcada && "ring-2 ring-verde-700 ring-offset-2 ring-offset-branco",
              );
              return (
                <td key={c} className="p-0">
                  {aoSelecionar ? (
                    <button
                      type="button"
                      aria-label={dado.rotulo}
                      aria-pressed={marcada}
                      onClick={() => aoSelecionar(l, c)}
                      className={cn(classes, "w-full cursor-pointer")}
                    >
                      {dado.texto}
                    </button>
                  ) : (
                    <span aria-label={dado.rotulo} role="img" className={classes}>
                      {dado.texto}
                    </span>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
