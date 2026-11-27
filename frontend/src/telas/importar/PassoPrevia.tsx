/**
 * Passo 3 · Prévia (ImportarDados.dc.html): contagens, linhas com erro editáveis, modo
 * (acrescentar × substituir), progresso real e confirmação. Nada é gravado antes de
 * "Confirmar". Corrigir um valor manda PUT …/correcoes; o backend valida de novo e as
 * contagens voltam prontas (o front não conta linhas).
 */
import { Check } from "lucide-react";
import { useState } from "react";

import type { ModoImportacao, PreviaImportacao, ProgressoCarga } from "@/api/tipos";
import { Botao } from "@/componentes/Botao";
import { inteiro, larguraDoPercentual, percentual } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { AcaoProtegida } from "@/sessao/AcaoProtegida";

import { MODOS } from "./textos";

type Props = {
  previa: PreviaImportacao;
  posicoesAtuais: number | null;
  modo: ModoImportacao;
  aoMudarModo: (modo: ModoImportacao) => void;
  aoCorrigir: (correcao: { linha: number; campo: string; valor: string }) => void;
  corrigindo: boolean;
  erroCorrecao: string | null;
  progresso: ProgressoCarga | undefined;
  gravando: boolean;
  erroConfirmacao: string | null;
  aoVoltar: () => void;
  aoConfirmar: () => void;
};

const CLASSE_TH =
  "px-3 py-2.5 text-left text-[10px] leading-[14px] font-semibold tracking-[0.1em] uppercase text-tinta-500";

function Contagem({ rotulo, valor, tom }: { rotulo: string; valor: number; tom?: "ok" | "erro" }) {
  return (
    <div
      className={cn(
        "rounded-xl border px-5 py-[18px]",
        tom === "erro" ? "border-status-ruptura bg-status-ruptura-bg" : "border-borda",
      )}
    >
      <p
        className={cn(
          "text-rotulo uppercase",
          tom === "erro" ? "text-status-ruptura-texto" : "text-tinta-500",
        )}
      >
        {rotulo}
      </p>
      <p
        className={cn(
          "mt-1.5 font-display text-numero-kpi tabular-nums",
          tom === "ok" && "text-verde-700",
          tom === "erro" && "text-status-ruptura",
        )}
      >
        {inteiro(valor)}
      </p>
    </div>
  );
}

function ValorEditavel({
  rotulo,
  valor,
  corrigido,
  desabilitado,
  aoEnviar,
}: {
  rotulo: string;
  valor: string | null;
  corrigido: boolean;
  desabilitado: boolean;
  aoEnviar: (valor: string) => void;
}) {
  const [texto, setTexto] = useState(valor ?? "");
  const enviar = () => {
    if (texto !== (valor ?? "")) aoEnviar(texto);
  };
  return (
    <input
      type="text"
      aria-label={rotulo}
      aria-invalid={corrigido ? undefined : true}
      value={texto}
      placeholder="(vazio)"
      disabled={desabilitado}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={enviar}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          enviar();
        }
      }}
      className={cn(
        "h-11 w-full rounded-md bg-branco px-3 text-corpo-m text-tinta-900 placeholder:text-tinta-300",
        "focus-visible:shadow-foco focus-visible:outline-none",
        corrigido ? "border border-verde-700" : "border-2 border-status-ruptura",
      )}
    />
  );
}

export function PassoPrevia({
  previa,
  posicoesAtuais,
  modo,
  aoMudarModo,
  aoCorrigir,
  corrigindo,
  erroCorrecao,
  progresso,
  gravando,
  erroConfirmacao,
  aoVoltar,
  aoConfirmar,
}: Props) {
  const largura = larguraDoPercentual(progresso?.percentual ?? null);
  const falhou = progresso?.estado === "falhou";

  return (
    <div className="mt-8 flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-4">
        <Contagem rotulo="Linhas lidas" valor={previa.linhas_lidas} />
        <Contagem rotulo="Prontas para entrar" valor={previa.prontas} tom="ok" />
        <Contagem rotulo="Com erro" valor={previa.com_erro} tom="erro" />
      </div>

      {previa.erros.length > 0 && (
        <div>
          <h3 className="text-titulo-s">
            {previa.com_erro === 0
              ? "Todas as linhas foram corrigidas"
              : `${inteiro(previa.com_erro)} ${previa.com_erro === 1 ? "linha pede" : "linhas pedem"} correção`}
          </h3>
          <p className="mt-1 text-corpo-s text-tinta-600">
            Corrija aqui mesmo ou deixe como está: linhas com erro não entram, e o resto é importado
            normalmente.
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <caption className="sr-only">Linhas com erro</caption>
              <thead>
                <tr className="border-b border-borda">
                  <th scope="col" className={cn(CLASSE_TH, "w-20 pl-0")}>
                    Linha
                  </th>
                  <th scope="col" className={cn(CLASSE_TH, "w-[170px]")}>
                    Coluna
                  </th>
                  <th scope="col" className={cn(CLASSE_TH, "w-[220px]")}>
                    Valor (editável)
                  </th>
                  <th scope="col" className={cn(CLASSE_TH, "pr-0")}>
                    O que fazer
                  </th>
                </tr>
              </thead>
              <tbody>
                {previa.erros.map((x) => (
                  <tr key={`${x.linha}-${x.campo}`} className="border-b border-borda">
                    <th scope="row" className="py-2.5 pr-3 text-left font-semibold tabular-nums">
                      {inteiro(x.linha)}
                    </th>
                    <td className="px-3 py-2.5 text-tinta-600">{x.coluna}</td>
                    <td className="px-3 py-2.5">
                      <ValorEditavel
                        rotulo={`Linha ${x.linha}, ${x.coluna}`}
                        valor={x.valor}
                        corrigido={x.corrigido}
                        desabilitado={gravando}
                        aoEnviar={(valor) => aoCorrigir({ linha: x.linha, campo: x.campo, valor })}
                      />
                    </td>
                    <td className="py-2.5 pl-3 text-corpo-s">
                      {x.corrigido ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-verde-700">
                          <Check aria-hidden="true" className="size-4" />
                          Corrigida
                        </span>
                      ) : (
                        <span className="text-status-ruptura-texto">{x.motivo}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(corrigindo || erroCorrecao) && (
            <p
              role={erroCorrecao ? "alert" : "status"}
              className={cn(
                "mt-2 text-corpo-s",
                erroCorrecao ? "font-medium text-status-ruptura-texto" : "text-tinta-600",
              )}
            >
              {erroCorrecao ?? "Conferindo a correção…"}
            </p>
          )}
        </div>
      )}

      <fieldset className="m-0 border-0 p-0">
        <legend className="p-0 text-[13px] leading-[18px] font-semibold">
          O que fazer com o que já está no sistema?
        </legend>
        <div className="mt-2.5 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-3">
          {MODOS.map((o) => {
            const ativo = o.id === modo;
            return (
              <label
                key={o.id}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-xl px-[18px] py-4",
                  ativo ? "border-2 border-verde-700 bg-verde-50" : "border border-borda bg-branco",
                )}
              >
                <input
                  type="radio"
                  name="modo-importacao"
                  checked={ativo}
                  disabled={gravando}
                  onChange={() => aoMudarModo(o.id)}
                  className="m-0 mt-0.5 size-5 shrink-0 accent-verde-700"
                />
                <span className="flex flex-col font-semibold">
                  {o.titulo}
                  <span className="text-corpo-s font-normal text-tinta-600">
                    {o.descricao(posicoesAtuais)}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {progresso && (gravando || falhou) && (
        <div
          role={falhou ? "alert" : "status"}
          aria-live="polite"
          className={cn(
            "rounded-xl border px-6 py-5",
            falhou ? "border-status-ruptura bg-status-ruptura-bg" : "border-borda bg-creme-100",
          )}
        >
          {falhou ? (
            <>
              <p className="font-semibold text-status-ruptura-texto">
                A importação não foi concluída
              </p>
              <p className="mt-1 text-corpo-s text-tinta-900">{progresso.motivo}</p>
            </>
          ) : (
            <>
              <div className="flex justify-between gap-3 tabular-nums">
                <span className="font-semibold">
                  Gravando {inteiro(progresso.gravadas)} de {inteiro(progresso.total)} posições…
                </span>
                <span className="text-tinta-600">{percentual(progresso.percentual)}</span>
              </div>
              <div aria-hidden="true" className="mt-2.5 h-2 rounded-[4px] bg-borda">
                {largura && (
                  <div
                    className="h-2 rounded-[4px] bg-verde-700 motion-safe:transition-[width] motion-safe:duration-200"
                    style={{ width: largura }}
                  />
                )}
              </div>
              <p className="mt-2.5 text-corpo-s text-tinta-600">
                Pode continuar usando o sistema. Se algo falhar, nada é gravado.
              </p>
            </>
          )}
        </div>
      )}

      {erroConfirmacao && (
        <p role="alert" className="text-corpo-m font-medium text-status-ruptura-texto">
          {erroConfirmacao}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Botao variant="secundario" size="grande" disabled={gravando} onClick={aoVoltar}>
          Voltar
        </Botao>
        <span className="min-w-[200px] flex-1 text-right text-corpo-s text-tinta-600">
          Tudo ou nada: se algo falhar, nada é gravado.
        </span>
        <AcaoProtegida permissao="importar">
          <Botao
            size="grande"
            disabled={gravando}
            aria-busy={gravando || undefined}
            onClick={aoConfirmar}
          >
            {`Confirmar importação de ${inteiro(previa.prontas)} ${previa.prontas === 1 ? "linha" : "linhas"}`}
          </Botao>
        </AcaoProtegida>
      </div>
    </div>
  );
}
