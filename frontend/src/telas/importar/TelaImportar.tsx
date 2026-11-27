/**
 * Importar dados (ImportarDados.dc.html), F1-9. GET /api/v1/importacao traz a conclusão, as
 * abas disponíveis e o histórico. Só "Dados mestres" tem fluxo; Movimentos e Pedidos em
 * aberto mostram "Em breve" (pendência do backend). Um botão principal por passo.
 */
import { useState } from "react";

import { usePainelImportacao } from "@/api/hooks";
import { baixarPlanilhaModelo } from "@/api/importacao";
import type { DatasetImportacao, PainelImportacao } from "@/api/tipos";
import { Aba, Abas, ConteudoAba, ListaAbas } from "@/componentes/Abas";
import { BotaoBaixarExcel } from "@/componentes/BotaoBaixarExcel";
import { CabecalhoPagina } from "@/componentes/CabecalhoPagina";
import { ErroDaTela } from "@/componentes/ErroDaTela";
import { Esqueleto } from "@/componentes/Esqueleto";
import { FaixaConclusao, fraseDaConclusao } from "@/componentes/FaixaConclusao";
import { cn } from "@/lib/utils";

import { FluxoDadosMestres } from "./FluxoDadosMestres";
import { Historico } from "./Historico";
import { FRASES_IMPORTACAO, NOME_DATASET, ORDEM_DATASET } from "./textos";

const ROTULO = "Dados";
const TITULO = "Importar dados";
const CONTEXTO =
  "Envie a planilha do jeito que o ERP exporta. Nada é gravado antes da sua confirmação.";

function Cabecalho() {
  return (
    <CabecalhoPagina
      rotulo={ROTULO}
      titulo={TITULO}
      contexto={CONTEXTO}
      acoes={
        <BotaoBaixarExcel
          baixar={() => baixarPlanilhaModelo("master_data")}
          texto="Baixar planilha modelo"
          permissao={null}
        />
      }
    />
  );
}

function EmBreve({ dataset }: { dataset: DatasetImportacao }) {
  return (
    <div className="flex flex-col items-start gap-2 px-8 py-10">
      <span className="rounded-pill bg-creme-100 px-3 py-1 text-rotulo uppercase text-tinta-600">
        Em breve
      </span>
      <p className="text-corpo-m text-tinta-600">
        A carga de {NOME_DATASET[dataset].toLowerCase()} ainda não está disponível nesta tela.
        Comece pelos dados mestres.
      </p>
    </div>
  );
}

function Conteudo({ painel }: { painel: PainelImportacao }) {
  const [aba, setAba] = useState<DatasetImportacao>("master_data");
  const disponivel = (d: DatasetImportacao) =>
    painel.abas.find((a) => a.dataset === d)?.disponivel ?? false;

  return (
    <>
      <Cabecalho />
      {painel.conclusao && (
        <FaixaConclusao frase={fraseDaConclusao(painel.conclusao, FRASES_IMPORTACAO)} />
      )}

      <section aria-labelledby="t-carga" className="rounded-xl border border-borda bg-branco">
        <h2 id="t-carga" className="sr-only">
          Tipo de carga
        </h2>
        <Abas value={aba} onValueChange={(v) => setAba(v as DatasetImportacao)} className="gap-0">
          <ListaAbas
            aria-label="Tipo de carga"
            className="flex w-full gap-1 rounded-none border-b border-borda bg-transparent p-0 px-4"
          >
            {ORDEM_DATASET.map((d, i) => (
              <Aba
                key={d}
                value={d}
                className={cn(
                  "-mb-px min-h-[60px] gap-2.5 rounded-none border-b-[3px] border-transparent px-4 text-[15px]",
                  "data-[state=active]:border-verde-700 data-[state=active]:bg-transparent",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-6 place-items-center rounded-full text-xs",
                    aba === d ? "bg-verde-700 text-branco" : "border-[1.5px] border-borda",
                  )}
                >
                  {i + 1}
                </span>
                {NOME_DATASET[d]}
                {d === "master_data" && (
                  <span className="rounded-pill bg-ouro-100 px-2 py-0.5 text-[11px] leading-4 font-semibold text-ouro-700">
                    Comece por aqui
                  </span>
                )}
                {!disponivel(d) && <span className="sr-only"> (em breve)</span>}
              </Aba>
            ))}
          </ListaAbas>
          {ORDEM_DATASET.map((d) => (
            <ConteudoAba key={d} value={d}>
              {d === "master_data" && disponivel(d) ? (
                <FluxoDadosMestres
                  posicoesAtuais={painel.posicoes_atuais}
                  aoImportarMovimentos={() => setAba("movements")}
                />
              ) : (
                <EmBreve dataset={d} />
              )}
            </ConteudoAba>
          ))}
        </Abas>
      </section>

      <Historico cargas={painel.historico} />
    </>
  );
}

function Carregando() {
  return (
    <>
      <Cabecalho />
      <div role="status" aria-label="Carregando a importação" className="flex flex-col gap-7">
        <Esqueleto className="h-[76px] w-full rounded-xl" />
        <Esqueleto className="h-[520px] w-full rounded-xl" />
        <Esqueleto className="h-56 w-full rounded-xl" />
      </div>
    </>
  );
}

export default function TelaImportar() {
  const consulta = usePainelImportacao();
  if (consulta.isPending) return <Carregando />;
  if (consulta.isError) {
    return (
      <>
        <Cabecalho />
        <ErroDaTela
          titulo="Não foi possível carregar a importação."
          erro={consulta.error}
          aoTentarDeNovo={() => void consulta.refetch()}
        />
      </>
    );
  }
  return <Conteudo painel={consulta.data} />;
}
