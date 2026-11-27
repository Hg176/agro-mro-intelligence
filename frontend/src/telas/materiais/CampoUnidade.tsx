/**
 * "Unidade de medida" com busca (Materiais.dc.html): combobox ARIA 1.2 que filtra por nome,
 * sigla ou categoria, ignorando acentos. A lista vem de GET /api/v1/unidades (rota a criar
 * no backend; hoje só o mock). O valor gravado é a sigla.
 * Teclado: ↓ ↑ navegam, Enter escolhe, Esc fecha a lista (sem fechar a janela).
 * Ao sair do campo sem escolher, o texto volta para a unidade escolhida.
 */
import { useId, useMemo, useRef, useState } from "react";

import type { UnidadeMedida } from "@/api/tipos";
import { semAcento } from "@/componentes/busca/texto";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
  valor: string;
  aoMudar: (sigla: string) => void;
  unidades: UnidadeMedida[] | undefined;
  carregando: boolean;
  /** Falha ao buscar a lista (mensagem curta, ao lado do campo). */
  erro: boolean;
};

const rotuloDa = (u: UnidadeMedida) => `${u.nome} (${u.sigla})`;

export function CampoUnidade({ valor, aoMudar, unidades, carregando, erro }: Props) {
  const base = useId();
  const idCampo = `${base}-campo`;
  const idLista = `${base}-lista`;
  const idAviso = `${base}-aviso`;
  const idOpcao = (i: number) => `${base}-op-${i}`;

  const escolhida = unidades?.find((u) => u.sigla === valor);
  const textoEscolhido = escolhida ? rotuloDa(escolhida) : valor;

  const [texto, setTexto] = useState<string | null>(null); // null = mostra a escolhida
  const [aberta, setAberta] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const fechar = useRef<ReturnType<typeof setTimeout> | null>(null);

  const opcoes = useMemo(() => {
    const lista = unidades ?? [];
    if (texto === null) return lista;
    const q = semAcento(texto.replace(/\([^)]*\)/g, "").replace(/\s+/g, ""));
    return lista.filter((u) =>
      semAcento(`${u.nome}${u.sigla}${u.categoria}`.replace(/\s+/g, "")).includes(q),
    );
  }, [unidades, texto]);

  const total = opcoes.length;
  const indiceAtivo = total ? Math.min(ativo, total - 1) : -1;

  const escolher = (u: UnidadeMedida) => {
    aoMudar(u.sigla);
    setTexto(null);
    setAberta(false);
  };

  const abrir = () => {
    if (fechar.current) clearTimeout(fechar.current);
    setAberta(true);
    const i = (unidades ?? []).findIndex((u) => u.sigla === valor);
    setAtivo(texto === null && i >= 0 ? i : 0);
  };

  const tecla = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!aberta) return abrir();
      setAtivo(total ? (indiceAtivo + 1) % total : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!aberta) return abrir();
      setAtivo(total ? (indiceAtivo - 1 + total) % total : 0);
    } else if (e.key === "Enter") {
      if (!aberta) return; // Enter fechado envia o formulário, como num campo comum.
      e.preventDefault();
      const u = indiceAtivo >= 0 ? opcoes[indiceAtivo] : undefined;
      if (u) escolher(u);
    } else if (e.key === "Escape" && aberta) {
      e.preventDefault();
      setAberta(false);
      setTexto(null);
    }
  };

  const aviso = erro
    ? "Não foi possível carregar as unidades. Feche e abra de novo."
    : carregando
      ? "Carregando unidades…"
      : null;

  return (
    <div className="relative flex flex-col gap-1.5">
      <Label htmlFor={idCampo}>Unidade de medida</Label>
      <input
        id={idCampo}
        type="text"
        role="combobox"
        aria-expanded={aberta}
        aria-controls={idLista}
        aria-autocomplete="list"
        aria-activedescendant={aberta && indiceAtivo >= 0 ? idOpcao(indiceAtivo) : undefined}
        aria-describedby={aviso ? idAviso : undefined}
        autoComplete="off"
        spellCheck={false}
        placeholder="Pesquise por nome, sigla ou categoria"
        value={texto ?? textoEscolhido}
        onChange={(e) => {
          setTexto(e.target.value);
          setAtivo(0);
          setAberta(true);
        }}
        onFocus={abrir}
        onBlur={() => {
          fechar.current = setTimeout(() => {
            setAberta(false);
            setTexto(null);
          }, 140);
        }}
        onKeyDown={tecla}
        className={cn(
          "h-12 w-full rounded-md border bg-branco px-3 text-corpo-m text-tinta-900 placeholder:text-tinta-300",
          "transition-[border-color,box-shadow] focus-visible:outline-none motion-reduce:transition-none",
          aberta ? "border-verde-700 shadow-foco" : "border-borda",
        )}
      />
      {aviso && (
        <p id={idAviso} role={erro ? "alert" : "status"} className="text-corpo-s text-tinta-600">
          {aviso}
        </p>
      )}
      {aberta && !aviso && (
        <ul
          id={idLista}
          role="listbox"
          aria-label="Unidades de medida"
          // onMouseDown só evita que o campo perca o foco ao clicar numa opção.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute top-[78px] right-0 left-0 z-10 m-0 max-h-60 list-none overflow-auto rounded-xl border border-borda bg-branco p-1.5 motion-safe:animate-entrada"
        >
          {opcoes.map((u, i) => (
            // O teclado fica no combobox (aria-activedescendant); o clique é só do mouse.
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events
            <li
              key={u.sigla}
              id={idOpcao(i)}
              role="option"
              aria-selected={u.sigla === valor}
              onMouseEnter={() => setAtivo(i)}
              onClick={() => escolher(u)}
              className={cn(
                "grid min-h-11 cursor-pointer grid-cols-[1fr_auto] items-center gap-x-3 rounded-lg px-2.5 py-1.5",
                i === indiceAtivo && "bg-verde-50",
              )}
            >
              <span className="text-sm leading-[18px] font-semibold text-tinta-900">{u.nome}</span>
              <span className="text-[13px] leading-[18px] font-semibold text-verde-700">
                {u.sigla}
              </span>
              <span className="text-xs leading-4 text-tinta-600">{u.categoria}</span>
            </li>
          ))}
          {total === 0 && (
            <li role="presentation" className="p-2.5 text-corpo-s text-tinta-600">
              Nenhuma unidade encontrada.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
