/**
 * Barra "Salvar alterações" que sobe do rodapé quando algo muda (Conta.dc.html).
 * Só aparece com mudança; sobe com motion-safe.
 */
import { Botao } from "@/componentes/Botao";

type Props = {
  visivel: boolean;
  aoSalvar: () => void;
  aoDescartar: () => void;
  salvando?: boolean;
  texto?: string;
};

export function BarraSalvar({
  visivel,
  aoSalvar,
  aoDescartar,
  salvando = false,
  texto = "Você tem alterações não salvas.",
}: Props) {
  if (!visivel) return null;
  return (
    <div
      role="region"
      aria-label="Alterações não salvas"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-borda bg-branco motion-safe:animate-subir"
    >
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-10 py-3">
        <p className="text-corpo-m text-tinta-900">{texto}</p>
        <div className="flex gap-3">
          <Botao variant="fantasma" onClick={aoDescartar} disabled={salvando}>
            Descartar
          </Botao>
          <Botao size="grande" onClick={aoSalvar} disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar alterações"}
          </Botao>
        </div>
      </div>
    </div>
  );
}
