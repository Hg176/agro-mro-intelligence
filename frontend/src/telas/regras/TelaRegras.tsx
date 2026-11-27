/**
 * Regras e letras (RegrasLetras.dc.html), F1-11. GET /api/v1/regras traz cortes, padrão,
 * frase (conclusao.tipo) e, por aba, exemplo, contagens e barra calculados pelo backend.
 * O front não recalcula nada: manda o corte novo (PUT) depois da confirmação "Isso
 * recalcula o estoque todo" e mostra a resposta.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router";

import { chaves } from "@/api/chaves";
import { ApiErro } from "@/api/cliente";
import { useRegras } from "@/api/hooks";
import { restaurarCortes, salvarCortes } from "@/api/regras";
import type { AbaRegras, CortesDoEspaco, Decimal, RegrasLetras } from "@/api/tipos";
import { Aba, Abas, ConteudoAba, ListaAbas } from "@/componentes/Abas";
import { CabecalhoPagina } from "@/componentes/CabecalhoPagina";
import { Confirmacao } from "@/componentes/Confirmacao";
import { ErroDaTela } from "@/componentes/ErroDaTela";
import { Esqueleto } from "@/componentes/Esqueleto";
import { FaixaConclusao, fraseDaConclusao } from "@/componentes/FaixaConclusao";
import { inteiro } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { AcaoProtegida } from "@/sessao/AcaoProtegida";

import { PainelClassificacao } from "./PainelClassificacao";
import {
  ABAS,
  AVISO_RESTAURADO,
  avisoSalvo,
  FRASES_REGRAS,
  ORDEM_ABAS,
  SALVAR_INCERTO,
  type Rascunho,
} from "./textos";

const ROTULO = "Metodologia";
const TITULO = "Regras e letras";
const CONTEXTO =
  "O que cada letra quer dizer e onde fica o corte. Consulte o padrão Agro MRO e, se precisar, ajuste os cortes ABC, PQR e o prazo de item novo do seu espaço.";

/** Decimal "80.5" → "80,5" para o campo; e o caminho de volta. Só troca o separador. */
const paraCampo = (c: CortesDoEspaco): Rascunho => ({
  abc_a_percentual: c.abc_a_percentual.replace(".", ","),
  abc_b_percentual: c.abc_b_percentual.replace(".", ","),
  pqr_saidas_q: c.pqr_saidas_q.replace(".", ","),
  pqr_saidas_p: c.pqr_saidas_p.replace(".", ","),
  pqr_entradas_q: c.pqr_entradas_q.replace(".", ","),
  pqr_entradas_p: c.pqr_entradas_p.replace(".", ","),
  item_novo_dias: String(c.item_novo_dias),
});
const decimalDoCampo = (t: string) => t.trim().replace(",", ".") as Decimal;
const paraApi = (r: Rascunho): CortesDoEspaco => ({
  abc_a_percentual: decimalDoCampo(r.abc_a_percentual),
  abc_b_percentual: decimalDoCampo(r.abc_b_percentual),
  pqr_saidas_q: decimalDoCampo(r.pqr_saidas_q),
  pqr_saidas_p: decimalDoCampo(r.pqr_saidas_p),
  pqr_entradas_q: decimalDoCampo(r.pqr_entradas_q),
  pqr_entradas_p: decimalDoCampo(r.pqr_entradas_p),
  // Dias é inteiro no contrato; o formato já foi conferido (só dígitos).
  item_novo_dias: Number.parseInt(r.item_novo_dias.trim(), 10),
});

function mensagemDeEscrita(erro: unknown): string | null {
  if (!erro) return null;
  if (erro instanceof ApiErro && erro.status >= 400 && erro.status < 500) return erro.mensagem;
  return SALVAR_INCERTO;
}

function Recolhida({
  titulo,
  resumo,
  children,
}: {
  titulo: ReactNode;
  resumo: string;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-xl border border-borda bg-branco">
      <summary className="flex min-h-[76px] cursor-pointer list-none items-center gap-4 px-6 py-[18px] [&::-webkit-details-marker]:hidden">
        <span className="flex-1">
          <span className="flex items-center gap-2.5 text-base leading-6 font-bold">{titulo}</span>
          <span className="block text-corpo-s text-tinta-600">{resumo}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-[18px] text-tinta-600 group-open:rotate-180 motion-safe:transition-transform"
        />
      </summary>
      <div className="px-6 pb-[22px]">{children}</div>
    </details>
  );
}

function ParaAprofundar({ alertas }: { alertas: number }) {
  const metodo = (titulo: string, texto: string) => (
    <article className="rounded-xl bg-creme-100 px-4 py-3.5">
      <h3 className="text-[15px] leading-5 font-semibold">{titulo}</h3>
      <p className="mt-1 text-corpo-s text-tinta-600">{texto}</p>
    </article>
  );
  return (
    <section aria-labelledby="t-apr-regras" className="flex flex-col gap-3">
      <h2 id="t-apr-regras" className="text-rotulo uppercase text-tinta-600">
        Para aprofundar
      </h2>
      <Recolhida
        titulo="Regra dos lotes"
        resumo="Como ES, PP e EM são arredondados pelo múltiplo de embalagem"
      >
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          <p className="m-0 flex-[2_1_420px] text-corpo-m text-tinta-600">
            Se você informar um múltiplo de embalagem na posição, o estoque de segurança, o ponto de
            pedido e o máximo calculados sobem até o próximo múltiplo. Sem múltiplo, vale a natureza
            da quantidade (inteira ou fracionável). O valor bruto fica guardado. Valor manual,
            inclusive zero, fica exatamente como você digitou. Máximo manual abaixo do ponto de
            pedido gera conflito e não é corrigido sozinho.
          </p>
          <div className="flex-[1_1_260px] rounded-xl bg-creme-100 px-4 py-3.5 text-corpo-s text-tinta-900">
            <b className="font-semibold">Exemplo:</b> múltiplo 6 e cálculo de 13 un → o sistema
            mostra <b className="font-semibold">18 un</b>. É arredondamento de embalagem, não um
            lote de compra recomendado.
          </div>
        </div>
      </Recolhida>
      <Recolhida
        titulo="Métodos e cenários do motor"
        resumo="Quais contas o sistema compara antes de sugerir ES, PP e EM"
      >
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
          {metodo(
            "Estoque de segurança",
            "Compara Inversa Normal, TMEA, Raiz tradicional, Fator tradicional, quantil empírico e o valor que você declarou.",
          )}
          {metodo(
            "Ponto de pedido",
            "Compara demanda média no prazo + segurança, quantil empírico e o valor declarado.",
          )}
          {metodo(
            "Estoque máximo",
            "EM-01 tradicional, EM-02 Agro MRO e EM-03 empírico podem ser escolhidos; EM-04 a EM-07 servem de comparação.",
          )}
          {metodo(
            "Cenários",
            "Motor Agro MRO, Conservador (média), Maior proteção (maior calculável) e Com risco (menor positivo). Valores manuais prevalecem.",
          )}
        </div>
      </Recolhida>
      <Recolhida
        titulo={
          <>
            Regras em estudo
            <span className="rounded-pill bg-ouro-100 px-2.5 py-0.5 text-xs leading-[18px] font-semibold text-ouro-700">
              Em homologação
            </span>
          </>
        }
        resumo="Gatilhos GR1–GR7 e a matriz TMER ainda não mudam o cálculo"
      >
        <div className="flex flex-col gap-2.5 text-corpo-m text-tinta-600">
          <p className="m-0">
            <b className="font-semibold text-tinta-900">GR1 a GR7:</b> no SIO, são caminhos
            históricos para escolher quando agir na reposição. As telas já mostram o ponto de pedido
            e os candidatos de cálculo, mas os sete caminhos ainda não viraram decisão automática do
            Agro MRO.
          </p>
          <p className="m-0">
            <b className="font-semibold text-tinta-900">Matriz TMER:</b> a tabela de dias pode ser
            consultada e editada, mas ainda não altera o cálculo até a numeração dela ser conciliada
            com a Comprabilidade do cadastro.
          </p>
        </div>
      </Recolhida>
      <Link
        to="/app/casos-controle"
        className="flex min-h-[76px] items-center gap-4 rounded-xl border border-borda bg-branco px-6 py-[18px] text-inherit no-underline"
      >
        <span className="flex-1">
          <span className="block text-base leading-6 font-bold text-tinta-900">
            {inteiro(alertas)} alertas ativos
          </span>
          <span className="block text-corpo-s text-tinta-600">
            Saldo negativo, reposição indicada, acima do limite, histórico insuficiente, preço
            ausente, cobertura elevada, sem giro e parâmetro definido por você
          </span>
        </span>
        <span className="text-sm leading-5 font-semibold whitespace-nowrap text-verde-700">
          Casos de controle →
        </span>
      </Link>
    </section>
  );
}

function Conteudo({ dados }: { dados: RegrasLetras }) {
  const cliente = useQueryClient();
  const [aba, setAba] = useState<AbaRegras>("abc");
  const salvo = paraCampo(dados.cortes);
  const [rascunho, setRascunho] = useState<Rascunho>(salvo);
  const [confirmando, setConfirmando] = useState(false);
  const [restaurarPedido, setRestaurarPedido] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const aplicarResposta = (r: RegrasLetras) => {
    cliente.setQueryData(chaves.regras, r);
    setRascunho(paraCampo(r.cortes));
    // As classes mudam o estoque todo: as telas que mostram classe leem de novo.
    void cliente.invalidateQueries({ queryKey: chaves.visaoGeral });
    void cliente.invalidateQueries({ queryKey: chaves.todosMateriais });
    void cliente.invalidateQueries({ queryKey: chaves.todoPlanejamento });
  };

  const salvar = useMutation({
    mutationFn: () => salvarCortes(paraApi(rascunho), dados.versao),
    onSuccess: (r) => {
      aplicarResposta(r);
      setAviso(avisoSalvo(r.versao));
    },
  });
  const restaurar = useMutation({
    mutationFn: () => restaurarCortes(dados.versao),
    onSuccess: (r) => {
      aplicarResposta(r);
      setRestaurarPedido(false);
      setAviso(AVISO_RESTAURADO);
    },
  });

  const proprio = dados.origem === "cliente";
  const trocarAba = (nova: AbaRegras) => {
    setAba(nova);
    setRascunho(salvo);
    salvar.reset();
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
              className={cn("size-2 rounded-full", proprio ? "bg-ouro-500" : "bg-verde-700")}
            />
            {proprio
              ? `Cortes do seu espaço · versão ${inteiro(dados.versao)}`
              : "Cortes padrão Agro MRO"}
          </span>
        }
      />
      <FaixaConclusao frase={fraseDaConclusao(dados.conclusao, FRASES_REGRAS)} />

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

      <Abas value={aba} onValueChange={(v) => trocarAba(v as AbaRegras)} className="gap-6">
        <ListaAbas aria-label="Classificações" className="gap-2 bg-transparent p-0">
          {ORDEM_ABAS.map((k) => (
            <Aba
              key={k}
              value={k}
              className={cn(
                "group/aba min-h-12 gap-2.5 rounded-xl border border-borda bg-branco py-0 pr-4 pl-2 font-semibold text-tinta-900",
                "data-[state=active]:border-verde-900 data-[state=active]:bg-verde-900 data-[state=active]:font-semibold data-[state=active]:text-branco",
              )}
            >
              <span
                aria-hidden="true"
                className="min-w-9 rounded-[7px] bg-creme-100 px-1.5 py-[3px] text-center font-display text-xs leading-4 font-bold tracking-[0.04em] text-tinta-600 group-data-[state=active]/aba:bg-ouro-300 group-data-[state=active]/aba:text-verde-950"
              >
                {ABAS[k].letrasAba}
              </span>
              {ABAS[k].rotuloAba}
            </Aba>
          ))}
        </ListaAbas>
        {/* O Radix só monta a aba ativa: trocar de aba reinicia o rascunho e a entrada. */}
        {ORDEM_ABAS.map((k) => (
          <ConteudoAba key={k} value={k} aria-label={ABAS[k].nome}>
            {k === aba && (
              <PainelClassificacao
                aba={aba}
                painel={dados.paineis[aba]}
                rascunho={rascunho}
                salvo={salvo}
                padrao={dados.padrao}
                aoMudar={(chave, valor) => {
                  setAviso(null);
                  salvar.reset();
                  setRascunho((r) => ({ ...r, [chave]: valor }));
                }}
                aoDesfazer={() => setRascunho(salvo)}
                aoPedirSalvar={() => setConfirmando(true)}
                salvando={salvar.isPending}
                erroSalvar={mensagemDeEscrita(salvar.error)}
              />
            )}
          </ConteudoAba>
        ))}
      </Abas>

      {proprio && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-[14px] border border-dashed border-borda px-[18px] py-3.5 motion-safe:animate-aparecer">
          <p className="m-0 flex-[1_1_360px] text-corpo-s text-tinta-600">
            Seus cortes estão diferentes do padrão. Restaurar volta todos ao padrão Agro MRO e
            recalcula o estoque.
          </p>
          {restaurarPedido && (
            <button
              type="button"
              onClick={() => setRestaurarPedido(false)}
              className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-borda bg-branco px-3.5 text-sm leading-5 font-semibold text-verde-800"
            >
              Manter os meus
            </button>
          )}
          <AcaoProtegida permissao="editar_regras">
            <button
              type="button"
              aria-busy={restaurar.isPending || undefined}
              onClick={() => {
                if (!restaurarPedido) setRestaurarPedido(true);
                else if (!restaurar.isPending) restaurar.mutate();
              }}
              className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-borda bg-branco px-4 text-sm leading-5 font-semibold text-status-ruptura-texto"
            >
              {restaurarPedido
                ? "Sim, restaurar e recalcular"
                : "Restaurar todas as regras Agro MRO"}
            </button>
          </AcaoProtegida>
          {restaurar.error && (
            <p role="alert" className="m-0 w-full text-corpo-s text-status-ruptura-texto">
              {mensagemDeEscrita(restaurar.error)}
            </p>
          )}
        </div>
      )}

      <ParaAprofundar alertas={dados.alertas_ativos} />

      <p className="m-0 text-xs leading-4 text-tinta-600">
        Classificações {dados.versao_classificacoes} · alertas {dados.versao_alertas} ·{" "}
        {proprio ? `cortes do cliente v${inteiro(dados.versao)}` : "cortes padrão Agro MRO"}
      </p>

      <Confirmacao
        aberta={confirmando}
        aoMudar={setConfirmando}
        titulo="Isso recalcula o estoque todo"
        descricao={`As ${inteiro(dados.posicoes)} posições ganham a classe nova e os parâmetros que dependem dela mudam. Casos de planejamento já validados ficam marcados para revisão.`}
        textoCancelar="Voltar"
        textoConfirmar="Salvar e recalcular"
        aoConfirmar={() => {
          setConfirmando(false);
          if (!salvar.isPending) salvar.mutate();
        }}
      />
    </>
  );
}

function Carregando() {
  return (
    <>
      <CabecalhoPagina rotulo={ROTULO} titulo={TITULO} contexto={CONTEXTO} />
      <div role="status" aria-label="Carregando as regras" className="flex flex-col gap-6">
        <Esqueleto className="h-[76px] w-full rounded-xl" />
        <Esqueleto className="h-12 w-full max-w-[900px] rounded-xl" />
        <Esqueleto className="h-[520px] w-full rounded-xl" />
      </div>
    </>
  );
}

export default function TelaRegras() {
  const consulta = useRegras();
  if (consulta.isPending) return <Carregando />;
  if (consulta.isError) {
    return (
      <>
        <CabecalhoPagina rotulo={ROTULO} titulo={TITULO} contexto={CONTEXTO} />
        <ErroDaTela
          titulo="Não foi possível carregar as regras."
          erro={consulta.error}
          aoTentarDeNovo={() => void consulta.refetch()}
        />
      </>
    );
  }
  return <Conteudo dados={consulta.data} />;
}
