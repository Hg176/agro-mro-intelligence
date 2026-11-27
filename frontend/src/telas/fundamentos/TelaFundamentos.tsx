/**
 * /_fundamentos (só no dev): todos os tokens e todos os componentes em todos os estados.
 * É aqui que o Hugo confere a fundação (F1-5). Não entra no build de produção
 * (import dinâmico dentro de import.meta.env.DEV em AppRotas).
 */
import type { ColumnDef } from "@tanstack/react-table";
import { PackageOpen, Upload } from "lucide-react";
import { useState, type ReactNode } from "react";

import type { ClasseExibida, EstadoCaso, Posicao, Situacao } from "@/api/tipos";
import { Aba, Abas, ConteudoAba, ListaAbas } from "@/componentes/Abas";
import { BarraSaldoPp } from "@/componentes/BarraSaldoPp";
import { BarraSalvar } from "@/componentes/BarraSalvar";
import { Botao } from "@/componentes/Botao";
import { CabecalhoPagina } from "@/componentes/CabecalhoPagina";
import { Campo, CampoSenha } from "@/componentes/Campo";
import { CartaoKpi, GrupoKpi } from "@/componentes/CartaoKpi";
import { ChipFiltro } from "@/componentes/ChipFiltro";
import { Confirmacao } from "@/componentes/Confirmacao";
import { Esqueleto } from "@/componentes/Esqueleto";
import { EstadoVazio } from "@/componentes/EstadoVazio";
import { Destaque, FaixaConclusao } from "@/componentes/FaixaConclusao";
import { Gaveta } from "@/componentes/Gaveta";
import { GraficoBarras } from "@/componentes/GraficoBarras";
import { GradeMatriz } from "@/componentes/GradeMatriz";
import { SeloClasse, SeloEstadoCaso, SeloStatus } from "@/componentes/Selos";
import { Stepper } from "@/componentes/Stepper";
import { TabelaDados, type Ordenacao } from "@/componentes/TabelaDados";
import { codigoEmBlocos, inteiro, moedaCompacta, percentual } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { POSICOES } from "@/mocks/dados/posicoes";
import { casosTmer } from "@/mocks/dados/regras";
import { sessaoPorEstado } from "@/mocks/dados/sessao";
import { VISAO_GERAL } from "@/mocks/dados/visaoGeral";
import { AcaoProtegida } from "@/sessao/AcaoProtegida";
import { ContextoSessao } from "@/sessao/contexto";
import tokens from "../../../../docs/design/tokens/tokens.json";

/* Cada cor do tokens.json vira uma amostra com a classe do tema (bg-<nome>). */
const AMOSTRA: Record<string, string> = {
  "verde-950": "bg-verde-950",
  "verde-900": "bg-verde-900",
  "verde-800": "bg-verde-800",
  "verde-700": "bg-verde-700",
  "verde-500": "bg-verde-500",
  "verde-300": "bg-verde-300",
  "verde-100": "bg-verde-100",
  "verde-50": "bg-verde-50",
  "ouro-700": "bg-ouro-700",
  "ouro-600": "bg-ouro-600",
  "ouro-500": "bg-ouro-500",
  "ouro-300": "bg-ouro-300",
  "ouro-100": "bg-ouro-100",
  "creme-100": "bg-creme-100",
  branco: "bg-branco",
  "tinta-900": "bg-tinta-900",
  "tinta-600": "bg-tinta-600",
  "tinta-500": "bg-tinta-500",
  "tinta-300": "bg-tinta-300",
  borda: "bg-borda",
  "status-ruptura": "bg-status-ruptura",
  "status-ruptura-bg": "bg-status-ruptura-bg",
  "status-ruptura-texto": "bg-status-ruptura-texto",
  "status-alerta": "bg-status-alerta",
  "status-alerta-bg": "bg-status-alerta-bg",
  "status-alerta-texto": "bg-status-alerta-texto",
  "status-parado": "bg-status-parado",
  "status-parado-bg": "bg-status-parado-bg",
};

const TEXTOS: { classe: string; nome: string; familia: string }[] = [
  { classe: "font-display text-display-xl", nome: "display-xl", familia: "Plus Jakarta Sans" },
  { classe: "font-display text-display-l", nome: "display-l", familia: "Plus Jakarta Sans" },
  { classe: "font-display text-titulo-m", nome: "titulo-m", familia: "Plus Jakarta Sans" },
  { classe: "numero text-numero-l", nome: "numero-l", familia: "Plus Jakarta Sans" },
  { classe: "text-titulo-s", nome: "titulo-s", familia: "Inter" },
  { classe: "text-corpo-l", nome: "corpo-l", familia: "Inter" },
  { classe: "text-corpo-m", nome: "corpo-m", familia: "Inter" },
  { classe: "text-corpo-s", nome: "corpo-s", familia: "Inter" },
  { classe: "text-rotulo uppercase", nome: "rotulo", familia: "Inter" },
  { classe: "text-botao", nome: "botao", familia: "Inter" },
];

const ESPACOS: { nome: string; classe: string }[] = [
  { nome: "esp-4", classe: "w-esp-4" },
  { nome: "esp-8", classe: "w-esp-8" },
  { nome: "esp-12", classe: "w-esp-12" },
  { nome: "esp-16", classe: "w-esp-16" },
  { nome: "esp-24", classe: "w-esp-24" },
  { nome: "esp-32", classe: "w-esp-32" },
  { nome: "esp-48", classe: "w-esp-48" },
  { nome: "esp-80", classe: "w-esp-80" },
];

const RAIOS = [
  { nome: "raio-sm (rounded-sm)", classe: "rounded-sm" },
  { nome: "raio-md (rounded-md)", classe: "rounded-md" },
  { nome: "raio-lg (rounded-lg)", classe: "rounded-lg" },
  { nome: "raio-xl (rounded-xl)", classe: "rounded-xl" },
  { nome: "raio-pill (rounded-pill)", classe: "rounded-pill" },
];

const SITUACOES: Situacao[] = ["ruptura", "abaixo_pp", "parado", "saudavel", "sem_calculo"];
const CLASSES: ClasseExibida[] = ["A", "B", "C", "D", "N", "NC"];
const ESTADOS: EstadoCaso[] = [
  "todo",
  "analysis",
  "testing",
  "ready",
  "validated",
  "exported",
  "applied",
  "discarded",
];

function Secao({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-xl border border-borda bg-branco p-esp-24">
      <h2 id={id} className="font-display text-titulo-s text-tinta-900">
        {titulo}
      </h2>
      <div className="mt-esp-16 flex flex-col gap-esp-16">{children}</div>
    </section>
  );
}

function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start gap-3">
      <span className="w-40 shrink-0 pt-2.5 text-corpo-s font-semibold text-tinta-600">
        {rotulo}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-start gap-3">{children}</div>
    </div>
  );
}

const colunasTabela: ColumnDef<Posicao, unknown>[] = [
  {
    id: "classe",
    header: "Classe",
    cell: ({ row }) => <SeloClasse classe={row.original.abc ?? "NC"} />,
  },
  {
    id: "material",
    header: "Material",
    cell: ({ row }) => (
      <span className="flex flex-col">
        <span className="font-semibold text-tinta-900">{row.original.short_description}</span>
        <span className="text-corpo-s text-tinta-500">{codigoEmBlocos(row.original.code)}</span>
      </span>
    ),
  },
  { id: "local", header: "Local", cell: ({ row }) => row.original.location_name },
  {
    id: "saldo",
    header: "Saldo × ponto de pedido",
    cell: ({ row }) => (
      <BarraSaldoPp
        saldo={row.original.stock_quantity}
        pontoPedido={row.original.reorder_point}
        unidade={row.original.unit.toLowerCase()}
        fracao={row.original.fracao_barra_saldo_pp}
        situacao={row.original.situacao}
        semBarra
      />
    ),
  },
  {
    id: "situacao",
    header: "Situação",
    cell: ({ row }) => <SeloStatus situacao={row.original.situacao} />,
  },
];

export default function TelaFundamentos() {
  const [chip, setChip] = useState<string | null>("abaixo");
  const [gaveta, setGaveta] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [excluir, setExcluir] = useState(false);
  const [mudou, setMudou] = useState(false);
  const [ordem, setOrdem] = useState<Ordenacao>(null);
  const [celula, setCelula] = useState<{ linha: string; coluna: string } | null>({
    linha: "P",
    coluna: "A",
  });
  const [pagina, setPagina] = useState(1);
  const [destaque, setDestaque] = useState<ReadonlySet<string>>(new Set());

  // Ordenação de demonstração só por texto (descrição). Número nunca é ordenado no front.
  const linhas = POSICOES.slice(0, 6);
  const ordenadas =
    ordem?.coluna === "material"
      ? [...linhas].sort(
          (a, b) =>
            a.short_description.localeCompare(b.short_description, "pt-BR") *
            (ordem.direcao === "asc" ? 1 : -1),
        )
      : linhas;

  const grade = VISAO_GERAL.matriz_abc_pqr.celulas;
  const tmer = casosTmer().filter((c) => c.pqr === "P");

  return (
    <main id="conteudo" className="min-h-screen bg-background px-10 pt-8 pb-32">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-7">
        <CabecalhoPagina
          rotulo="Só no dev"
          titulo="Fundamentos do front-end"
          contexto="Tokens de docs/design/tokens e todos os componentes base em todos os estados."
        />

        <Secao id="f-cores" titulo="Cores">
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 lg:grid-cols-4">
            {tokens.color.tokens.map((t) => (
              <li key={t.name} className="flex gap-3 rounded-lg border border-borda p-3">
                <span
                  aria-hidden="true"
                  className={cn("size-12 shrink-0 rounded-md border border-borda", AMOSTRA[t.name])}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-tinta-900">{t.name}</span>
                  <span className="block text-corpo-s text-tinta-500 tabular-nums">
                    {t.value.toLowerCase()}
                  </span>
                  <span className="block text-xs leading-4 text-tinta-600">{t.usage}</span>
                </span>
              </li>
            ))}
          </ul>
        </Secao>

        <Secao id="f-tipo" titulo="Tipografia">
          {TEXTOS.map((t) => (
            <div key={t.nome} className="flex flex-wrap items-baseline gap-4">
              <span className="w-32 shrink-0 text-corpo-s text-tinta-500">
                {t.nome} · {t.familia}
              </span>
              <span className={cn(t.classe, "text-tinta-900")}>
                {t.nome === "numero-l" ? "R$ 2,4 mi" : "Inteligência para materiais"}
              </span>
            </div>
          ))}
        </Secao>

        <Secao id="f-esp" titulo="Espaçamentos, raios e sombras">
          <Linha rotulo="Espaçamentos">
            {ESPACOS.map((e) => (
              <span key={e.nome} className="flex flex-col items-start gap-1">
                <span
                  aria-hidden="true"
                  className={cn("h-3 rounded-[2px] bg-verde-500", e.classe)}
                />
                <span className="text-corpo-s text-tinta-600">{e.nome}</span>
              </span>
            ))}
          </Linha>
          <Linha rotulo="Raios">
            {RAIOS.map((r) => (
              <span key={r.nome} className="flex flex-col items-start gap-1">
                <span
                  aria-hidden="true"
                  className={cn("h-12 w-24 border border-borda bg-verde-50", r.classe)}
                />
                <span className="text-corpo-s text-tinta-600">{r.nome}</span>
              </span>
            ))}
          </Linha>
          <Linha rotulo="Sombras">
            <span className="rounded-md border border-verde-700 bg-branco px-4 py-3 shadow-foco">
              sombra-foco (com borda verde-700)
            </span>
            <span className="rounded-xl bg-branco px-4 py-3 shadow-previa">
              sombra-previa (só a prévia da landing)
            </span>
          </Linha>
        </Secao>

        <Secao id="f-botoes" titulo="Botões">
          <Linha rotulo="Variantes">
            <Botao>Abrir meu plano</Botao>
            <Botao variant="cta">Assinar o Intelligence</Botao>
            <Botao variant="secundario">Baixar Excel</Botao>
            <Botao variant="fantasma">Ver detalhes</Botao>
            <Botao variant="perigo">Excluir conta</Botao>
          </Linha>
          <Linha rotulo="Tamanhos">
            <Botao>Padrão 44px</Botao>
            <Botao size="grande">Grande 52px</Botao>
            <Botao size="icone" aria-label="Importar">
              <Upload aria-hidden="true" />
            </Botao>
          </Linha>
          <Linha rotulo="Desabilitado">
            <Botao disabled>Salvar</Botao>
            <Botao variant="cta" disabled>
              Assinar
            </Botao>
          </Linha>
          <Linha rotulo="Ação protegida">
            {(["ativo", "demonstracao", "somente_leitura"] as const).map((estado) => (
              <ContextoSessao.Provider key={estado} value={sessaoPorEstado(estado)}>
                <AcaoProtegida permissao="exportar_excel">
                  <Botao variant="secundario">Baixar Excel ({estado})</Botao>
                </AcaoProtegida>
              </ContextoSessao.Provider>
            ))}
          </Linha>
        </Secao>

        <Secao id="f-selos" titulo="Selos">
          <Linha rotulo="Status">
            {SITUACOES.map((s) => (
              <SeloStatus key={s} situacao={s} />
            ))}
          </Linha>
          <Linha rotulo="Classe">
            {CLASSES.map((c) => (
              <SeloClasse key={c} classe={c} />
            ))}
          </Linha>
          <Linha rotulo="Estado do caso">
            {ESTADOS.map((e) => (
              <SeloEstadoCaso key={e} estado={e} mudou={mudou && e === "validated"} />
            ))}
            <Botao variant="fantasma" onClick={() => setMudou((m) => !m)}>
              Simular mudança (pop)
            </Botao>
          </Linha>
        </Secao>

        <Secao id="f-conclusao" titulo="Cabeçalho e frase de conclusão">
          <FaixaConclusao
            frase={
              <>
                <Destaque>R$ 412 mil</Destaque> (17% do estoque) estão em 214 itens sem saída há
                mais de 180 dias. E 23 posições estão abaixo do ponto de pedido,{" "}
                <Destaque>5 delas classe A</Destaque>: comece por elas.
              </>
            }
            acao={<Botao size="grande">Ver os 5 itens A</Botao>}
          />
          <FaixaConclusao frase={null} />
        </Secao>

        <Secao id="f-kpi" titulo="KPIs">
          <div className="flex flex-wrap gap-5">
            <GrupoKpi titulo="Dinheiro" className="flex-[2_1_420px]">
              <CartaoKpi
                rotulo="Valor em estoque"
                valor={moedaCompacta(VISAO_GERAL.kpis.valor_estoque.valores.valor)}
                apoio="812 posições com preço"
                link={{ texto: "Ver composição →", para: "/_fundamentos" }}
              />
              <CartaoKpi
                rotulo="Parado há +180 dias"
                valor={moedaCompacta(VISAO_GERAL.kpis.parado_180_dias.valores.valor)}
                tom="parado"
                apoio={`214 itens · ${percentual(VISAO_GERAL.kpis.parado_180_dias.valores.percentual_valor)} do valor`}
              />
            </GrupoKpi>
            <GrupoKpi titulo="Saúde do estoque" className="flex-[2_1_420px]">
              <CartaoKpi
                rotulo="Abaixo do ponto de pedido"
                valor={inteiro(23)}
                tom="alerta"
                apoio="5 são classe A"
              />
              <CartaoKpi
                rotulo="Saldo negativo"
                valor={null}
                motivo="Sem saldo final no cadastro"
              />
            </GrupoKpi>
          </div>
        </Secao>

        <Secao id="f-saldo" titulo="Barra saldo × PP">
          <div className="grid grid-cols-2 gap-esp-16 lg:grid-cols-3">
            {POSICOES.slice(0, 11).map((p) => (
              <div key={p.material_id} className="flex flex-col gap-1">
                <span className="text-corpo-s text-tinta-600">{p.short_description}</span>
                <BarraSaldoPp
                  saldo={p.stock_quantity}
                  pontoPedido={p.reorder_point}
                  unidade={p.unit.toLowerCase()}
                  fracao={p.fracao_barra_saldo_pp}
                  situacao={p.situacao}
                />
              </div>
            ))}
          </div>
        </Secao>

        <Secao id="f-chips" titulo="Chips de filtro e abas">
          <Linha rotulo="Chips">
            <ChipFiltro
              rotulo="Abaixo do PP"
              icone={<span className="text-status-alerta">▲</span>}
              contagem={23}
              ativo={chip === "abaixo"}
              aoAlternar={() => setChip(chip === "abaixo" ? null : "abaixo")}
              aoRemover={() => setChip(null)}
            />
            <ChipFiltro
              rotulo="Saldo negativo"
              icone={<span className="text-status-ruptura">●</span>}
              contagem={8}
              ativo={chip === "negativo"}
              aoAlternar={() => setChip(chip === "negativo" ? null : "negativo")}
            />
            <ChipFiltro
              rotulo="Sem cálculo"
              icone={<span className="text-tinta-500">○</span>}
              contagem={null}
              ativo={false}
              aoAlternar={() => undefined}
            />
          </Linha>
          <Linha rotulo="Abas">
            <Abas defaultValue="abc">
              <ListaAbas aria-label="Classificação">
                <Aba value="abc">ABC consumo</Aba>
                <Aba value="pqr">PQR saídas</Aba>
                <Aba value="xyz">XYZ criticidade</Aba>
              </ListaAbas>
              <ConteudoAba value="abc">Conteúdo da aba ABC.</ConteudoAba>
              <ConteudoAba value="pqr">Conteúdo da aba PQR.</ConteudoAba>
              <ConteudoAba value="xyz">Conteúdo da aba XYZ.</ConteudoAba>
            </Abas>
            <Abas defaultValue="P">
              <ListaAbas variant="pilula" aria-label="Frequência de saída (PQR)">
                {["P", "Q", "R", "S", "N"].map((l) => (
                  <Aba key={l} value={l}>
                    {l}
                  </Aba>
                ))}
              </ListaAbas>
              {["P", "Q", "R", "S", "N"].map((l) => (
                <ConteudoAba key={l} value={l}>
                  Casos com PQR {l}.
                </ConteudoAba>
              ))}
            </Abas>
          </Linha>
        </Secao>

        <Secao id="f-form" titulo="Campos">
          <div className="grid max-w-2xl grid-cols-2 gap-esp-16">
            <Campo rotulo="E-mail" type="email" placeholder="voce@empresa.com" />
            <Campo rotulo="Código do material" ajuda="Com ou sem espaços, tanto faz." />
            <Campo
              rotulo="E-mail (erro)"
              defaultValue="hugo@empresa"
              erro="E-mail ou senha não conferem. Confira os dois e tente de novo."
            />
            <CampoSenha rotulo="Senha" ajuda="Mínimo de 8 caracteres." />
            <Campo rotulo="Desabilitado" disabled defaultValue="***.456.789-**" />
          </div>
        </Secao>

        <Secao id="f-camadas" titulo="Gaveta, confirmação e barra de salvar">
          <Linha rotulo="Abrir">
            <Botao variant="secundario" onClick={() => setGaveta(true)}>
              Adicionar material
            </Botao>
            <Botao variant="secundario" onClick={() => setConfirmar(true)}>
              Salvar cortes
            </Botao>
            <Botao variant="perigo" onClick={() => setExcluir(true)}>
              Excluir conta
            </Botao>
          </Linha>
          <Gaveta
            aberta={gaveta}
            aoMudar={setGaveta}
            titulo="Adicionar material"
            descricao="Os mesmos campos do cadastro."
            rodape={
              <>
                <Botao variant="fantasma" onClick={() => setGaveta(false)}>
                  Cancelar
                </Botao>
                <Botao onClick={() => setGaveta(false)}>Salvar material</Botao>
              </>
            }
          >
            <Campo rotulo="Código" />
            <Campo rotulo="Descrição curta" />
          </Gaveta>
          <Confirmacao
            aberta={confirmar}
            aoMudar={setConfirmar}
            titulo="Isso recalcula o estoque todo"
            descricao="Os cortes novos valem para a próxima classificação de todas as posições."
            textoConfirmar="Salvar e recalcular"
            aoConfirmar={() => setConfirmar(false)}
          />
          <Confirmacao
            aberta={excluir}
            aoMudar={setExcluir}
            titulo="Excluir sua conta"
            descricao="Seus dados pessoais serão apagados. Isso não pode ser desfeito."
            textoConfirmar="Excluir conta"
            variante="perigo"
            palavraExigida="EXCLUIR"
            aoConfirmar={() => setExcluir(false)}
          />
        </Secao>

        <Secao id="f-passos" titulo="Stepper, skeleton e estado vazio">
          <Stepper
            passos={["Arquivo", "Colunas", "Prévia", "Concluído"]}
            atual={2}
            rotulo="Importação"
          />
          <div className="flex flex-col gap-2">
            <Esqueleto className="h-6 w-2/3" />
            <Esqueleto className="h-6 w-1/2" />
            <Esqueleto className="h-24 w-full rounded-xl" />
          </div>
          <EstadoVazio
            icone={PackageOpen}
            titulo="Seu catálogo ainda está vazio"
            texto="Importe os dados mestres para ver saldo, classe e situação de cada posição."
            acao={<Botao>Importar dados mestres</Botao>}
          />
        </Secao>

        <Secao id="f-tabela" titulo="Tabela">
          <TabelaDados
            titulo="O que resolver primeiro (exemplo)"
            colunas={colunasTabela}
            dados={ordenadas}
            idDaLinha={(p) => String(p.material_id)}
            ordenacao={ordem}
            ordenaveis={["material"]}
            aoOrdenar={setOrdem}
            linhasDestacadas={destaque}
            nomeDasLinhas="posições"
            paginacao={{ pagina, paginas: 9, total: 812, aoMudarPagina: setPagina }}
          />
          <Botao variant="fantasma" onClick={() => setDestaque(new Set(["2"]))}>
            Destacar a linha que mudou
          </Botao>
          <TabelaDados
            titulo="Carregando"
            colunas={colunasTabela}
            dados={[]}
            idDaLinha={(p) => p.code}
            estado="carregando"
          />
          <TabelaDados
            titulo="Vazia"
            colunas={colunasTabela}
            dados={[]}
            idDaLinha={(p) => p.code}
            vazio={{
              titulo: "Nada encontrado",
              texto: "Confira o código ou busque por parte da descrição.",
            }}
          />
          <TabelaDados
            titulo="Com erro"
            colunas={colunasTabela}
            dados={[]}
            idDaLinha={(p) => p.code}
            estado="erro"
            aoTentarDeNovo={() => undefined}
          />
        </Secao>

        <Secao id="f-grade" titulo="Grades e gráfico">
          <div className="flex flex-wrap gap-esp-32">
            <GradeMatriz
              titulo="Consumo × frequência (posições)"
              eixos={{ linhas: "PQR", colunas: "ABC" }}
              linhas={["P", "Q", "R", "S"]}
              colunas={["A", "B", "C", "D"]}
              celula={(l, c) => {
                const x = grade.find((g) => g.linha === l && g.coluna === c);
                return x
                  ? {
                      texto: inteiro(x.posicoes),
                      faixa: x.faixa,
                      destaque: x.destaque,
                      rotulo: `${c}${l}: ${inteiro(x.posicoes)} posições`,
                    }
                  : null;
              }}
              selecionada={celula}
              aoSelecionar={(linha, coluna) => setCelula({ linha, coluna })}
            />
            <GradeMatriz
              titulo="TMER P (dias)"
              tom="ouro"
              eixos={{ linhas: "ABC", colunas: "X123" }}
              linhas={["A", "B", "C", "D", "N"]}
              colunas={["1", "2", "3"]}
              celula={(l, c) => {
                const x = tmer.find((t) => t.abc === l && String(t.purchasability) === c);
                return x
                  ? {
                      texto: x.replenishment_days,
                      faixa: x.faixa,
                      destaque: false,
                      rotulo: `P${l}${c}: ${x.replenishment_days} dias`,
                    }
                  : null;
              }}
            />
          </div>
          <GraficoBarras
            titulo="% do valor consumido por classe ABC"
            formatar={percentual}
            pontos={VISAO_GERAL.composicao.abc
              .filter((c) => c.percentual_valor !== null)
              .map((c, i) => ({
                rotulo: c.classe,
                valor: c.percentual_valor,
                cor: ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5,
              }))}
          />
        </Secao>
      </div>

      <BarraSalvar
        visivel={celula?.linha !== "P" || celula.coluna !== "A"}
        aoSalvar={() => setCelula({ linha: "P", coluna: "A" })}
        aoDescartar={() => setCelula({ linha: "P", coluna: "A" })}
        texto="Exemplo: escolher outra célula da grade faz a barra subir."
      />
    </main>
  );
}
