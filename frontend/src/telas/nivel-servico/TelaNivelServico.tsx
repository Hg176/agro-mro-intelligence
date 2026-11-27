/**
 * Nível de serviço (NivelServico.dc.html), F1-12. GET /api/v1/nivel-servico traz os 75
 * casos (meta, faixa de cor, fator z, origem, diferença da V3), a frase e as contagens.
 * Uma aba PQR por vez (lei de Hick) com a grade ABC × XYZ; o caso selecionado abre no editor.
 * O 1º caso salvo pede confirmação: inicia a matriz própria e deixa os outros 74 NC.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";

import { chaves } from "@/api/chaves";
import { ApiErro } from "@/api/cliente";
import { useNivelServico, usePreviaAdocaoV3 } from "@/api/hooks";
import { adotarV3, removerMeta, salvarMeta } from "@/api/nivelServico";
import type { ClassePqr, Decimal, MatrizNivelServico } from "@/api/tipos";
import { Aba, Abas, ConteudoAba, ListaAbas } from "@/componentes/Abas";
import { Botao } from "@/componentes/Botao";
import { CabecalhoPagina } from "@/componentes/CabecalhoPagina";
import { Confirmacao } from "@/componentes/Confirmacao";
import { ErroDaTela } from "@/componentes/ErroDaTela";
import { Esqueleto } from "@/componentes/Esqueleto";
import { FaixaConclusao, fraseDaConclusao } from "@/componentes/FaixaConclusao";
import { SeloClasse } from "@/componentes/Selos";
import { inteiro, percentualDeFracao } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { AcaoProtegida } from "@/sessao/AcaoProtegida";

import { EditorCaso } from "./EditorCaso";
import {
  AVISO_ADOTADO,
  avisoRemovido,
  avisoSalvo,
  COR_FAIXA,
  COR_NC,
  FRASES_NIVEL_SERVICO,
  GRAVACAO_INCERTA,
  NOTA,
  ORDEM_ABC,
  ORDEM_PQR,
  ORDEM_XYZ,
  subtituloDoCaso,
  TEXTO_ABC,
  TEXTO_PQR,
  TEXTO_XYZ,
} from "./textos";

const ROTULO = "Regras do seu espaço";
const TITULO = "Nível de serviço";
const CONTEXTO =
  "Quantas vezes em cada 100 o item precisa estar na prateleira quando alguém pedir. São 75 combinações de PQR, ABC e XYZ; compare a referência V3 com a do seu espaço.";

function mensagemDeEscrita(erro: unknown): string | null {
  if (!erro) return null;
  if (erro instanceof ApiErro && erro.status >= 400 && erro.status < 500) return erro.mensagem;
  return GRAVACAO_INCERTA;
}

function Grade({
  dados,
  pqr,
  selecionado,
  aoSelecionar,
}: {
  dados: MatrizNivelServico;
  pqr: ClassePqr;
  selecionado: string;
  aoSelecionar: (caso: string) => void;
}) {
  const porCaso = new Map(dados.casos.map((c) => [c.case, c]));
  let ordem = 0;
  return (
    <table className="mt-5 w-full table-fixed border-separate border-spacing-2 tabular-nums">
      <caption className="sr-only">
        Metas de serviço para {pqr} ({TEXTO_PQR[pqr]}): linhas ABC, colunas XYZ
      </caption>
      <thead>
        <tr>
          <td className="w-[30%]" />
          {ORDEM_XYZ.map((x) => (
            <th key={x} scope="col" className="pb-1 text-center font-normal">
              <b className="block font-display text-base leading-5 font-bold">{x}</b>
              <span className="text-xs leading-4 text-tinta-600">{TEXTO_XYZ[x]}</span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {ORDEM_ABC.map((a) => {
          const n = dados.posicoes_por_linha[`${pqr}${a}`];
          return (
            <tr key={a}>
              <th scope="row" className="text-left font-normal">
                <span className="flex items-center gap-2.5">
                  <SeloClasse classe={a} />
                  <span className="min-w-0">
                    <span className="block text-[13px] leading-[18px] font-medium">
                      {TEXTO_ABC[a]}
                    </span>
                    <span className="block text-xs leading-4 text-tinta-600">
                      {n !== undefined
                        ? `${inteiro(n)} posições ${a}${pqr}`
                        : pqr === "N" || a === "N"
                          ? "item novo"
                          : ""}
                    </span>
                  </span>
                </span>
              </th>
              {ORDEM_XYZ.map((x) => {
                const k = `${pqr}${a}${x}`;
                const c = porCaso.get(k);
                if (!c) return <td key={x} />;
                const sel = k === selecionado;
                const valor = c.service_level === null ? "NC" : percentualDeFracao(c.service_level);
                const dif = c.diferente_da_v3 && c.service_level !== null;
                const atraso = ordem++ * 28;
                return (
                  <td key={x} className="p-0">
                    <button
                      type="button"
                      aria-pressed={sel}
                      aria-label={`Caso ${k}: ${valor}${dif ? ", diferente da V3" : ""}`}
                      onClick={() => aoSelecionar(k)}
                      className={cn(
                        "relative flex min-h-16 w-full cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[10px] motion-safe:animate-entrada",
                        c.service_level === null ? COR_NC : COR_FAIXA[c.faixa],
                        sel && "outline-[3px] outline-offset-2 outline-ouro-500 outline-solid",
                      )}
                      style={{ animationDelay: `${atraso}ms` }}
                    >
                      <span className="font-display text-lg leading-[22px] font-bold">{valor}</span>
                      <span className="text-[11px] leading-[14px] font-medium">
                        {subtituloDoCaso(c)}
                      </span>
                      {dif && (
                        <span
                          aria-hidden="true"
                          className="absolute top-1.5 right-1.5 size-2 rounded-full bg-ouro-500"
                        />
                      )}
                    </button>
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Legenda() {
  const item = (cor: string, texto: string) => (
    <li className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className={cn("size-3.5 rounded-[4px]", cor)} />
      {texto}
    </li>
  );
  return (
    <ul
      aria-label="Legenda"
      className="m-0 mt-4 flex list-none flex-wrap gap-x-[18px] gap-y-2 p-0 text-xs leading-4 font-medium text-tinta-600"
    >
      {item("border border-borda bg-creme-100", "0% · sem proteção")}
      {item("bg-verde-100", "50 a 79%")}
      {item("bg-verde-300", "80 a 94%")}
      {item("bg-verde-700", "95% ou mais")}
      {item("border-[1.5px] border-dashed border-tinta-300", "NC · não declarado")}
      <li className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="size-2 rounded-full bg-ouro-500" />
        diferente da V3
      </li>
    </ul>
  );
}

function AdocaoV3({
  aoCancelar,
  aoConfirmar,
  adotando,
  erro,
}: {
  aoCancelar: () => void;
  aoConfirmar: () => void;
  adotando: boolean;
  erro: string | null;
}) {
  const id = useId();
  const previa = usePreviaAdocaoV3(true);
  const [confirmado, setConfirmado] = useState(false);
  const numero = (n: number | undefined, texto: string, destaque = false) => (
    <div className={cn("rounded-xl px-3.5 py-3", destaque ? "bg-verde-50" : "bg-creme-100")}>
      <div
        className={cn(
          "font-display text-2xl leading-[30px] font-bold",
          destaque && "text-verde-700",
        )}
      >
        {n === undefined ? <Esqueleto className="h-[30px] w-12" /> : inteiro(n)}
      </div>
      <div className="text-corpo-s text-tinta-600">{texto}</div>
    </div>
  );
  return (
    <section
      aria-labelledby={`${id}-t`}
      className="flex flex-col gap-3.5 rounded-xl border-2 border-verde-700 bg-branco p-6 motion-safe:animate-entrada"
    >
      <div>
        <p className="text-rotulo uppercase text-ouro-700">Antes de confirmar</p>
        <h2 id={`${id}-t`} className="mt-1.5 font-display text-titulo-secao">
          Confira a adoção da matriz V3
        </h2>
        <p className="mt-1.5 text-corpo-m text-tinta-600">
          A confirmação substitui os casos da sua matriz pelos 75 valores V3. Decisões manuais dos
          materiais e versões anteriores ficam preservadas.
        </p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3 tabular-nums">
        {numero(previa.data?.casos_a_incluir, "casos a incluir")}
        {numero(previa.data?.configuracoes_a_substituir, "configurações a substituir")}
        {numero(previa.data?.valores_diferentes, "valores diferentes")}
        {numero(
          previa.data?.niveis_manuais_preservados,
          "níveis manuais de materiais preservados",
          true,
        )}
      </div>
      {previa.isError && (
        <p role="alert" className="m-0 text-corpo-s text-status-ruptura-texto">
          Não foi possível carregar o que muda. Feche e abra de novo.
        </p>
      )}
      <label className="flex min-h-11 cursor-pointer items-start gap-3 text-corpo-m">
        <input
          type="checkbox"
          checked={confirmado}
          onChange={(e) => setConfirmado(e.target.checked)}
          className="m-0 mt-px size-[22px] shrink-0 accent-verde-700"
        />
        Confirmo substituir a configuração do meu espaço pelos 75 valores apresentados.
      </label>
      {erro && (
        <p role="alert" className="m-0 text-corpo-s text-status-ruptura-texto">
          {erro}
        </p>
      )}
      <div className="flex flex-wrap gap-2.5">
        <Botao variant="secundario" size="grande" onClick={aoCancelar}>
          Cancelar
        </Botao>
        <AcaoProtegida permissao="editar_regras">
          <Botao
            variant="secundario"
            size="grande"
            className="border-verde-700 text-verde-700"
            disabled={!confirmado || adotando || !previa.data}
            aria-busy={adotando || undefined}
            onClick={() => {
              if (confirmado && !adotando) aoConfirmar();
            }}
          >
            {adotando ? "Adotando…" : "Confirmar adoção"}
          </Botao>
        </AcaoProtegida>
      </div>
    </section>
  );
}

function Conteudo({ dados }: { dados: MatrizNivelServico }) {
  const cliente = useQueryClient();
  const [pqr, setPqr] = useState<ClassePqr>("P");
  const [selecionado, setSelecionado] = useState("PBY");
  const [aviso, setAviso] = useState<string | null>(null);
  const [primeiro, setPrimeiro] = useState<Decimal | null>(null);
  const [adocaoAberta, setAdocaoAberta] = useState(false);
  const propria = dados.origem === "propria";
  const caso = dados.casos.find((c) => c.case === selecionado) ?? dados.casos[0];

  const aplicar = (r: MatrizNivelServico) => {
    cliente.setQueryData(chaves.nivelServico, r);
    // A meta muda ES/PP/EM: as telas com parâmetros leem de novo.
    void cliente.invalidateQueries({ queryKey: chaves.todoPlanejamento });
    void cliente.invalidateQueries({ queryKey: chaves.visaoGeral });
  };
  const salvar = useMutation({
    mutationFn: (p: { caso: string; meta: Decimal }) => salvarMeta(p.caso, p.meta, dados.versao),
    onSuccess: (r, p) => {
      aplicar(r);
      setAviso(avisoSalvo(p.caso));
    },
  });
  const remover = useMutation({
    mutationFn: (k: string) => removerMeta(k, dados.versao),
    onSuccess: (r, k) => {
      aplicar(r);
      setAviso(avisoRemovido(k));
    },
  });
  const adotar = useMutation({
    mutationFn: () => adotarV3(dados.versao),
    onSuccess: (r) => {
      aplicar(r);
      setAdocaoAberta(false);
      setAviso(AVISO_ADOTADO);
    },
  });

  if (!caso) return null;
  const pedirSalvar = (meta: Decimal) => {
    setAviso(null);
    if (!propria) setPrimeiro(meta);
    else salvar.mutate({ caso: caso.case, meta });
  };

  return (
    <>
      <CabecalhoPagina
        rotulo={ROTULO}
        titulo={TITULO}
        contexto={CONTEXTO}
        acoes={
          <span className="inline-flex items-center gap-2 rounded-pill border border-borda bg-branco px-3.5 py-1.5 text-[13px] leading-[18px] font-medium text-tinta-600">
            <span
              aria-hidden="true"
              className={cn("size-2 rounded-full", propria ? "bg-ouro-500" : "bg-verde-700")}
            />
            {propria
              ? `Matriz própria · ${inteiro(dados.casos_declarados)} de 75 declarados`
              : "Referência padrão V3 em uso"}
          </span>
        }
      />
      <FaixaConclusao frase={fraseDaConclusao(dados.conclusao, FRASES_NIVEL_SERVICO)} />
      <p
        role="note"
        className="m-0 flex items-start gap-3 rounded-[14px] border border-borda bg-branco px-[18px] py-3.5 text-sm leading-5 text-tinta-600"
      >
        <span aria-hidden="true" className="font-bold text-ouro-700">
          i
        </span>
        {NOTA}
      </p>
      {aviso && (
        <p
          role="status"
          className="m-0 flex items-start gap-2.5 rounded-xl bg-verde-50 px-4 py-3 text-sm leading-5 text-tinta-900 motion-safe:animate-aparecer"
        >
          <span aria-hidden="true" className="font-semibold text-verde-700">
            ✓
          </span>
          {aviso}
        </p>
      )}

      <div className="flex flex-wrap items-start gap-5">
        <section
          aria-labelledby="t-mat"
          className="min-w-0 flex-[3_1_560px] rounded-xl border border-borda bg-branco p-6"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-rotulo uppercase text-ouro-700">Metas por caso</p>
              <h2 id="t-mat" className="mt-1.5 font-display text-titulo-secao">
                Escolha a frequência de saída
              </h2>
            </div>
            <AcaoProtegida permissao="editar_regras">
              <Botao
                variant="secundario"
                aria-expanded={adocaoAberta}
                onClick={() => {
                  adotar.reset();
                  setAdocaoAberta(true);
                }}
              >
                Adotar os 75 valores V3
              </Botao>
            </AcaoProtegida>
          </div>

          <Abas
            value={pqr}
            onValueChange={(v) => {
              const novo = v as ClassePqr;
              setPqr(novo);
              setSelecionado(`${novo}${selecionado.slice(1)}`);
            }}
            className="mt-4 gap-0"
          >
            <ListaAbas aria-label="Frequência de saída (PQR)" className="gap-2 bg-transparent p-0">
              {ORDEM_PQR.map((p) => (
                <Aba
                  key={p}
                  value={p}
                  className={cn(
                    "group/aba min-h-12 gap-2.5 rounded-xl border border-borda bg-branco py-0 pr-3.5 pl-1.5 font-semibold text-tinta-900",
                    "data-[state=active]:border-verde-900 data-[state=active]:bg-verde-900 data-[state=active]:font-semibold data-[state=active]:text-branco",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="grid size-[34px] place-items-center rounded-[9px] bg-creme-100 font-display text-[15px] leading-none font-bold text-tinta-600 group-data-[state=active]/aba:bg-ouro-300 group-data-[state=active]/aba:text-verde-950"
                  >
                    {p}
                  </span>
                  <span className="sr-only">{p}: </span>
                  {TEXTO_PQR[p]}
                </Aba>
              ))}
            </ListaAbas>
            {ORDEM_PQR.map((p) => (
              <ConteudoAba key={p} value={p}>
                {p === pqr && (
                  <Grade
                    dados={dados}
                    pqr={p}
                    selecionado={selecionado}
                    aoSelecionar={setSelecionado}
                  />
                )}
              </ConteudoAba>
            ))}
          </Abas>
          <Legenda />
        </section>

        <EditorCaso
          key={`${caso.case}-${dados.versao}`}
          caso={caso}
          matrizPropria={propria}
          salvando={salvar.isPending}
          removendo={remover.isPending}
          erro={mensagemDeEscrita(salvar.error ?? remover.error)}
          aoSalvar={(meta) => {
            salvar.reset();
            pedirSalvar(meta);
          }}
          aoRemover={() => {
            setAviso(null);
            remover.mutate(caso.case);
          }}
        />
      </div>

      {adocaoAberta && (
        <AdocaoV3
          aoCancelar={() => setAdocaoAberta(false)}
          aoConfirmar={() => {
            setAviso(null);
            adotar.mutate();
          }}
          adotando={adotar.isPending}
          erro={mensagemDeEscrita(adotar.error)}
        />
      )}

      <p className="m-0 text-corpo-s text-tinta-600">
        Salvar o primeiro caso inicia uma matriz própria; os outros casos ficam NC até serem
        declarados ou até a adoção explícita da V3. Remover um caso mantém essa ausência: o padrão
        não preenche a sua matriz sozinho. Referência {dados.referencia}.
      </p>

      <Confirmacao
        aberta={primeiro !== null}
        aoMudar={(aberta) => {
          if (!aberta) setPrimeiro(null);
        }}
        titulo="Este é o primeiro caso da sua matriz própria"
        descricao="As outras 74 combinações ficam NC (sem meta) até você declarar cada uma ou adotar a V3. Os itens nesses casos ficam sem nível de serviço pela matriz."
        textoCancelar="Voltar"
        textoConfirmar="Iniciar matriz própria"
        aoConfirmar={() => {
          if (primeiro !== null && !salvar.isPending)
            salvar.mutate({ caso: caso.case, meta: primeiro });
          setPrimeiro(null);
        }}
      />
    </>
  );
}

function Carregando() {
  return (
    <>
      <CabecalhoPagina rotulo={ROTULO} titulo={TITULO} contexto={CONTEXTO} />
      <div role="status" aria-label="Carregando o nível de serviço" className="flex flex-col gap-6">
        <Esqueleto className="h-[76px] w-full rounded-xl" />
        <div className="flex gap-5">
          <Esqueleto className="h-[560px] flex-[3] rounded-xl" />
          <Esqueleto className="h-[560px] flex-[2] rounded-xl" />
        </div>
      </div>
    </>
  );
}

export default function TelaNivelServico() {
  const consulta = useNivelServico();
  if (consulta.isPending) return <Carregando />;
  if (consulta.isError) {
    return (
      <>
        <CabecalhoPagina rotulo={ROTULO} titulo={TITULO} contexto={CONTEXTO} />
        <ErroDaTela
          titulo="Não foi possível carregar o nível de serviço."
          erro={consulta.error}
          aoTentarDeNovo={() => void consulta.refetch()}
        />
      </>
    );
  }
  return <Conteudo dados={consulta.data} />;
}
