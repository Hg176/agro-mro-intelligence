import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { buscarPosicoes } from "@/api/busca";
import { listarGruposPadrao, listarUnidades } from "@/api/cadastros";
import { chaves } from "@/api/chaves";
import { criarMaterial, listarMateriais, type ParametrosMateriais } from "@/api/materiais";
import { obterSessao } from "@/api/sessao";
import type { NovoMaterial } from "@/api/tipos";
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
