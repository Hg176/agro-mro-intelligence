/**
 * Composição das classes, 4 abas (lei de Hick: uma classificação por vez).
 * Percentuais e largura das barras vêm prontos da API (o front não divide nada).
 */
import type { AbaComposicao, ClasseAbc, ComposicaoAba } from "@/api/tipos";
import { Aba, Abas, ConteudoAba, ListaAbas } from "@/componentes/Abas";
import { SeloClasse } from "@/componentes/Selos";
import { inteiro, larguraDaFracao, percentual } from "@/lib/formato";
import { cn } from "@/lib/utils";

const ABAS: { id: AbaComposicao; nome: string }[] = [
  { id: "abc", nome: "ABC consumo" },
  { id: "pqr", nome: "PQR saídas" },
  { id: "xyz", nome: "XYZ criticidade" },
  { id: "comprabilidade", nome: "Comprabilidade" },
];

const CABECALHO: Record<ComposicaoAba["medida"], string> = {
  valor_consumido: "% do valor consumido",
  posicoes: "% das posições",
};

/** Cor da barra pela ordem da linha (só visual, como no design). */
const COR_BARRA = ["bg-verde-700", "bg-verde-500"];
const LETRAS_ABC = new Set(["A", "B", "C", "D", "N"]);

function Letra({ aba, classe }: { aba: AbaComposicao; classe: string }) {
  if (aba === "abc" && LETRAS_ABC.has(classe)) return <SeloClasse classe={classe as ClasseAbc} />;
  return (
    <span className="inline-grid size-7 place-items-center rounded-[7px] bg-creme-100 text-xs font-semibold text-tinta-600">
      {classe}
    </span>
  );
}

function Painel({ aba, dados }: { aba: AbaComposicao; dados: ComposicaoAba }) {
  if (dados.classes.length === 0) {
    return <p className="text-corpo-m text-tinta-600">Sem dados para esta classificação.</p>;
  }
  return (
    <div className="tabular-nums">
      <div className="grid grid-cols-[28px_minmax(0,1fr)_96px] gap-3 text-[10px] leading-[14px] font-semibold tracking-[0.1em] uppercase text-tinta-500">
        <span />
        <span>{CABECALHO[dados.medida]}</span>
        <span className="text-right">Itens</span>
      </div>
      <ul className="m-0 mt-3 grid list-none grid-cols-[28px_minmax(0,1fr)_96px] items-center gap-x-3 gap-y-3.5 p-0">
        {dados.classes.map((c, i) => {
          const largura = larguraDaFracao(c.fracao_barra);
          return (
            <li key={c.classe} className="contents">
              <Letra aba={aba} classe={c.classe} />
              <span className="flex h-7 items-center gap-2 rounded-[7px] bg-creme-100">
                {largura !== null && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "block h-7 origin-left rounded-[7px] motion-safe:animate-crescer",
                      COR_BARRA[i] ?? "bg-verde-300",
                    )}
                    style={{ width: largura }}
                  />
                )}
                <span className="pl-1 text-xs leading-7 font-semibold text-tinta-900">
                  {percentual(c.percentual)}
                </span>
              </span>
              <span className="text-right text-sm text-tinta-600">
                {inteiro(c.itens)} · {percentual(c.percentual_itens)}
              </span>
            </li>
          );
        })}
      </ul>
      {aba === "abc" && dados.destaque && (
        <p className="mt-5 rounded-lg bg-verde-50 px-4 py-3.5 text-sm leading-5 text-tinta-900">
          <b className="font-semibold">
            {percentual(dados.destaque.percentual_itens)} dos itens (classe {dados.destaque.classe})
          </b>{" "}
          concentram {percentual(dados.destaque.percentual_valor)} do valor consumido. É onde um
          ajuste de parâmetro rende mais.
        </p>
      )}
    </div>
  );
}

export function Composicao({ composicao }: { composicao: Record<AbaComposicao, ComposicaoAba> }) {
  return (
    <section
      id="composicao"
      aria-labelledby="t-comp"
      className="min-w-0 flex-[1.25_1_520px] scroll-mt-6 rounded-xl border border-borda bg-branco p-esp-24"
    >
      <p className="text-rotulo uppercase text-ouro-700">Composição das classes</p>
      <h2 id="t-comp" className="mt-1.5 font-display text-titulo-secao text-tinta-900">
        Poucos itens, muito valor
      </h2>
      <Abas defaultValue="abc" className="mt-4 gap-5">
        <ListaAbas aria-label="Classificação" className="[&>button]:px-3">
          {ABAS.map((a) => (
            <Aba key={a.id} value={a.id}>
              {a.nome}
            </Aba>
          ))}
        </ListaAbas>
        {ABAS.map((a) => (
          <ConteudoAba key={a.id} value={a.id}>
            <Painel aba={a.id} dados={composicao[a.id]} />
          </ConteudoAba>
        ))}
      </Abas>
    </section>
  );
}
