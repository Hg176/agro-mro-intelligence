/**
 * "Baixar Excel" (Visão geral, Materiais, Planejamento). O arquivo vem pronto da API; o
 * front não monta planilha. Protegido por permissoes.exportar_excel (GET /me), ou por outra
 * permissão, ou livre (`permissao={null}`).
 * Baixar não confirma nada: é só uma cópia dos dados mostrados.
 */
import { useMutation } from "@tanstack/react-query";
import { Download } from "lucide-react";

import { ApiErro, type ArquivoBaixado } from "@/api/cliente";
import { Botao } from "@/componentes/Botao";
import { salvarArquivo } from "@/lib/salvarArquivo";
import type { NomePermissao } from "@/api/tipos";
import { AcaoProtegida } from "@/sessao/AcaoProtegida";

type Props = {
  baixar: () => Promise<ArquivoBaixado>;
  texto?: string;
  tamanho?: "default" | "grande";
  /** Permissão que libera o download. null = livre (ex.: planilha modelo da importação). */
  permissao?: NomePermissao | null;
};

export function BotaoBaixarExcel({
  baixar,
  texto = "Baixar Excel",
  tamanho = "grande",
  permissao = "exportar_excel",
}: Props) {
  const download = useMutation({
    mutationFn: baixar,
    onSuccess: salvarArquivo,
  });
  const erro =
    download.error instanceof ApiErro
      ? download.error.mensagem
      : download.error
        ? "Não foi possível baixar o arquivo. Tente de novo."
        : null;

  const botao = (
    <Botao
      variant="secundario"
      size={tamanho}
      aria-busy={download.isPending || undefined}
      onClick={() => {
        if (!download.isPending) download.mutate();
      }}
    >
      <Download aria-hidden="true" />
      {download.isPending ? "Preparando o arquivo…" : texto}
    </Botao>
  );

  return (
    <span className="inline-flex flex-col items-start gap-1">
      {permissao ? <AcaoProtegida permissao={permissao}>{botao}</AcaoProtegida> : botao}
      {erro && (
        <span role="alert" className="text-corpo-s text-status-ruptura-texto">
          {erro}
        </span>
      )}
    </span>
  );
}
