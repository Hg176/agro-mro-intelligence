/**
 * Busca global da barra superior (BuscaGlobal.dc.html).
 * - Sem texto: buscas recentes (só em memória) e 3 atalhos com contagem (da API).
 * - Com texto: até 6 posições (pontuação e ordem do backend: GET /api/v1/busca) e até 3
 *   telas (lista local de rotas), com o trecho encontrado marcado.
 * - Ignora acentos; código com ou sem espaços.
 * - Teclado: ↑ ↓ navegam, Enter abre, Esc fecha (e limpa, se já estiver fechada).
 * - Combobox ARIA: role, aria-expanded, aria-controls, aria-autocomplete, aria-activedescendant.
 */
import { ArrowRight, Clock, Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";

import { useBuscaPosicoes } from "@/api/hooks";
import type { AtalhoBusca, PosicaoBusca } from "@/api/tipos";
import { SeloClasse, SeloStatus } from "@/componentes/Selos";
import { codigoEmBlocos, inteiro } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { TELAS_DA_CONTA, telasDoMenu } from "@/rotas/mapa";

import { registrarBusca, useBuscasRecentes } from "./recentes";
import { ehBuscaPorCodigo, partesComTermo, partesDoCodigo, semAcento, type Parte } from "./texto";

const ESPERA_MS = 150;
const MAX_TELAS = 3;

const ATALHOS: Record<AtalhoBusca["filtro"], { texto: string; icone: string; cor: string }> = {
  abaixo_pp: { texto: "Posições abaixo do ponto de pedido", icone: "▲", cor: "text-status-alerta" },
  saldo_negativo: { texto: "Saldo negativo", icone: "●", cor: "text-status-ruptura" },
  parados: { texto: "Parados há mais de 180 dias", icone: "■", cor: "text-status-parado" },
};

type Tela = { caminho: string; titulo: string; grupo: string; palavras: string };

const TELAS: Tela[] = [
  ...telasDoMenu()
    .filter((t) => !t.emBreve)
    .map((t) => ({ caminho: t.caminho, titulo: t.titulo, grupo: t.grupo, palavras: t.palavras })),
  ...TELAS_DA_CONTA.map((t) => ({ ...t, grupo: "Conta" })),
];

type Opcao =
  | { tipo: "recente"; chave: string; texto: string }
  | { tipo: "atalho"; chave: string; atalho: AtalhoBusca }
  | { tipo: "posicao"; chave: string; posicao: PosicaoBusca }
  | { tipo: "tela"; chave: string; tela: Tela };

function Marcado({ partes }: { partes: Parte[] }) {
  return (
    <>
      {partes.map((p, i) =>
        p.marcado ? (
          <mark
            key={i}
            className="rounded-[3px] bg-ouro-100 text-verde-950 shadow-[0_0_0_1px_var(--ouro-300)]"
          >
            {p.texto}
          </mark>
        ) : (
          <span key={i}>{p.texto}</span>
        ),
      )}
    </>
  );
}

function Grupo({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <div role="group" aria-labelledby={id}>
      <div
        id={id}
        role="presentation"
        className="px-4 pt-3 pb-1.5 text-rotulo uppercase text-tinta-500"
      >
        {titulo}
      </div>
      {children}
    </div>
  );
}

export function BuscaGlobal() {
  const navegar = useNavigate();
  const recentes = useBuscasRecentes();
  const base = useId();
  const idLista = `${base}-lista`;
  const idOpcao = (i: number) => `${base}-op-${i}`;

  const [q, setQ] = useState("");
  const [qEnviada, setQEnviada] = useState("");
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const fechar = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setQEnviada(q.trim()), ESPERA_MS);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(
    () => () => {
      if (fechar.current) clearTimeout(fechar.current);
    },
    [],
  );

  const consulta = useBuscaPosicoes(qEnviada);
  const termo = q.trim();
  const temTexto = termo.length > 0;
  const porCodigo = ehBuscaPorCodigo(termo);
  // Resultado só vale se for da busca atual (evita mostrar a lista do termo anterior).
  const resultado = consulta.data && qEnviada === termo ? consulta.data : null;

  const telas = useMemo(() => {
    if (!temTexto || porCodigo) return [];
    const nq = semAcento(termo);
    return TELAS.filter((t) => semAcento(`${t.titulo} ${t.palavras}`).includes(nq)).slice(
      0,
      MAX_TELAS,
    );
  }, [temTexto, porCodigo, termo]);

  const opcoes: Opcao[] = useMemo(() => {
    if (!temTexto) {
      return [
        ...recentes.map((r): Opcao => ({ tipo: "recente", chave: `r-${r}`, texto: r })),
        ...(consulta.data?.atalhos ?? []).map((a): Opcao => ({
          tipo: "atalho",
          chave: `a-${a.filtro}`,
          atalho: a,
        })),
      ];
    }
    return [
      ...(resultado?.posicoes ?? []).map((p): Opcao => ({
        tipo: "posicao",
        chave: `p-${p.material_id}`,
        posicao: p,
      })),
      ...telas.map((t): Opcao => ({ tipo: "tela", chave: `t-${t.caminho}`, tela: t })),
    ];
  }, [temTexto, recentes, consulta.data, resultado, telas]);

  const total = opcoes.length;
  const indiceAtivo = total ? Math.min(ativo, total - 1) : -1;
  const carregandoTexto = temTexto && resultado === null;
  const nada = temTexto && !carregandoTexto && total === 0;

  const irPara = (destino: string, lembrar: string | null) => {
    if (lembrar) registrarBusca(lembrar);
    setAberto(false);
    void navegar(destino);
  };

  const escolher = (opcao: Opcao) => {
    switch (opcao.tipo) {
      case "recente":
        setQ(opcao.texto);
        setAtivo(0);
        return;
      case "atalho":
        irPara(`/app/materiais?filtro=${opcao.atalho.filtro}`, null);
        return;
      case "posicao":
        irPara(
          `/app/materiais?q=${encodeURIComponent(opcao.posicao.code)}`,
          opcao.posicao.short_description,
        );
        return;
      case "tela":
        irPara(opcao.tela.caminho, opcao.tela.titulo);
    }
  };

  const verTudo = () => irPara(`/app/materiais?q=${encodeURIComponent(termo)}`, termo);

  const tecla = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAberto(true);
      setAtivo(total ? (indiceAtivo + 1) % total : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAberto(true);
      setAtivo(total ? (indiceAtivo - 1 + total) % total : 0);
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (termo && aberto) setAberto(false);
      else {
        setQ("");
        setAberto(false);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opcao = indiceAtivo >= 0 ? opcoes[indiceAtivo] : undefined;
      if (aberto && opcao) escolher(opcao);
      else if (termo) verTudo();
    }
  };

  const linha = (i: number) =>
    cn(
      "flex min-h-12 w-full cursor-pointer items-center gap-3 px-4 py-2 text-left text-sm leading-5 font-medium text-tinta-900",
      "transition-colors motion-reduce:transition-none",
      i === indiceAtivo && "bg-verde-50 shadow-[inset_3px_0_0_var(--verde-700)]",
    );

  const opcaoProps = (i: number, opcao: Opcao) => ({
    id: idOpcao(i),
    role: "option" as const,
    "aria-selected": i === indiceAtivo,
    className: linha(i),
    onMouseEnter: () => setAtivo(i),
    onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
    onClick: () => escolher(opcao),
  });

  let i = -1;
  const proximo = () => ++i;

  const posicoes = opcoes.filter((o) => o.tipo === "posicao");
  const totalPosicoes = resultado?.total ?? 0;
  const rotuloPosicoes =
    totalPosicoes > posicoes.length
      ? `${inteiro(posicoes.length)} de ${inteiro(totalPosicoes)}`
      : inteiro(posicoes.length);

  return (
    <div className="relative w-full text-corpo-m text-tinta-900">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-[15px] left-4 size-[18px] text-tinta-500"
      />
      <input
        type="search"
        role="combobox"
        aria-label="Buscar material ou tela"
        aria-expanded={aberto}
        aria-controls={idLista}
        aria-autocomplete="list"
        aria-activedescendant={aberto && indiceAtivo >= 0 ? idOpcao(indiceAtivo) : undefined}
        autoComplete="off"
        value={q}
        placeholder="Buscar material por código ou descrição"
        onChange={(e) => {
          setQ(e.target.value);
          setAtivo(0);
          setAberto(true);
        }}
        onFocus={() => {
          if (fechar.current) clearTimeout(fechar.current);
          setAberto(true);
          setAtivo(0);
        }}
        onBlur={() => {
          fechar.current = setTimeout(() => setAberto(false), 140);
        }}
        onKeyDown={tecla}
        className={cn(
          "h-12 w-full rounded-md border bg-branco pl-11 text-corpo-m text-tinta-900 placeholder:text-tinta-300",
          temTexto ? "pr-11" : "pr-3",
          "transition-[border-color,box-shadow] motion-reduce:transition-none [&::-webkit-search-cancel-button]:hidden",
          "focus-visible:outline-none",
          aberto ? "border-verde-700 shadow-foco" : "border-borda",
        )}
      />
      {temTexto && (
        <button
          type="button"
          aria-label="Limpar busca"
          onMouseDown={(e) => {
            e.preventDefault();
            setQ("");
            setAtivo(0);
          }}
          onClick={() => setQ("")}
          className="absolute top-1.5 right-1.5 grid size-9 cursor-pointer place-items-center rounded-sm text-tinta-500 hover:text-tinta-900"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      )}

      {aberto && (
        // O painel não é um controle: o onMouseDown só evita que o campo perca o foco
        // ao clicar numa opção (o teclado continua no combobox).
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div
          className={cn(
            "absolute top-14 left-0 z-40 max-h-[480px] w-[max(100%,520px)] overflow-auto rounded-[14px] border border-borda bg-branco",
            "origin-top-left motion-safe:animate-entrada",
          )}
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).tagName !== "INPUT") e.preventDefault();
          }}
        >
          <div id={idLista} role="listbox" aria-label="Resultados da busca">
            {!temTexto && recentes.length > 0 && (
              <Grupo id={`${base}-g-rec`} titulo="Buscas recentes">
                {opcoes
                  .filter((o) => o.tipo === "recente")
                  .map((o) => {
                    const n = proximo();
                    return (
                      <div key={o.chave} {...opcaoProps(n, o)}>
                        <Clock aria-hidden="true" className="size-4 shrink-0 text-tinta-500" />
                        <span className="flex-1">{o.tipo === "recente" && o.texto}</span>
                      </div>
                    );
                  })}
              </Grupo>
            )}

            {!temTexto && (
              <Grupo id={`${base}-g-ata`} titulo="Atalhos">
                {opcoes
                  .filter((o) => o.tipo === "atalho")
                  .map((o) => {
                    const n = proximo();
                    if (o.tipo !== "atalho") return null;
                    const a = ATALHOS[o.atalho.filtro];
                    return (
                      <div key={o.chave} {...opcaoProps(n, o)}>
                        <span
                          aria-hidden="true"
                          className={cn("w-4 text-center text-[11px]", a.cor)}
                        >
                          {a.icone}
                        </span>
                        <span className="flex-1">{a.texto}</span>
                        <span className="text-xs leading-4 font-semibold tabular-nums text-tinta-600">
                          {inteiro(o.atalho.posicoes)}
                        </span>
                      </div>
                    );
                  })}
              </Grupo>
            )}

            {temTexto && posicoes.length > 0 && (
              <Grupo id={`${base}-g-pos`} titulo={`Posições · ${rotuloPosicoes}`}>
                {posicoes.map((o) => {
                  const n = proximo();
                  if (o.tipo !== "posicao") return null;
                  const p = o.posicao;
                  return (
                    <div key={o.chave} {...opcaoProps(n, o)}>
                      <SeloClasse classe={p.classe} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm leading-5 font-semibold">
                          <Marcado
                            partes={
                              porCodigo
                                ? [{ texto: p.short_description, marcado: false }]
                                : partesComTermo(p.short_description, termo)
                            }
                          />
                        </span>
                        <span className="block text-xs leading-4 font-medium tabular-nums text-tinta-500">
                          <Marcado partes={partesDoCodigo(codigoEmBlocos(p.code), termo)} /> ·{" "}
                          {p.location_name}
                        </span>
                      </span>
                      <SeloStatus
                        situacao={p.situacao}
                        texto={p.situacao === "parado" ? "Parado" : undefined}
                      />
                    </div>
                  );
                })}
              </Grupo>
            )}

            {temTexto && telas.length > 0 && (
              <Grupo id={`${base}-g-telas`} titulo="Ir para">
                {opcoes
                  .filter((o) => o.tipo === "tela")
                  .map((o) => {
                    const n = proximo();
                    if (o.tipo !== "tela") return null;
                    return (
                      <div key={o.chave} {...opcaoProps(n, o)}>
                        <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-verde-700" />
                        <span className="flex-1">
                          <Marcado partes={partesComTermo(o.tela.titulo, termo)} />
                        </span>
                        <span className="text-xs leading-4 text-tinta-500">{o.tela.grupo}</span>
                      </div>
                    );
                  })}
              </Grupo>
            )}
          </div>

          {carregandoTexto && total === 0 && (
            <p role="status" className="px-4 py-5 text-center text-corpo-s text-tinta-500">
              Buscando…
            </p>
          )}

          {nada && (
            <div className="px-4 py-5 text-center" role="status">
              <p className="font-semibold">Nada encontrado para “{termo}”</p>
              <p className="mt-1 text-corpo-s text-tinta-500">
                Confira o código (com ou sem espaços, tanto faz) ou busque por parte da descrição.
              </p>
              <button
                type="button"
                onClick={() => irPara("/app/materiais", null)}
                className="mt-2.5 inline-flex min-h-11 cursor-pointer items-center text-sm leading-5 font-semibold text-verde-700"
              >
                Cadastrar um material novo →
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-borda bg-creme-100 px-4 py-2.5 text-xs leading-4 font-medium text-tinta-600">
            <span>
              <b className="font-semibold">↑ ↓</b> navegar · <b className="font-semibold">Enter</b>{" "}
              abrir · <b className="font-semibold">Esc</b> fechar
            </span>
            {temTexto && (
              <button
                type="button"
                onClick={verTudo}
                className="inline-flex min-h-8 cursor-pointer items-center text-[13px] leading-[18px] font-semibold text-verde-700"
              >
                Ver tudo em Materiais →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
