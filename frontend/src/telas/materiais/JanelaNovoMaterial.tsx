/**
 * "Adicionar material" na janela central do design (Materiais.dc.html), com os campos do
 * código (schemas.py MaterialIn). Validação aqui é só de preenchimento; regra e duplicidade
 * são do backend (403/409/422 aparecem como mensagem). Código fica como texto (zeros à
 * esquerda preservados).
 * Unidades e grupos do padrão vêm da API (GET /api/v1/unidades e /api/v1/grupos-padrao,
 * rotas a criar no backend; hoje só o mock responde).
 */
import { useId, useState, type FormEvent, type ReactNode } from "react";

import { ApiErro } from "@/api/cliente";
import { useCriarMaterial, useGruposPadrao, useUnidades } from "@/api/hooks";
import type { Comprabilidade, Criticidade, NovoMaterial } from "@/api/tipos";
import { Botao } from "@/componentes/Botao";
import { Campo } from "@/componentes/Campo";
import { Janela } from "@/componentes/Janela";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { CampoUnidade } from "./CampoUnidade";

type Formulario = {
  code: string;
  unit: string;
  short_description: string;
  group_1: string;
  group_2: string;
  location: string;
  criticality: Criticidade;
  customer_abc: "" | "A" | "B" | "C";
  purchasability: "" | "1" | "2" | "3";
};

const VAZIO: Formulario = {
  code: "",
  unit: "UN",
  short_description: "",
  group_1: "",
  group_2: "",
  location: "GERAL",
  criticality: "noncritical",
  customer_abc: "",
  purchasability: "",
};

type Erros = Partial<Record<"code" | "short_description" | "location", string>>;

const ID_FORM = "form-novo-material";

function CampoSelecao({
  rotulo,
  valor,
  aoMudar,
  children,
  className,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{rotulo}</Label>
      <select
        id={id}
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        className="h-12 w-full rounded-md border border-borda bg-branco px-3 text-corpo-m text-tinta-900 focus-visible:border-verde-700 focus-visible:shadow-foco focus-visible:outline-none"
      >
        {children}
      </select>
    </div>
  );
}

const textoOuNull = (t: string) => (t.trim() === "" ? null : t.trim());

export function JanelaNovoMaterial({
  aberta,
  aoMudar,
  aoSalvar,
}: {
  aberta: boolean;
  aoMudar: (aberta: boolean) => void;
  aoSalvar: (material: NovoMaterial) => void;
}) {
  const [form, setForm] = useState<Formulario>(VAZIO);
  const [erros, setErros] = useState<Erros>({});
  const criar = useCriarMaterial();
  const unidades = useUnidades(aberta);
  const grupos = useGruposPadrao(aberta);
  const idGrupos = useId();

  const campo = <K extends keyof Formulario>(chave: K) => ({
    value: form[chave],
    onChange: (e: { target: { value: string } }) =>
      setForm((f) => ({ ...f, [chave]: e.target.value as Formulario[K] })),
  });

  const fechar = (aberto: boolean) => {
    if (!aberto) {
      setForm(VAZIO);
      setErros({});
      criar.reset();
    }
    aoMudar(aberto);
  };

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    const novos: Erros = {};
    if (!form.code.trim()) novos.code = "Informe o código.";
    if (!form.short_description.trim()) novos.short_description = "Informe a descrição.";
    if (!form.location.trim()) novos.location = "Informe o local.";
    setErros(novos);
    if (Object.keys(novos).length > 0) return;

    const material: NovoMaterial = {
      code: form.code.trim(),
      short_description: form.short_description.trim(),
      long_description: null,
      unit: form.unit,
      application: null,
      group_1: textoOuNull(form.group_1),
      group_2: textoOuNull(form.group_2),
      location: form.location.trim(),
      notes: null,
      replacement_code: null,
      criticality: form.criticality,
      customer_abc: form.customer_abc || null,
      purchasability: form.purchasability
        ? (Number.parseInt(form.purchasability, 10) as Comprabilidade)
        : null,
    };
    criar.mutate(material, {
      onSuccess: () => {
        aoSalvar(material);
        fechar(false);
      },
    });
  };

  const erroApi =
    criar.error instanceof ApiErro
      ? criar.error.mensagem
      : criar.error
        ? "Não foi possível salvar. Tente de novo."
        : null;

  return (
    <Janela
      aberta={aberta}
      aoMudar={fechar}
      rotulo="Novo cadastro"
      titulo="Adicionar material"
      className="sm:max-w-[720px]"
      rodape={
        <>
          <Botao variant="secundario" size="grande" type="button" onClick={() => fechar(false)}>
            Cancelar
          </Botao>
          <Botao
            size="grande"
            type="submit"
            form={ID_FORM}
            aria-busy={criar.isPending || undefined}
          >
            {criar.isPending ? "Salvando…" : "Salvar material"}
          </Botao>
        </>
      }
    >
      <form
        id={ID_FORM}
        noValidate
        onSubmit={enviar}
        className="grid grid-cols-2 gap-x-4 gap-y-[18px]"
      >
        <Campo
          rotulo="Código"
          placeholder="Ex.: 000123"
          autoComplete="off"
          required
          erro={erros.code}
          {...campo("code")}
        />
        <CampoUnidade
          valor={form.unit}
          aoMudar={(v) => setForm((f) => ({ ...f, unit: v }))}
          unidades={unidades.data}
          carregando={unidades.isPending}
          erro={unidades.isError}
        />
        <Campo
          rotulo="Descrição"
          placeholder="Descrição clara do material"
          required
          className="col-span-2"
          erro={erros.short_description}
          {...campo("short_description")}
        />
        <Campo
          rotulo="Grupo de mercadoria 1"
          placeholder="Padrão Agro MRO ou grupo próprio"
          list={idGrupos}
          {...campo("group_1")}
        />
        <datalist id={idGrupos}>
          {(grupos.data ?? []).map((g) => (
            <option key={g.nome} value={g.nome}>
              Padrão Agro MRO
            </option>
          ))}
        </datalist>
        <Campo
          rotulo="Grupo de mercadoria 2"
          placeholder="Subgrupo associado"
          {...campo("group_2")}
        />
        <p className="col-span-2 -mt-1.5 text-corpo-s text-tinta-500">
          Escolha um grupo do padrão Agro MRO ou digite um próprio. Grupos próprios ficam privados
          no seu espaço.
        </p>
        <Campo rotulo="Local" erro={erros.location} {...campo("location")} />
        <CampoSelecao
          rotulo="Criticidade (XYZ)"
          valor={form.criticality}
          aoMudar={(v) => setForm((f) => ({ ...f, criticality: v as Criticidade }))}
        >
          <option value="noncritical">Não crítico</option>
          <option value="critical">Crítico</option>
          <option value="strategic">Estratégico</option>
        </CampoSelecao>
        <CampoSelecao
          rotulo="Curva ABC do cliente"
          valor={form.customer_abc}
          aoMudar={(v) => setForm((f) => ({ ...f, customer_abc: v as Formulario["customer_abc"] }))}
        >
          <option value="">Não informada</option>
          <option value="A">A · representa 80% do valor</option>
          <option value="B">B · representa 15% do valor</option>
          <option value="C">C · representa 5% do valor</option>
        </CampoSelecao>
        <CampoSelecao
          rotulo="Comprabilidade"
          valor={form.purchasability}
          aoMudar={(v) =>
            setForm((f) => ({ ...f, purchasability: v as Formulario["purchasability"] }))
          }
        >
          <option value="">Não informada</option>
          <option value="1">1 · encontrado em muitos fornecedores</option>
          <option value="2">2 · número reduzido de fornecedores</option>
          <option value="3">3 · exclusividade ou longo prazo</option>
        </CampoSelecao>
        <p className="col-span-2 -mt-1.5 rounded-[10px] bg-verde-50 px-3.5 py-3 text-corpo-s text-tinta-600">
          Curva ABC, criticidade e comprabilidade são informadas por você e entram na matriz de
          nível de serviço.
        </p>
        {erroApi && (
          <p role="alert" className="col-span-2 text-corpo-m font-medium text-status-ruptura-texto">
            {erroApi}
          </p>
        )}
      </form>
    </Janela>
  );
}
