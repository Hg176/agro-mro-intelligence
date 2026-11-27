/**
 * Gráfico de barras com Recharts usando as cores --chart-* do tema.
 * Valores chegam como Decimal; a altura usa alturaNoGrafico (só geometria) e o texto do
 * rótulo/tooltip usa o Decimal formatado. Tem uma tabela equivalente para leitor de tela.
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { Decimal } from "@/api/tipos";
import { decimal } from "@/lib/formato";
import { alturaNoGrafico } from "@/lib/grafico";

export type PontoGrafico = {
  rotulo: string;
  valor: Decimal | null;
  /** 1 a 5 → var(--chart-n). */
  cor?: 1 | 2 | 3 | 4 | 5;
};

type Props = {
  titulo: string;
  pontos: PontoGrafico[];
  /** Formata o valor para texto (padrão: decimal). */
  formatar?: (valor: Decimal | null) => string;
  altura?: number;
};

export function GraficoBarras({ titulo, pontos, formatar = decimal, altura = 220 }: Props) {
  const dados = pontos.map((p) => ({
    rotulo: p.rotulo,
    altura: alturaNoGrafico(p.valor),
    texto: formatar(p.valor),
    cor: `var(--chart-${p.cor ?? 1})`,
  }));

  return (
    <figure className="m-0">
      <figcaption className="text-rotulo uppercase text-tinta-500">{titulo}</figcaption>
      <div aria-hidden="true" className="mt-3" style={{ height: altura }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--borda)" />
            <XAxis
              dataKey="rotulo"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--tinta-600)", fontSize: 13 }}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: "var(--verde-50)" }}
              formatter={(_v, _n, item) => [String((item.payload as { texto: string }).texto), ""]}
              contentStyle={{
                background: "var(--verde-950)",
                border: 0,
                borderRadius: 8,
                color: "var(--branco)",
              }}
              itemStyle={{ color: "var(--branco)" }}
              labelStyle={{ color: "var(--ouro-300)" }}
              isAnimationActive={false}
            />
            <Bar dataKey="altura" radius={[6, 6, 0, 0]} isAnimationActive={false}>
              {dados.map((d) => (
                <Cell key={d.rotulo} fill={d.cor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>{titulo}</caption>
        <tbody>
          {dados.map((d) => (
            <tr key={d.rotulo}>
              <th scope="row">{d.rotulo}</th>
              <td>{d.texto}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
