/**
 * Materiais (Materiais.dc.html, MateriaisCarregando.dc.html, MateriaisVazio.dc.html), F1-8.
 * Catálogo particular em cartões, busca e filtros na URL, contagens da API, paginação de 100.
 * Estados: carregando, erro de métricas (catálogo continua), sem resultado e catálogo vazio.
 * Ações de escrita/exportação com AcaoProtegida (importar / exportar_excel).
 */
import { ChevronLeft, ChevronRight, Package, Plus, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

import { useMateriais } from "@/api/hooks";
import { baixarExcelMateriais } from "@/api/materiais";
import type { PaginaMateriais } from "@/api/tipos";
import { BotaoBaixarExcel } from "@/componentes/BotaoBaixarExcel";
import { Botao, variantesBotao } from "@/componentes/Botao";
import { CabecalhoPagina } from "@/componentes/CabecalhoPagina";
import { ChipFiltro } from "@/componentes/ChipFiltro";
import { ErroDaTela } from "@/componentes/ErroDaTela";
import { Esqueleto } from "@/componentes/Esqueleto";
import { FaixaConclusao, fraseDaConclusao } from "@/componentes/FaixaConclusao";
import { inteiro } from "@/lib/formato";
import { AcaoProtegida } from "@/sessao/AcaoProtegida";
import { SINAIS } from "@/telas/visao-geral/textos";

import { CartaoPosicao } from "./CartaoPosicao";
import { GavetaNovoMaterial } from "./GavetaNovoMaterial";
import { useParametrosMateriais } from "./parametros";
import { CHIPS, FRASES_MATERIAIS } from "./textos";

const ATRASO_BUSCA_MS = 300;

function Cabecalho({
  dados,
  novoPrincipal,
  aoNovo,
  baixar,
}: {
  dados: PaginaMateriais | undefined;
  novoPrincipal: boolean;
  aoNovo: () => void;
  baixar: () => ReturnType<typeof baixarExcelMateriais>;
}) {
  const temCatalogo = dados?.conclusao.tipo === "catalogo_com_posicoes";
  return (
    <CabecalhoPagina
      rotulo="Catálogo particular"
      titulo="Materiais"
      contexto="Cadastre, consulte e acompanhe cada posição (material + local) do seu estoque."
      acoes={
        <>
          {temCatalogo && dados && (
            <BotaoBaixarExcel
              baixar={baixar}
              texto={`Baixar Excel (${inteiro(dados.total)} posições)`}
            />
          )}
          <AcaoProtegida permissao="importar">
            <Botao
              size="grande"
              variant={novoPrincipal ? "default" : "secundario"}
              onClick={aoNovo}
            >
              <Plus aria-hidden="true" />
              Novo material
            </Botao>
          </AcaoProtegida>
        </>
      }
    />
  );
}

function Carregando() {
  return (
    <>
      <p role="status" className="text-corpo-s text-tinta-500">
        Consultando métricas aprovadas…
      </p>
      <div
        aria-hidden="true"
        className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5"
      >
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-borda bg-branco">
            <Esqueleto className="h-32 rounded-none" />
            <div className="flex flex-col gap-2.5 px-5 py-[18px]">
              <Esqueleto className="h-2.5 w-[45%]" />
              <Esqueleto className="h-4 w-[85%]" />
              <Esqueleto className="h-3 w-[55%]" />
              <Esqueleto className="mt-1.5 h-[30px] w-[40%]" />
              <Esqueleto className="mt-1.5 h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function CatalogoVazio() {
  return (
    <section
      aria-labelledby="t-vazio"
      className="flex flex-col items-center gap-3 rounded-xl border border-borda bg-branco px-8 py-14 text-center motion-safe:animate-entrada"
    >
      <span className="grid size-[72px] place-items-center rounded-[18px] bg-verde-50">
        <Package aria-hidden="true" className="size-[34px] text-verde-700" strokeWidth={1.8} />
      </span>
      <h2 id="t-vazio" className="mt-2 font-display text-titulo-m text-tinta-900">
        Nenhum material ainda
      </h2>
      <p className="max-w-[480px] text-corpo-m text-tinta-500">
        Importe seus dados mestres do ERP de uma vez, ou cadastre o primeiro material à mão para
        testar.
      </p>
      <Link
        to="/app/importar"
        className={variantesBotao({ size: "grande", className: "mt-2 min-h-14 px-7" })}
      >
        Importar dados mestres
      </Link>
    </section>
  );
}

/** Campo de busca: digita à vontade, a URL muda depois de uma pausa curta. */
function BuscaMateriais({ valor, aoBuscar }: { valor: string; aoBuscar: (q: string) => void }) {
  const [texto, setTexto] = useState(valor);
  const ultimo = useRef(valor);

  // Link novo (ex.: busca global) troca o texto do campo.
  useEffect(() => {
    if (valor !== ultimo.current) {
      ultimo.current = valor;
      setTexto(valor);
    }
  }, [valor]);

  useEffect(() => {
    if (texto === ultimo.current) return;
    const relogio = setTimeout(() => {
      ultimo.current = texto;
      aoBuscar(texto);
    }, ATRASO_BUSCA_MS);
    return () => clearTimeout(relogio);
  }, [texto, aoBuscar]);

  return (
    <div className="relative max-w-[560px] flex-[1_1_360px]">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-[17px] left-4 size-[18px] text-tinta-500"
      />
      <input
        type="search"
        aria-label="Buscar posições"
        placeholder="Buscar por código, local ou descrição"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        className="h-[52px] w-full rounded-md border border-borda bg-branco py-3 pr-4 pl-11 text-corpo-m text-tinta-900 placeholder:text-tinta-300 focus-visible:border-verde-700 focus-visible:shadow-foco focus-visible:outline-none"
      />
    </div>
  );
}

export default function TelaMateriais() {
  const { parametros, mudar, limpar } = useParametrosMateriais();
  const consulta = useMateriais(parametros);
  const [gavetaAberta, setGavetaAberta] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const dados = consulta.data;

  const vazio = dados?.conclusao.tipo === "catalogo_vazio";
  const semMetricas = dados?.metricas.estado === "indisponivel";
  const filtrando = Boolean(
    parametros.q || parametros.filtro || parametros.abc || parametros.pqr || parametros.sinal,
  );
  const baixar = () => baixarExcelMateriais(parametros);

  const cabecalho = (
    <Cabecalho
      dados={dados}
      novoPrincipal={!vazio}
      aoNovo={() => setGavetaAberta(true)}
      baixar={baixar}
    />
  );
  const gaveta = (
    <GavetaNovoMaterial
      aberta={gavetaAberta}
      aoMudar={setGavetaAberta}
      aoSalvar={(m) => setAviso(`Material ${m.code} salvo.`)}
    />
  );

  if (consulta.isPending) {
    return (
      <>
        {cabecalho}
        <Carregando />
      </>
    );
  }
  if (consulta.isError) {
    return (
      <>
        {cabecalho}
        <ErroDaTela
          titulo="Não foi possível carregar o catálogo."
          erro={consulta.error}
          aoTentarDeNovo={() => void consulta.refetch()}
        />
        {gaveta}
      </>
    );
  }

  const d = consulta.data;
  const extras: { chave: "abc" | "pqr" | "sinal"; rotulo: string }[] = [];
  if (parametros.abc) extras.push({ chave: "abc", rotulo: `ABC ${parametros.abc}` });
  if (parametros.pqr) extras.push({ chave: "pqr", rotulo: `PQR ${parametros.pqr}` });
  if (parametros.sinal) extras.push({ chave: "sinal", rotulo: SINAIS[parametros.sinal].texto });

  const contagem = !filtrando
    ? `${inteiro(d.total)} posições · página ${inteiro(d.pagina)} de ${inteiro(d.paginas)}`
    : parametros.q
      ? `${inteiro(d.total)} de ${inteiro(d.total_catalogo)} posições`
      : `${inteiro(d.total)} posições no filtro`;

  return (
    <>
      {cabecalho}

      <FaixaConclusao frase={fraseDaConclusao(d.conclusao, FRASES_MATERIAIS)} />

      {aviso && (
        <p
          role="status"
          className="rounded-[14px] bg-verde-50 px-5 py-3.5 text-corpo-m text-verde-800"
        >
          {aviso}
        </p>
      )}

      {!vazio && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <BuscaMateriais
              valor={parametros.q}
              aoBuscar={(q) => mudar({ q }, { substituir: true })}
            />
            <span
              role="status"
              className="text-sm leading-5 font-medium tabular-nums text-tinta-600"
            >
              {contagem}
            </span>
          </div>

          <div
            role="group"
            aria-label="Filtros prontos"
            className="flex flex-wrap items-center gap-2"
          >
            {d.filtros.map((f) => {
              const chip = CHIPS[f.id];
              const ativo = parametros.filtro === f.id;
              return (
                <ChipFiltro
                  key={f.id}
                  rotulo={chip.rotulo}
                  contagem={f.contagem}
                  icone={<span className={ativo ? undefined : chip.cor}>{chip.icone}</span>}
                  ativo={ativo}
                  aoAlternar={() => mudar({ filtro: ativo ? null : f.id })}
                />
              );
            })}
            {extras.map((x) => (
              <ChipFiltro
                key={x.chave}
                rotulo={x.rotulo}
                ativo
                aoAlternar={() => mudar({ [x.chave]: null })}
                aoRemover={() => mudar({ [x.chave]: null })}
              />
            ))}
            {filtrando && (
              <button
                type="button"
                onClick={limpar}
                className="min-h-11 cursor-pointer border-0 bg-transparent px-2.5 text-sm leading-5 font-semibold text-verde-700 underline hover:text-verde-800"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      )}

      {semMetricas && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-[14px] bg-status-alerta-bg px-5 py-3.5"
        >
          <span aria-hidden="true" className="text-sm text-status-alerta">
            ▲
          </span>
          <p className="flex-[1_1_420px] text-corpo-m text-tinta-900">
            <b className="font-semibold">Métricas indisponíveis agora.</b> O catálogo continua
            consultável; saldo e classe voltam assim que o cálculo responder.
          </p>
          <Botao variant="secundario" onClick={() => void consulta.refetch()}>
            Tentar de novo
          </Botao>
        </div>
      )}

      {vazio && <CatalogoVazio />}

      {!vazio && d.itens.length === 0 && (
        <section className="rounded-xl border border-dashed border-verde-300 bg-branco px-8 py-10 text-center motion-safe:animate-entrada">
          <h2 className="text-titulo-s text-tinta-900">Nenhuma posição encontrada</h2>
          <p className="mx-auto mt-1.5 max-w-[520px] text-corpo-m text-tinta-500">
            Nada bate com a busca e os filtros atuais. Confira o código (com ou sem espaços, tanto
            faz) ou tire um filtro.
          </p>
          <Botao variant="secundario" className="mt-4" onClick={limpar}>
            Limpar busca e filtros
          </Botao>
        </section>
      )}

      {!vazio && d.itens.length > 0 && (
        <>
          <h2 className="sr-only">Posições do catálogo</h2>
          <ul
            aria-label="Posições"
            className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5 p-0"
          >
            {d.itens.map((p, i) => (
              <li key={`${p.code}@${p.location}`} className="flex">
                <CartaoPosicao posicao={p} semMetricas={semMetricas} ordem={i} />
              </li>
            ))}
          </ul>

          <nav
            aria-label="Paginação"
            className="flex flex-wrap items-center justify-between gap-3 pt-1"
          >
            <Botao
              variant="secundario"
              disabled={d.pagina <= 1}
              onClick={() => mudar({ pagina: d.pagina - 1 })}
            >
              <ChevronLeft aria-hidden="true" />
              Página anterior
            </Botao>
            <span className="text-corpo-s tabular-nums text-tinta-600">
              {d.paginas > 1
                ? `Página ${inteiro(d.pagina)} de ${inteiro(d.paginas)} · ${inteiro(d.limite)} posições por página`
                : `Mostrando ${inteiro(d.itens.length)} posições`}
            </span>
            <Botao
              variant="secundario"
              disabled={d.pagina >= d.paginas}
              onClick={() => mudar({ pagina: d.pagina + 1 })}
            >
              Próxima página
              <ChevronRight aria-hidden="true" />
            </Botao>
          </nav>
        </>
      )}

      {gaveta}
    </>
  );
}
