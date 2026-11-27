import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { buscarPosicoes } from "@/api/busca";
import { listarGruposPadrao, listarUnidades } from "@/api/cadastros";
import { obterColunas, obterPainelImportacao, obterProgresso } from "@/api/importacao";
import { chaves } from "@/api/chaves";
import { criarMaterial, listarMateriais, type ParametrosMateriais } from "@/api/materiais";
import { obterImpacto, obterNivelServico, obterPreviaAdocao } from "@/api/nivelServico";
import { obterPlanejamento } from "@/api/planejamento";
import { obterRegras } from "@/api/regras";
import { obterSessao } from "@/api/sessao";
import type { Decimal, FiltroPlanejamento, NovoMaterial } from "@/api/tipos";
import { obterVisaoGeral } from "@/api/visaoGeral";

/** GET /me. Usado pelo ProvedorSessao (F1-4); as telas leem a sessão por useSessao(). */
export function useConsultaSessao() {
  return useQuery({
    queryKey: chaves.sessao,
    queryFn: ({ signal }) => obterSessao(signal),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useBuscaPosicoes(q: string) {
  return useQuery({
    queryKey: chaves.busca(q),
    queryFn: ({ signal }) => buscarPosicoes(q, signal),
    placeholderData: keepPreviousData,
  });
}

export function useVisaoGeral() {
  return useQuery({
    queryKey: chaves.visaoGeral,
    queryFn: ({ signal }) => obterVisaoGeral(signal),
  });
}

export function useMateriais(parametros: ParametrosMateriais) {
  return useQuery({
    queryKey: chaves.materiais(parametros),
    queryFn: ({ signal }) => listarMateriais(parametros, signal),
    placeholderData: keepPreviousData,
  });
}

/**
 * Listas do cadastro: só buscam quando o formulário abre (`ligado`) e, como mudam pouco,
 * ficam 30 min sem buscar de novo.
 */
export function useUnidades(ligado = true) {
  return useQuery({
    queryKey: chaves.unidades,
    queryFn: ({ signal }) => listarUnidades(signal),
    staleTime: 30 * 60_000,
    enabled: ligado,
  });
}

export function useGruposPadrao(ligado = true) {
  return useQuery({
    queryKey: chaves.gruposPadrao,
    queryFn: ({ signal }) => listarGruposPadrao(signal),
    staleTime: 30 * 60_000,
    enabled: ligado,
  });
}

export function useCriarMaterial() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (material: NovoMaterial) => criarMaterial(material),
    onSuccess: () => cliente.invalidateQueries({ queryKey: chaves.todosMateriais }),
  });
}

/** Importar dados: conclusão, abas e histórico. */
export function usePainelImportacao() {
  return useQuery({
    queryKey: chaves.importacao,
    queryFn: ({ signal }) => obterPainelImportacao(signal),
  });
}

/** Colunas reconhecidas do arquivo enviado (o mapeamento lembrado vem daqui). */
export function useColunasDoArquivo(arquivoId: string | null) {
  return useQuery({
    queryKey: chaves.colunasDoArquivo(arquivoId ?? ""),
    queryFn: ({ signal }) => obterColunas(arquivoId ?? "", signal),
    enabled: arquivoId !== null,
    staleTime: Infinity,
  });
}

/** Intervalo entre leituras do progresso da gravação. */
export const INTERVALO_PROGRESSO_MS = 400;

/**
 * Progresso real da gravação: lê de novo enquanto o backend disser "gravando". Leitura
 * (GET), então pode repetir; a escrita (confirmar) nunca repete.
 */
export function useProgressoCarga(cargaId: string | null) {
  return useQuery({
    queryKey: chaves.progressoCarga(cargaId ?? ""),
    queryFn: ({ signal }) => obterProgresso(cargaId ?? "", signal),
    enabled: cargaId !== null,
    refetchInterval: (consulta) =>
      consulta.state.data?.estado === "gravando" || consulta.state.data === undefined
        ? INTERVALO_PROGRESSO_MS
        : false,
  });
}

/** Planejamento: a API aplica o filtro; ao trocar, o anterior fica na tela até chegar o novo. */
export function usePlanejamento(filtro: FiltroPlanejamento) {
  return useQuery({
    queryKey: chaves.planejamento(filtro),
    queryFn: ({ signal }) => obterPlanejamento(filtro, signal),
    placeholderData: keepPreviousData,
  });
}

/** Regras e letras: cortes do espaço, padrão e o que a API calcula com eles. */
export function useRegras() {
  return useQuery({ queryKey: chaves.regras, queryFn: ({ signal }) => obterRegras(signal) });
}

/** Nível de serviço: os 75 casos e a origem da matriz. */
export function useNivelServico() {
  return useQuery({
    queryKey: chaves.nivelServico,
    queryFn: ({ signal }) => obterNivelServico(signal),
  });
}

/** Impacto da meta digitada (só quando o formato está certo). Leitura: nada é gravado. */
export function useImpactoMeta(caso: string, meta: Decimal | null) {
  return useQuery({
    queryKey: chaves.impactoMeta(caso, meta ?? ""),
    queryFn: ({ signal }) => obterImpacto(caso, meta as Decimal, signal),
    enabled: meta !== null,
    staleTime: 60_000,
  });
}

/** Prévia da adoção da V3: só busca quando o bloco "Confira a adoção" abre. */
export function usePreviaAdocaoV3(aberta: boolean) {
  return useQuery({
    queryKey: chaves.adocaoV3,
    queryFn: ({ signal }) => obterPreviaAdocao(signal),
    enabled: aberta,
    staleTime: 0,
  });
}
