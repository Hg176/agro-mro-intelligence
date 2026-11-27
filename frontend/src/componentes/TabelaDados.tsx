/**
 * Tabela sobre TanStack Table (F1-5).
 * - Ordenação e paginação são CONTROLADAS: quem ordena e pagina é a API (ordenar número
 *   em Decimal no front seria conta). A tabela só mostra o estado e avisa o clique.
 * - Paginação de 100 por página (a API manda pagina, paginas e total).
 * - Cabeçalho tinta-500 com <th scope="col">; linha com hover verde-50.
 * - Estados embutidos: carregando (skeleton), vazio (EstadoVazio) e erro (com Tentar de novo).
 * - Brilho verde (motion-safe) nas linhas cujo id está em linhasDestacadas.
 */
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, SearchX } from "lucide-react";
import type { ReactNode } from "react";

import { Botao } from "@/componentes/Botao";
import { Esqueleto } from "@/componentes/Esqueleto";
import { EstadoVazio } from "@/componentes/EstadoVazio";
import { inteiro } from "@/lib/formato";
import { cn } from "@/lib/utils";

export type Ordenacao = { coluna: string; direcao: "asc" | "desc" } | null;

export type Paginacao = {
  pagina: number;
  /** Total de páginas (vem da API). */
  paginas: number;
  /** Total de linhas (vem da API). */
  total: number;
  aoMudarPagina: (pagina: number) => void;
};

type Props<T> = {
  /** Nome acessível da tabela (caption visualmente oculto). */
  titulo: string;
  colunas: ColumnDef<T, unknown>[];
  dados: T[];
  idDaLinha: (linha: T) => string;
  estado?: "pronto" | "carregando" | "erro";
  mensagemErro?: string;
  aoTentarDeNovo?: () => void;
  vazio?: { titulo: string; texto?: ReactNode; acao?: ReactNode };
  ordenacao?: Ordenacao;
  /** Colunas ordenáveis (id). Sem aoOrdenar, nenhuma é. */
  ordenaveis?: string[];
  aoOrdenar?: (o: Ordenacao) => void;
  paginacao?: Paginacao;
  linhasDestacadas?: ReadonlySet<string>;
  /** Rótulo das linhas no rodapé (ex.: "posições"). */
  nomeDasLinhas?: string;
};

function proximaOrdem(atual: Ordenacao, coluna: string): Ordenacao {
  if (atual?.coluna !== coluna) return { coluna, direcao: "asc" };
  if (atual.direcao === "asc") return { coluna, direcao: "desc" };
  return null;
}

export function TabelaDados<T>({
  titulo,
  colunas,
  dados,
  idDaLinha,
  estado = "pronto",
  mensagemErro = "Não foi possível carregar a lista.",
  aoTentarDeNovo,
  vazio = { titulo: "Nada para mostrar" },
  ordenacao = null,
  ordenaveis = [],
  aoOrdenar,
  paginacao,
  linhasDestacadas,
  nomeDasLinhas = "linhas",
}: Props<T>) {
  // TanStack Table v8 devolve funções que o React Compiler não memoiza; o projeto não usa o
  // compilador, então o aviso não se aplica.
  // eslint-disable-next-line react-hooks/incompatible-library
  const tabela = useReactTable({
    data: dados,
    columns: colunas,
    getCoreRowModel: getCoreRowModel(),
    getRowId: idDaLinha,
    manualSorting: true,
    manualPagination: true,
  });
  const nColunas = tabela.getVisibleLeafColumns().length;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse tabular-nums">
          <caption className="sr-only">{titulo}</caption>
          <thead>
            {tabela.getHeaderGroups().map((grupo) => (
              <tr key={grupo.id} className="border-b border-borda text-left">
                {grupo.headers.map((h) => {
                  const id = h.column.id;
                  const ordenavel = Boolean(aoOrdenar) && ordenaveis.includes(id);
                  const ativa = ordenacao?.coluna === id ? ordenacao.direcao : null;
                  const conteudo = h.isPlaceholder
                    ? null
                    : flexRender(h.column.columnDef.header, h.getContext());
                  return (
                    <th
                      key={h.id}
                      scope="col"
                      aria-sort={
                        ativa === "asc" ? "ascending" : ativa === "desc" ? "descending" : undefined
                      }
                      className="px-2 py-2.5 text-[10px] leading-[14px] font-semibold tracking-[0.1em] uppercase text-tinta-500 first:pl-0"
                    >
                      {ordenavel ? (
                        <button
                          type="button"
                          onClick={() => aoOrdenar?.(proximaOrdem(ordenacao, id))}
                          className="inline-flex min-h-11 cursor-pointer items-center gap-1 uppercase hover:text-tinta-900"
                        >
                          {conteudo}
                          {ativa === "asc" ? (
                            <ArrowUp aria-hidden="true" className="size-3.5" />
                          ) : ativa === "desc" ? (
                            <ArrowDown aria-hidden="true" className="size-3.5" />
                          ) : (
                            <ArrowUpDown aria-hidden="true" className="size-3.5 opacity-60" />
                          )}
                        </button>
                      ) : (
                        conteudo
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {estado === "carregando" &&
              [0, 1, 2, 3, 4].map((i) => (
                <tr key={`esq-${i}`} className="border-b border-borda">
                  <td colSpan={nColunas} className="py-3">
                    <Esqueleto className="h-6 w-full" />
                  </td>
                </tr>
              ))}

            {estado === "erro" && (
              <tr>
                <td colSpan={nColunas} className="py-esp-24">
                  <div role="alert" className="flex flex-wrap items-center gap-3">
                    <p className="text-corpo-m text-status-ruptura-texto">{mensagemErro}</p>
                    {aoTentarDeNovo && (
                      <Botao variant="secundario" onClick={aoTentarDeNovo}>
                        Tentar de novo
                      </Botao>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {estado === "pronto" && dados.length === 0 && (
              <tr>
                <td colSpan={nColunas} className="py-esp-16">
                  <EstadoVazio
                    icone={SearchX}
                    titulo={vazio.titulo}
                    texto={vazio.texto}
                    acao={vazio.acao}
                  />
                </td>
              </tr>
            )}

            {estado === "pronto" &&
              tabela.getRowModel().rows.map((linha) => (
                <tr
                  key={linha.id}
                  className={cn(
                    "border-b border-borda transition-colors last:border-b-0 hover:bg-verde-50 motion-reduce:transition-none",
                    linhasDestacadas?.has(linha.id) && "motion-safe:animate-brilho-linha",
                  )}
                >
                  {linha.getVisibleCells().map((celula) => (
                    <td key={celula.id} className="px-2 py-3 align-middle first:pl-0">
                      {flexRender(celula.column.columnDef.cell, celula.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {paginacao && estado === "pronto" && paginacao.total > 0 && (
        <nav
          aria-label="Paginação"
          className="flex flex-wrap items-center justify-between gap-3 text-sm text-tinta-600"
        >
          <span>
            Página {inteiro(paginacao.pagina)} de {inteiro(paginacao.paginas)} ·{" "}
            {inteiro(paginacao.total)} {nomeDasLinhas}
          </span>
          <span className="flex gap-2">
            <Botao
              variant="secundario"
              disabled={paginacao.pagina <= 1}
              onClick={() => paginacao.aoMudarPagina(paginacao.pagina - 1)}
            >
              Anterior
            </Botao>
            <Botao
              variant="secundario"
              disabled={paginacao.pagina >= paginacao.paginas}
              onClick={() => paginacao.aoMudarPagina(paginacao.pagina + 1)}
            >
              Próxima
            </Botao>
          </span>
        </nav>
      )}
    </div>
  );
}
