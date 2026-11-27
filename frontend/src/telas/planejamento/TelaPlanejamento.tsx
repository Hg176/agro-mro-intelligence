/**
 * Planejamento, "Meu plano de estoque" (Planejamento.dc.html e PlanejamentoVazio.dc.html),
 * F1-10. Tudo vem de GET /api/v1/planejamento?filtro=: resumo, fila já filtrada, contagens,
 * frase (conclusao.tipo) e sugestões. O front não conta nem decide quem é exportável.
 * Um botão principal: "Baixar Excel de mudanças (N)". Exportar não confirma aplicação.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useState, type ReactNode } from "react";

import { chaves } from "@/api/chaves";
import { ApiErro } from "@/api/cliente";
import { usePlanejamento } from "@/api/hooks";
import { baixarExcelDeMudancas, confirmarAplicacao, iniciarAnalise } from "@/api/planejamento";
import type {
  CasoPlanejamento,
  FiltroPlanejamento,
  ItemParaIniciar,
  Planejamento,
} from "@/api/tipos";
import { Botao } from "@/componentes/Botao";
import { CabecalhoPagina } from "@/componentes/CabecalhoPagina";
import { Confirmacao } from "@/componentes/Confirmacao";
import { ErroDaTela } from "@/componentes/ErroDaTela";
import { Esqueleto } from "@/componentes/Esqueleto";
import { FaixaConclusao, fraseDaConclusao } from "@/componentes/FaixaConclusao";
import { codigoEmBlocos, decimal, inteiro, larguraDoPercentual, percentual } from "@/lib/formato";
import { salvarArquivo } from "@/lib/salvarArquivo";
import { cn } from "@/lib/utils";
import { AcaoProtegida } from "@/sessao/AcaoProtegida";

import { CartaoCaso } from "./CartaoCaso";
import {
  APLICACAO_INCERTA,
  AVISO_EXPORTADO,
  avisoAplicado,
  avisoIniciado,
  EXPORTACAO_INCERTA,
  FRASES_PLANEJAMENTO,
  ORDEM_FILTROS,
  ROTULO_FILTRO,
} from "./textos";

const ROTULO = "Gestão do trabalho";
const TITULO = "Meu plano de estoque";
const CONTEXTO = "Saiba o que analisar, o que já foi validado e o que ainda precisa ser aplicado.";

/** Escrita que falha por rede/5xx é incerta (D12): mensagem própria, sem repetir sozinha. */
function mensagemDeEscrita(erro: unknown, incerta: string): string | null {
  if (!erro) return null;
  if (erro instanceof ApiErro && erro.status >= 400 && erro.status < 500) return erro.mensagem;
  return incerta;
}

function Indicador({
  rotulo,
  children,
  apoio,
  barra,
}: {
  rotulo: string;
  children: ReactNode;
  apoio: ReactNode;
  barra?: { largura: string | null; cor: string };
}) {
  return (
    <article className="rounded-xl border border-borda bg-branco px-[22px] py-5">
      <p className="text-rotulo uppercase text-tinta-500">{rotulo}</p>
      <p className="mt-1.5 font-display text-numero-kpi motion-safe:animate-aparecer">{children}</p>
      {barra && (
        <div aria-hidden="true" className="mt-2.5 h-1.5 overflow-hidden rounded-[3px] bg-creme-100">
          {barra.largura && (
            <div
              className={cn(
                "h-1.5 origin-left rounded-[3px] motion-safe:animate-crescer",
                barra.cor,
              )}
              style={{ width: barra.largura }}
            />
          )}
        </div>
      )}
      <p className={cn("text-corpo-s text-tinta-500", barra ? "mt-1.5" : "mt-1")}>{apoio}</p>
    </article>
  );
}

function Resumo({ resumo }: { resumo: Planejamento["resumo"] }) {
  const de = (n: number) => (
    <span className="font-sans text-[15px] leading-5 font-medium text-tinta-500">
      {" "}
      de {inteiro(n)}
    </span>
  );
  return (
    <section
      aria-label="Progresso do trabalho"
      className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 tabular-nums"
    >
      <Indicador rotulo="Casos iniciados" apoio="Um caso por material + local">
        {inteiro(resumo.iniciados)}
      </Indicador>
      <Indicador
        rotulo="Validados"
        apoio={`${percentual(resumo.percentual_analise)} da análise`}
        barra={{ largura: larguraDoPercentual(resumo.percentual_analise), cor: "bg-verde-700" }}
      >
        {inteiro(resumo.validados)}
        {de(resumo.iniciados)}
      </Indicador>
      <Indicador
        rotulo="Aplicados no ERP"
        apoio={`${percentual(resumo.percentual_aplicacao)} dos validados`}
        barra={{ largura: larguraDoPercentual(resumo.percentual_aplicacao), cor: "bg-ouro-500" }}
      >
        {inteiro(resumo.aplicados)}
        {de(resumo.validados)}
      </Indicador>
      <Indicador rotulo="Dados para rever" apoio="Mudaram depois do teste">
        <span className="text-status-alerta">{inteiro(resumo.dados_para_rever)}</span>
      </Indicador>
    </section>
  );
}

function PassosDoVazio() {
  const passos = [
    {
      titulo: "Escolha uma posição",
      texto:
        "Comece por um item abaixo do ponto de pedido, aqui embaixo, ou pela ficha de qualquer material.",
    },
    {
      titulo: "Teste e valide",
      texto:
        "Simule alternativas sem mexer no parâmetro ativo. Escolha uma e valide com uma justificativa.",
    },
    {
      titulo: "Exporte e confirme",
      texto: "Baixe o Excel de mudanças, aplique no ERP e volte aqui para declarar a aplicação.",
    },
  ];
  return (
    <ol className="m-0 mt-6 grid list-none grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4 p-0">
      {passos.map((p, i) => (
        <li
          key={p.titulo}
          className="rounded-[14px] bg-creme-100 p-5 motion-safe:animate-entrada"
          style={{ animationDelay: `${i * 90}ms` }}
        >
          <span
            aria-hidden="true"
            className={cn(
              "grid size-9 place-items-center rounded-full font-display text-base leading-none font-bold",
              i === 2 ? "bg-ouro-500 text-verde-950" : "bg-verde-900 text-branco",
            )}
          >
            {i + 1}
          </span>
          <h3 className="mt-3.5 text-base leading-6 font-bold">
            <span className="sr-only">Passo {i + 1}: </span>
            {p.titulo}
          </h3>
          <p className="mt-1 text-corpo-s text-tinta-600">{p.texto}</p>
        </li>
      ))}
    </ol>
  );
}

function Sugestoes({
  sugestoes,
  aoIniciar,
  iniciando,
}: {
  sugestoes: ItemParaIniciar[];
  aoIniciar: (s: ItemParaIniciar) => void;
  iniciando: number | null;
}) {
  return (
    <section aria-labelledby="t-prox" className="rounded-xl border border-borda bg-branco p-6">
      <p className="text-rotulo uppercase text-ouro-700">Próximos passos</p>
      <h2 id="t-prox" className="mt-1.5 font-display text-titulo-secao">
        Itens para iniciar análise
      </h2>
      <p className="mt-1 text-corpo-s text-tinta-600">
        Posições abaixo do ponto de pedido ainda sem caso registrado.
      </p>
      <ul className="m-0 mt-4 grid list-none grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3 p-0">
        {sugestoes.map((s, i) => (
          <li
            key={s.material_id}
            className="flex items-center gap-4 rounded-[14px] border border-borda px-4 py-3.5 motion-safe:animate-entrada"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs leading-4 font-medium tabular-nums text-tinta-600">
                {codigoEmBlocos(s.code)} · {s.location_name}
              </p>
              <h3 className="mt-0.5 text-[15px] leading-5 font-semibold">{s.short_description}</h3>
              <p className="mt-0.5 text-corpo-s tabular-nums text-tinta-600">
                <span aria-hidden="true" className="text-status-alerta">
                  ▲{" "}
                </span>
                Saldo {decimal(s.stock_quantity)} · ponto de pedido {decimal(s.reorder_point)}
              </p>
            </div>
            <AcaoProtegida permissao="simular">
              <Botao
                variant="secundario"
                className="shrink-0"
                aria-busy={iniciando === s.material_id || undefined}
                onClick={() => aoIniciar(s)}
              >
                {iniciando === s.material_id ? "Iniciando…" : "Iniciar análise"}
              </Botao>
            </AcaoProtegida>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Conteudo({
  dados,
  filtro,
  aoMudarFiltro,
  trocando,
}: {
  dados: Planejamento;
  filtro: FiltroPlanejamento;
  aoMudarFiltro: (f: FiltroPlanejamento) => void;
  trocando: boolean;
}) {
  const cliente = useQueryClient();
  const [aviso, setAviso] = useState<string | null>(null);
  const [destaque, setDestaque] = useState<number[]>([]);
  const [aConfirmar, setAConfirmar] = useState<{
    caso: CasoPlanejamento;
    ref: string | null;
  } | null>(null);
  const atualizar = () => cliente.invalidateQueries({ queryKey: chaves.todoPlanejamento });

  const exportar = useMutation({
    mutationFn: baixarExcelDeMudancas,
    onSuccess: (arquivo) => {
      salvarArquivo(arquivo);
      setDestaque(dados.casos.filter((c) => c.entra_no_proximo_excel).map((c) => c.id));
      setAviso(AVISO_EXPORTADO);
      void atualizar();
    },
  });
  const aplicar = useMutation({
    mutationFn: (p: { caso: CasoPlanejamento; ref: string | null }) =>
      confirmarAplicacao(p.caso.id, p.ref),
    onSuccess: (caso) => {
      setDestaque([caso.id]);
      setAviso(avisoAplicado(caso));
      void atualizar();
    },
  });
  const iniciar = useMutation({
    mutationFn: (s: ItemParaIniciar) => iniciarAnalise(s.material_id),
    onSuccess: (caso) => {
      setDestaque([caso.id]);
      setAviso(avisoIniciado(caso));
      if (filtro !== "active" && filtro !== "todo" && filtro !== "all") aoMudarFiltro("todo");
      void atualizar();
    },
  });

  const temCasos = dados.resumo.iniciados > 0;
  const erroExportar = mensagemDeEscrita(exportar.error, EXPORTACAO_INCERTA);
  const erroAplicar = mensagemDeEscrita(aplicar.error, APLICACAO_INCERTA);
  const erroIniciar =
    iniciar.error instanceof ApiErro
      ? iniciar.error.mensagem
      : iniciar.error
        ? "Não foi possível iniciar a análise. Atualize a página e confira a fila."
        : null;
  const contagem = (f: FiltroPlanejamento) =>
    dados.filtros.find((x) => x.id === f)?.contagem ?? null;

  return (
    <>
      <CabecalhoPagina rotulo={ROTULO} titulo={TITULO} contexto={CONTEXTO} />
      <FaixaConclusao frase={fraseDaConclusao(dados.conclusao, FRASES_PLANEJAMENTO)} />
      {temCasos && <Resumo resumo={dados.resumo} />}

      <section aria-labelledby="t-fila" className="rounded-xl border border-borda bg-branco p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex-[1_1_420px]">
            <p className="text-rotulo uppercase text-ouro-700">Fila de trabalho</p>
            <h2 id="t-fila" className="mt-1.5 font-display text-titulo-secao">
              Casos por material + local
            </h2>
            <p className="mt-1 text-corpo-s text-tinta-600">
              Um alerta pode iniciar a análise, mas só você valida e confirma a aplicação.
            </p>
          </div>
          {temCasos && (
            <div className="flex flex-col items-end gap-1">
              <AcaoProtegida permissao="exportar_excel" className="items-end">
                <Botao
                  size="grande"
                  disabled={dados.exportaveis === 0 || exportar.isPending}
                  aria-busy={exportar.isPending || undefined}
                  onClick={() => {
                    if (!exportar.isPending) {
                      setAviso(null);
                      exportar.mutate();
                    }
                  }}
                >
                  <Download aria-hidden="true" />
                  {exportar.isPending
                    ? "Preparando arquivo…"
                    : `Baixar Excel de mudanças (${inteiro(dados.exportaveis)})`}
                </Botao>
              </AcaoProtegida>
              <span className="text-xs leading-4 text-tinta-600">
                Todos os casos validados e atuais do seu espaço
              </span>
            </div>
          )}
        </div>

        {(aviso || erroExportar || erroAplicar || erroIniciar) && (
          <p
            role={aviso ? "status" : "alert"}
            className={cn(
              "mt-4 flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm leading-5 motion-safe:animate-aparecer",
              aviso
                ? "bg-verde-50 text-tinta-900"
                : "bg-status-ruptura-bg text-status-ruptura-texto",
            )}
          >
            <span aria-hidden="true" className="font-semibold">
              {aviso ? "✓" : "●"}
            </span>
            {aviso ?? erroExportar ?? erroAplicar ?? erroIniciar}
          </p>
        )}

        {temCasos ? (
          <>
            <div
              role="group"
              aria-label="Filtrar casos por etapa"
              className="mt-5 flex flex-wrap gap-2"
            >
              {ORDEM_FILTROS.map((f) => {
                const ativo = f === filtro;
                const n = contagem(f);
                return (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={ativo}
                    onClick={() => {
                      setDestaque([]);
                      aoMudarFiltro(f);
                    }}
                    className={cn(
                      "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border px-3.5 text-sm leading-5 font-semibold",
                      ativo
                        ? "border-verde-900 bg-verde-900 text-branco"
                        : "border-borda bg-branco text-tinta-900",
                    )}
                  >
                    {ROTULO_FILTRO[f]}
                    {n !== null && (
                      <span
                        className={cn(
                          "rounded-pill px-2 py-px text-xs leading-4 font-semibold tabular-nums",
                          ativo ? "bg-branco/20 text-ouro-300" : "bg-creme-100 text-tinta-600",
                        )}
                      >
                        {inteiro(n)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {dados.casos.length > 0 ? (
              <ul
                key={dados.filtro}
                aria-label="Casos"
                aria-busy={trocando || undefined}
                className="m-0 mt-4 flex list-none flex-col gap-3 p-0"
              >
                {dados.casos.map((c, i) => (
                  <CartaoCaso
                    key={c.id}
                    caso={c}
                    ordem={i}
                    destacado={destaque.includes(c.id)}
                    aoConfirmarAplicacao={(caso, ref) => {
                      aplicar.reset();
                      setAConfirmar({ caso, ref });
                    }}
                  />
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-[14px] border border-dashed border-borda p-8 text-center text-corpo-m text-tinta-600">
                Nenhum caso nesta etapa.
              </p>
            )}
          </>
        ) : (
          <PassosDoVazio />
        )}
      </section>

      {dados.sugestoes.length > 0 && (
        <Sugestoes
          sugestoes={dados.sugestoes}
          iniciando={iniciar.isPending ? (iniciar.variables?.material_id ?? null) : null}
          aoIniciar={(s) => {
            if (!iniciar.isPending) {
              setAviso(null);
              iniciar.mutate(s);
            }
          }}
        />
      )}

      <p className="text-corpo-s text-tinta-600">
        O avanço considera apenas casos iniciados. A exportação é uma proposta para o sistema do
        cliente; não confirma implantação nem ganho realizado.
      </p>

      <Confirmacao
        aberta={aConfirmar !== null}
        aoMudar={(aberta) => {
          if (!aberta) setAConfirmar(null);
        }}
        titulo="Confirmar a aplicação no ERP?"
        descricao={
          aConfirmar
            ? `Você declara que aplicou os parâmetros novos de ${aConfirmar.caso.short_description} (${aConfirmar.caso.location_name}) no seu ERP${aConfirmar.ref ? `, referência ${aConfirmar.ref}` : ", sem referência externa"}. O Agro MRO não altera o ERP: só registra a sua declaração.`
            : ""
        }
        textoConfirmar="Declarar aplicação"
        aoConfirmar={() => {
          if (aConfirmar && !aplicar.isPending) {
            setAviso(null);
            aplicar.mutate(aConfirmar);
          }
          setAConfirmar(null);
        }}
      />
    </>
  );
}

function Carregando() {
  return (
    <>
      <CabecalhoPagina rotulo={ROTULO} titulo={TITULO} contexto={CONTEXTO} />
      <div role="status" aria-label="Carregando o plano de estoque" className="flex flex-col gap-6">
        <Esqueleto className="h-[76px] w-full rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Esqueleto key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Esqueleto className="h-[560px] w-full rounded-xl" />
      </div>
    </>
  );
}

export default function TelaPlanejamento() {
  const [filtro, setFiltro] = useState<FiltroPlanejamento>("active");
  const consulta = usePlanejamento(filtro);
  if (consulta.isPending) return <Carregando />;
  if (!consulta.data) {
    return (
      <>
        <CabecalhoPagina rotulo={ROTULO} titulo={TITULO} contexto={CONTEXTO} />
        <ErroDaTela
          titulo="Não foi possível carregar o plano de estoque."
          erro={consulta.error}
          aoTentarDeNovo={() => void consulta.refetch()}
        />
      </>
    );
  }
  return (
    <Conteudo
      dados={consulta.data}
      filtro={filtro}
      aoMudarFiltro={setFiltro}
      trocando={consulta.isPlaceholderData}
    />
  );
}
