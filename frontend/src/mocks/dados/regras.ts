/**
 * Regras do cálculo ilustrativas.
 *
 * - Cortes padrão Agro MRO (RegrasLetras.dc.html, CONTEXTO §6): ABC 80% / 95%,
 *   PQR 3 / 12 por ano (saídas e entradas), N em 180 dias.
 * - Matriz V3 de nível de serviço, 75 casos: valores de NivelServico.dc.html (o
 *   approved_service_levels_v3.json ainda não está no main). Conferidos contra o JSON do
 *   protótipo: 75 de 75 iguais. tests/mocks-dados.test.ts compara com o .dc.html.
 * - TMER proposta 2.0.0, 75 casos: valores de MatrizTmer.dc.html (iguais a tmer_standard.py).
 *
 * Este arquivo faz o papel do backend: fator z, reposições por ano e faixa de cor são
 * calculados AQUI, no mock, porque no real virão prontos da API. As telas não calculam.
 */
import type {
  CasoNivelServico,
  CasoTmer,
  ClasseAbc,
  ClassePqr,
  ClasseXyz,
  FaixaCelula,
  RegraCorte,
} from "@/api/tipos";

import { d } from "./util";

export const CORTES_PADRAO: RegraCorte = {
  abc_a: d("0.80"),
  abc_b: d("0.95"),
  pqr_output_q: d("3"),
  pqr_output_p: d("12"),
  pqr_entry_q: d("3"),
  pqr_entry_p: d("12"),
  new_item_days: 180,
  origem: "agro_mro",
  versao: 0,
};

const ORDEM_PQR: ClassePqr[] = ["P", "Q", "R", "S", "N"];
const ORDEM_ABC: ClasseAbc[] = ["A", "B", "C", "D", "N"];
const ORDEM_XYZ: ClasseXyz[] = ["X", "Y", "Z"];

/** Matriz V3 do design: V[xyz][pqr][índice ABC]. Texto exato do Decimal. */
export const V3: Record<ClasseXyz, Record<ClassePqr, string[]>> = {
  X: {
    P: ["0.707", "0.821", "0.839", "0.839", "0.821"],
    Q: ["0.692", "0.804", "0.821", "0.821", "0.804"],
    R: ["0.596", "0.692", "0.707", "0.707", "0.692"],
    S: ["0", "0", "0", "0", "0"],
    N: ["0.692", "0.804", "0.821", "0.821", "0.804"],
  },
  Y: {
    P: ["0.839", "0.975", "0.996", "0.996", "0.975"],
    Q: ["0.821", "0.954", "0.975", "0.975", "0.954"],
    R: ["0.707", "0.821", "0.839", "0.839", "0.821"],
    S: ["0", "0", "0", "0", "0"],
    N: ["0.821", "0.954", "0.975", "0.975", "0.954"],
  },
  Z: {
    P: ["0.84", "0.976", "0.997", "0.997", "0.976"],
    Q: ["0.822", "0.955", "0.976", "0.976", "0.955"],
    R: ["0.708", "0.822", "0.84", "0.84", "0.822"],
    S: ["0", "0", "0", "0", "0"],
    N: ["0.822", "0.955", "0.976", "0.976", "0.955"],
  },
};

/** TMER proposta 2.0.0: T[pqr][abc] = dias para X123 = 1, 2, 3. */
export const TMER: Record<ClassePqr, Record<ClasseAbc, [number, number, number]>> = {
  P: { A: [12, 6, 3], B: [12, 12, 6], C: [48, 24, 12], D: [48, 24, 12], N: [12, 12, 6] },
  Q: { A: [28, 14, 7], B: [56, 28, 14], C: [112, 56, 28], D: [112, 56, 28], N: [56, 28, 14] },
  R: { A: [90, 45, 22], B: [180, 90, 45], C: [360, 180, 90], D: [360, 180, 90], N: [180, 90, 45] },
  N: { A: [28, 14, 7], B: [56, 28, 14], C: [112, 56, 28], D: [112, 56, 28], N: [56, 28, 14] },
  S: { A: [0, 0, 0], B: [0, 0, 0], C: [0, 0, 0], D: [0, 0, 0], N: [0, 0, 0] },
};

/** Inversa da normal padrão (Acklam). Só no mock: no real, o fator z vem do backend. */
function inversaNormal(p: number): number {
  const a = [
    -39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472,
    2.50662827745924,
  ];
  const b = [
    -54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857,
  ];
  const c = [
    -0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373,
    4.37466414146497, 2.93816398269878,
  ];
  const e = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const [a0, a1, a2, a3, a4, a5] = a as [number, number, number, number, number, number];
  const [b0, b1, b2, b3, b4] = b as [number, number, number, number, number];
  const [c0, c1, c2, c3, c4, c5] = c as [number, number, number, number, number, number];
  const [e0, e1, e2, e3] = e as [number, number, number, number];
  const limite = 0.02425;
  if (p < limite) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c0 * q + c1) * q + c2) * q + c3) * q + c4) * q + c5) /
      ((((e0 * q + e1) * q + e2) * q + e3) * q + 1)
    );
  }
  if (p > 1 - limite) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return (
      -(((((c0 * q + c1) * q + c2) * q + c3) * q + c4) * q + c5) /
      ((((e0 * q + e1) * q + e2) * q + e3) * q + 1)
    );
  }
  const q = p - 0.5;
  const r = q * q;
  return (
    ((((((a0 * r + a1) * r + a2) * r + a3) * r + a4) * r + a5) * q) /
    (((((b0 * r + b1) * r + b2) * r + b3) * r + b4) * r + 1)
  );
}

function faixaNivelServico(valor: number): FaixaCelula {
  if (valor === 0) return 0;
  if (valor < 0.75) return 1;
  if (valor < 0.85) return 2;
  if (valor < 0.95) return 3;
  return 4;
}

function faixaTmer(dias: number): FaixaCelula {
  if (dias === 0) return 0;
  if (dias <= 14) return 4;
  if (dias <= 56) return 3;
  if (dias <= 112) return 2;
  return 1;
}

export function casosV3(): CasoNivelServico[] {
  return ORDEM_PQR.flatMap((pqr) =>
    ORDEM_ABC.flatMap((abc, i) =>
      ORDEM_XYZ.map((xyz) => {
        const texto = V3[xyz][pqr][i] ?? "0";
        const valor = Number(texto);
        return {
          case: `${pqr}${abc}${xyz}`,
          pqr,
          abc,
          xyz,
          service_level: d(texto),
          fator_z: valor > 0 ? d(inversaNormal(valor).toFixed(2)) : null,
          faixa: faixaNivelServico(valor),
          origem: "v3" as const,
        };
      }),
    ),
  );
}

export function casosTmer(): CasoTmer[] {
  return ORDEM_PQR.flatMap((pqr) =>
    ORDEM_ABC.flatMap((abc) =>
      ([1, 2, 3] as const).map((x123) => {
        const dias = TMER[pqr][abc][x123 - 1] ?? 0;
        return {
          case: `${pqr}${abc}${x123}`,
          pqr,
          abc,
          purchasability: x123,
          replenishment_days: d(String(dias)),
          reposicoes_por_ano: dias > 0 ? d((365 / dias).toFixed(1)) : null,
          faixa: faixaTmer(dias),
          editado: false,
        };
      }),
    ),
  );
}
