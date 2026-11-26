/**
 * Mapa das telas do app: uma fonte só para o menu lateral, o título da aba e a busca de
 * telas (F1-6). O menu tem 4 grupos, na ordem do design (VisaoGeral.dc.html).
 */
import {
  ArrowLeftRight,
  Box,
  ClipboardList,
  GraduationCap,
  Grid3x3,
  LayoutDashboard,
  LifeBuoy,
  ShieldAlert,
  SlidersHorizontal,
  Target,
  Upload,
  type LucideIcon,
} from "lucide-react";

import { recursos, type Recurso } from "@/config/recursos";

export type GrupoMenu = "Análise" | "Dados" | "Regras do cálculo" | "Aprender e ajuda";

export type TelaDoMenu = {
  caminho: string;
  titulo: string;
  grupo: GrupoMenu;
  icone: LucideIcon;
  /** Palavras extras para a busca de telas (sem acento, minúsculas). */
  palavras: string;
  /** Tela sem design: mostra "Em breve". */
  emBreve: boolean;
  /** Some do menu e das rotas quando a chave de recurso está desligada. */
  recurso: Recurso | null;
};

export const GRUPOS_MENU: GrupoMenu[] = [
  "Análise",
  "Dados",
  "Regras do cálculo",
  "Aprender e ajuda",
];

const TODAS: TelaDoMenu[] = [
  {
    caminho: "/app/visao-geral",
    titulo: "Visão geral",
    grupo: "Análise",
    icone: LayoutDashboard,
    palavras: "painel inicio dashboard",
    emBreve: false,
    recurso: null,
  },
  {
    caminho: "/app/materiais",
    titulo: "Materiais",
    grupo: "Análise",
    icone: Box,
    palavras: "catalogo itens posicoes",
    emBreve: false,
    recurso: null,
  },
  {
    caminho: "/app/planejamento",
    titulo: "Planejamento",
    grupo: "Análise",
    icone: ClipboardList,
    palavras: "meu plano casos validar exportar",
    emBreve: false,
    recurso: null,
  },
  {
    caminho: "/app/importar",
    titulo: "Importar dados",
    grupo: "Dados",
    icone: Upload,
    palavras: "planilha carga upload excel mestres movimentos",
    emBreve: false,
    recurso: null,
  },
  {
    caminho: "/app/regras",
    titulo: "Regras e letras",
    grupo: "Regras do cálculo",
    icone: SlidersHorizontal,
    palavras: "abc pqr xyz comprabilidade cortes classes",
    emBreve: false,
    recurso: null,
  },
  {
    caminho: "/app/tipos-movimento",
    titulo: "Tipos de movimento",
    grupo: "Regras do cálculo",
    icone: ArrowLeftRight,
    palavras: "codigos entrada saida sap",
    emBreve: false,
    recurso: null,
  },
  {
    caminho: "/app/nivel-servico",
    titulo: "Nível de serviço",
    grupo: "Regras do cálculo",
    icone: Target,
    palavras: "matriz v3 meta",
    emBreve: false,
    recurso: null,
  },
  {
    caminho: "/app/tmer",
    titulo: "Matriz TMER",
    grupo: "Regras do cálculo",
    icone: Grid3x3,
    palavras: "dias reposicao",
    emBreve: false,
    recurso: "matrizTmer",
  },
  {
    caminho: "/app/casos-controle",
    titulo: "Casos de controle",
    grupo: "Regras do cálculo",
    icone: ShieldAlert,
    palavras: "alertas encaminhamentos",
    emBreve: true,
    recurso: null,
  },
  {
    caminho: "/app/academia",
    titulo: "Academia",
    grupo: "Aprender e ajuda",
    icone: GraduationCap,
    palavras: "aulas cursos aprender",
    emBreve: true,
    recurso: null,
  },
  {
    caminho: "/app/suporte",
    titulo: "Suporte",
    grupo: "Aprender e ajuda",
    icone: LifeBuoy,
    palavras: "ajuda chamado contato",
    emBreve: true,
    recurso: null,
  },
];

/** Telas fora do menu lateral (avatar e cartão do plano levam a elas). */
export const TELAS_DA_CONTA = [
  {
    caminho: "/app/plano",
    titulo: "Seu plano",
    palavras: "assinatura fatura pagamento pix boleto",
  },
  {
    caminho: "/app/conta",
    titulo: "Minha conta",
    palavras: "perfil senha email usuario dados lgpd",
  },
] as const;

/** Telas do menu com as chaves de recurso aplicadas. */
export function telasDoMenu(chaves: Record<Recurso, boolean> = recursos): TelaDoMenu[] {
  return TODAS.filter((t) => t.recurso === null || chaves[t.recurso]);
}

export const NOME_PRODUTO = "Agro MRO Intelligence";

/** "Visão geral" → "Visão geral · Agro MRO Intelligence". */
export const tituloDaAba = (titulo: string) => `${titulo} · ${NOME_PRODUTO}`;
