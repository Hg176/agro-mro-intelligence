/**
 * Fluxo da aba Dados mestres: Arquivo → Colunas → Prévia → Concluído. O estado do fluxo fica
 * na memória da tela; tudo o que é dado (leitura, colunas, validação, contagens, progresso
 * e resumo) vem da API.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { chaves } from "@/api/chaves";
import { ApiErro } from "@/api/cliente";
import { useColunasDoArquivo, useProgressoCarga } from "@/api/hooks";
import { confirmarImportacao, corrigirLinha, gerarPrevia, type Mapeamento } from "@/api/importacao";
import type { ArquivoRecebido, ErpOrigem, ModoImportacao, PreviaImportacao } from "@/api/tipos";
import { Stepper } from "@/componentes/Stepper";

import { PassoArquivo } from "./PassoArquivo";
import { PassoColunas } from "./PassoColunas";
import { PassoConcluido } from "./PassoConcluido";
import { PassoPrevia } from "./PassoPrevia";
import { PASSOS } from "./textos";

type Passo = 0 | 1 | 2;

const mensagem = (erro: unknown, padrao: string) =>
  erro instanceof ApiErro ? erro.mensagem : erro ? padrao : null;

/** Gravação incerta (rede, tempo esgotado, 5xx) não promete nada e não repete sozinha (D12). */
const INCERTA =
  "Não sabemos se a importação foi gravada. Confira em Cargas anteriores antes de enviar de novo.";

function erroDaGravacao(erro: unknown): string | null {
  if (!erro) return null;
  if (erro instanceof ApiErro && erro.status >= 400 && erro.status < 500) return erro.mensagem;
  return INCERTA;
}

export function FluxoDadosMestres({
  posicoesAtuais,
  aoImportarMovimentos,
}: {
  posicoesAtuais: number | null;
  aoImportarMovimentos: () => void;
}) {
  const cliente = useQueryClient();
  const [passo, setPasso] = useState<Passo>(0);
  const [erp, setErp] = useState<ErpOrigem>("sap");
  const [arquivo, setArquivo] = useState<ArquivoRecebido | null>(null);
  const [trocas, setTrocas] = useState<Mapeamento>({});
  const [lembrar, setLembrar] = useState(true);
  const [previa, setPrevia] = useState<PreviaImportacao | null>(null);
  const [modo, setModo] = useState<ModoImportacao>("append");
  const [cargaId, setCargaId] = useState<string | null>(null);

  const colunas = useColunasDoArquivo(passo >= 1 && arquivo ? arquivo.arquivo_id : null);
  const progresso = useProgressoCarga(cargaId);
  const estadoCarga = progresso.data?.estado;

  // Mapeamento = o que a API reconheceu (ou lembrou) + o que você trocou.
  const mapeamento: Mapeamento = {
    ...Object.fromEntries((colunas.data?.campos ?? []).map((c) => [c.campo, c.coluna])),
    ...trocas,
  };

  const gerar = useMutation({
    mutationFn: () => gerarPrevia(arquivo?.arquivo_id ?? "", mapeamento, lembrar),
    onSuccess: (p) => {
      setPrevia(p);
      setPasso(2);
    },
  });
  const corrigir = useMutation({
    mutationFn: (c: { linha: number; campo: string; valor: string }) =>
      corrigirLinha(arquivo?.arquivo_id ?? "", c),
    onSuccess: setPrevia,
  });
  const confirmar = useMutation({
    mutationFn: () => confirmarImportacao(arquivo?.arquivo_id ?? "", modo),
    onSuccess: (r) => setCargaId(r.carga_id),
  });

  // Ao terminar (bem ou mal), o histórico muda: lê o painel de novo.
  useEffect(() => {
    if (estadoCarga === "concluida" || estadoCarga === "falhou") {
      void cliente.invalidateQueries({ queryKey: chaves.importacao, exact: true });
    }
  }, [estadoCarga, cliente]);

  const recomecar = () => {
    setPasso(0);
    setArquivo(null);
    setTrocas({});
    setPrevia(null);
    setCargaId(null);
    gerar.reset();
    confirmar.reset();
  };

  const concluido = estadoCarga === "concluida" && progresso.data?.resumo;
  const gravando =
    confirmar.isPending ||
    (cargaId !== null && (estadoCarga === undefined || estadoCarga === "gravando"));

  return (
    <div className="px-8 pt-7 pb-8">
      <Stepper
        passos={PASSOS}
        atual={concluido ? PASSOS.length : passo}
        rotulo="Etapas da importação"
      />

      {concluido && progresso.data?.resumo ? (
        <PassoConcluido
          resumo={progresso.data.resumo}
          aoImportarMovimentos={aoImportarMovimentos}
        />
      ) : passo === 0 ? (
        <PassoArquivo
          erp={erp}
          aoMudarErp={setErp}
          arquivo={arquivo}
          aoReceber={setArquivo}
          aoTrocar={recomecar}
          aoContinuar={() => setPasso(1)}
        />
      ) : passo === 1 ? (
        <PassoColunas
          colunas={colunas.data}
          carregando={colunas.isPending}
          erro={mensagem(colunas.error, "Não foi possível ler as colunas do arquivo.")}
          mapeamento={mapeamento}
          aoMudar={(campo, coluna) => setTrocas((t) => ({ ...t, [campo]: coluna }))}
          lembrar={lembrar}
          aoMudarLembrar={setLembrar}
          aoVoltar={() => setPasso(0)}
          aoVerPrevia={() => {
            if (!gerar.isPending) gerar.mutate();
          }}
          gerandoPrevia={gerar.isPending}
          erroPrevia={mensagem(gerar.error, "Não foi possível gerar a prévia. Tente de novo.")}
        />
      ) : previa ? (
        <PassoPrevia
          previa={previa}
          posicoesAtuais={posicoesAtuais}
          modo={modo}
          aoMudarModo={setModo}
          aoCorrigir={(c) => corrigir.mutate(c)}
          corrigindo={corrigir.isPending}
          erroCorrecao={mensagem(corrigir.error, "Não foi possível conferir a correção.")}
          progresso={progresso.data}
          gravando={gravando}
          erroConfirmacao={erroDaGravacao(confirmar.error ?? progresso.error)}
          aoVoltar={() => setPasso(1)}
          aoConfirmar={() => {
            if (!gravando) confirmar.mutate();
          }}
        />
      ) : null}
    </div>
  );
}
