/**
 * Visão geral (VisaoGeral.dc.html), F1-7. Tudo vem de GET /api/v1/visao-geral: o front só
 * formata e escolhe a frase pelo código da conclusão. Um botão principal: "Ver os 5 itens A".
 */
import { Link } from "react-router";

import { useVisaoGeral } from "@/api/hooks";
import type { Kpi, VisaoGeral } from "@/api/tipos";
import { baixarExcelVisaoGeral } from "@/api/visaoGeral";
import { BotaoBaixarExcel } from "@/componentes/BotaoBaixarExcel";
import { variantesBotao } from "@/componentes/Botao";
import { CabecalhoPagina } from "@/componentes/CabecalhoPagina";
import { CartaoKpi, GrupoKpi } from "@/componentes/CartaoKpi";
import { ErroDaTela } from "@/componentes/ErroDaTela";
import { Esqueleto } from "@/componentes/Esqueleto";
import { FaixaConclusao, fraseDaConclusao } from "@/componentes/FaixaConclusao";
import { dataDoInstante, inteiro, moedaCompacta, percentual, periodo } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { linkMateriais } from "@/rotas/links";

import { Composicao } from "./Composicao";
import { Implantacao } from "./Implantacao";
import { MatrizConsumo } from "./MatrizConsumo";
import { ParaAprofundar } from "./ParaAprofundar";
import { Prioridades } from "./Prioridades";
import { Sinais } from "./Sinais";
import { FRASES_VISAO_GERAL } from "./textos";

const ROTULO = "Painel de controle";
const TITULO = "Visão geral do estoque";

/** Valor do KPI só quando a API diz que está disponível; senão o motivo aparece no cartão. */
function valorDoKpi<V extends Record<string, unknown>>(
  kpi: Kpi<V>,
  formatar: (valores: V) => string,
): { valor: string | null; motivo: string | null } {
  return kpi.estado === "disponivel"
    ? { valor: formatar(kpi.valores), motivo: null }
    : { valor: null, motivo: kpi.motivo };
}

function Kpis({ kpis }: { kpis: VisaoGeral["kpis"] }) {
  const v = kpis;
  return (
    <div className="flex flex-wrap gap-5 motion-safe:animate-aparecer">
      <GrupoKpi titulo="Dinheiro" className="flex-[2_1_420px]">
        <CartaoKpi
          rotulo="Valor em estoque"
          {...valorDoKpi(v.valor_estoque, (x) => moedaCompacta(x.valor))}
          apoio={
            v.valor_estoque.estado === "disponivel"
              ? `${inteiro(v.valor_estoque.valores.posicoes_com_preco)} posições com preço`
              : null
          }
          link={{ texto: "Ver composição →", para: "#composicao" }}
        />
        <CartaoKpi
          rotulo="Parado há +180 dias"
          tom="parado"
          {...valorDoKpi(v.parado_180_dias, (x) => moedaCompacta(x.valor))}
          apoio={
            v.parado_180_dias.estado === "disponivel"
              ? `${inteiro(v.parado_180_dias.valores.itens)} itens · ${percentual(v.parado_180_dias.valores.percentual_valor)} do valor`
              : null
          }
          link={{ texto: "Ver itens →", para: linkMateriais({ filtro: "parados" }) }}
        />
      </GrupoKpi>
      <GrupoKpi titulo="Saúde do estoque" className="flex-[2_1_420px]">
        <CartaoKpi
          rotulo="Abaixo do ponto de pedido"
          tom="alerta"
          {...valorDoKpi(v.abaixo_pp, (x) => inteiro(x.posicoes))}
          apoio={
            v.abaixo_pp.estado === "disponivel"
              ? `${inteiro(v.abaixo_pp.valores.classe_a)} são classe A`
              : null
          }
          link={{ texto: "Ver posições →", para: linkMateriais({ filtro: "abaixo_pp" }) }}
        />
        <CartaoKpi
          rotulo="Saldo negativo"
          tom="ruptura"
          {...valorDoKpi(v.saldo_negativo, (x) => inteiro(x.posicoes))}
          apoio={v.saldo_negativo.estado === "disponivel" ? "Conferir lançamentos no ERP" : null}
          link={{ texto: "Conferir →", para: linkMateriais({ filtro: "saldo_negativo" }) }}
        />
      </GrupoKpi>
      <GrupoKpi titulo="Movimento no período" colunas={1} className="flex-[1_1_220px]">
        <CartaoKpi
          rotulo="Entradas · saídas"
          {...valorDoKpi(v.movimento, (x) => `${inteiro(x.entradas)} · ${inteiro(x.saidas)}`)}
          apoio={
            v.movimento.estado === "disponivel" && v.movimento.valores.periodo
              ? periodo(v.movimento.valores.periodo)
              : null
          }
          emBreve="Ver movimentos"
        />
      </GrupoKpi>
    </div>
  );
}

function Conteudo({ dados }: { dados: VisaoGeral }) {
  const { contexto, conclusao } = dados;
  const itensA =
    conclusao?.tipo === "parado_e_abaixo_pp" ? conclusao.valores.abaixo_pp_classe_a : null;

  return (
    <>
      <CabecalhoPagina
        rotulo={ROTULO}
        titulo={TITULO}
        contexto={`${inteiro(contexto.posicoes)} posições (material + local) em ${inteiro(contexto.locais)} locais · leitura de ${dataDoInstante(contexto.leitura_em)}`}
        acoes={
          <>
            <BotaoBaixarExcel baixar={baixarExcelVisaoGeral} />
            <Link
              to="/app/planejamento"
              className={variantesBotao({ variant: "secundario", size: "grande" })}
            >
              Abrir meu plano
            </Link>
          </>
        }
      />

      {conclusao && (
        <FaixaConclusao
          frase={fraseDaConclusao(conclusao, FRASES_VISAO_GERAL)}
          acao={
            conclusao.tipo === "parado_e_abaixo_pp" ? (
              <Link
                to={linkMateriais({ filtro: "abaixo_pp", abc: "A" })}
                className={cn(
                  variantesBotao({ variant: "default", size: "grande" }),
                  "border border-verde-300/50",
                )}
              >
                {itensA === null ? "Ver os itens A" : `Ver os ${inteiro(itensA)} itens A`}
              </Link>
            ) : null
          }
        />
      )}

      <Implantacao implantacao={dados.implantacao} />
      <Kpis kpis={dados.kpis} />

      <div className="flex flex-wrap items-stretch gap-5">
        <Prioridades prioridades={dados.prioridades} />
        <Sinais sinais={dados.sinais} />
      </div>

      <div className="flex flex-wrap gap-5">
        <MatrizConsumo matriz={dados.matriz_abc_pqr} />
        <Composicao composicao={dados.composicao} />
      </div>

      <ParaAprofundar memoria={dados.memoria} />
    </>
  );
}

function Carregando() {
  return (
    <>
      <CabecalhoPagina
        rotulo={ROTULO}
        titulo={TITULO}
        contexto={<Esqueleto className="h-5 w-96" />}
      />
      <div role="status" aria-label="Carregando a Visão geral" className="flex flex-col gap-7">
        <Esqueleto className="h-[100px] w-full rounded-xl" />
        <Esqueleto className="h-14 w-full rounded-[14px]" />
        <div className="grid grid-cols-5 gap-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Esqueleto key={i} className="h-36 rounded-xl" />
          ))}
        </div>
        <div className="flex gap-5">
          <Esqueleto className="h-[420px] flex-[2] rounded-xl" />
          <Esqueleto className="h-[420px] flex-1 rounded-xl" />
        </div>
      </div>
    </>
  );
}

export default function TelaVisaoGeral() {
  const consulta = useVisaoGeral();
  if (consulta.isPending) return <Carregando />;
  if (consulta.isError) {
    return (
      <>
        <CabecalhoPagina rotulo={ROTULO} titulo={TITULO} />
        <ErroDaTela
          titulo="Não foi possível carregar a Visão geral."
          erro={consulta.error}
          aoTentarDeNovo={() => void consulta.refetch()}
        />
      </>
    );
  }
  return <Conteudo dados={consulta.data} />;
}
