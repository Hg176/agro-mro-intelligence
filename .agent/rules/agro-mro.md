# Regra do workspace — Agro MRO Intelligence

Você está trabalhando no Agro MRO Intelligence: uma plataforma de análise e parametrização de estoque MRO (FastAPI + SQLAlchemy, React + TypeScript + Vite, motor matemático V3 em Python). O Hugo lidera o desenvolvimento e decide as questões técnicas. O Sander é dono do domínio e decide regras e fórmulas.

## Antes de qualquer tarefa

1. Leia `docs/contexto/CONTEXTO-AGRO-MRO-INTELLIGENCE.md` inteiro na primeira tarefa da sessão. É o resumo de tudo. Nas tarefas seguintes, releia só as seções relevantes.
2. Se existir `AGENTS.md` na raiz, leia também. Ele traz a governança original do projeto.
3. Responda e documente em português do Brasil.

## Quando consultar cada arquivo

Consulte o arquivo indicado **antes** de escrever código naquele assunto. Não trabalhe de memória.

| Se a tarefa envolve... | Consulte primeiro |
|---|---|
| Entender o produto, o público, o glossário, os papéis | CONTEXTO §1–4 |
| Fórmula, ES, PP, EM, cenário, quantum, nível de serviço, quantil, TMEA | CONTEXTO §7–8 → `docs/referencia/contrato/` (a versão mais nova vale) → `docs/fluxogramas/D05_MOTOR_MATEMATICO_V3.drawio` → `resumido/01-fluxo-interno-desenvolvedor.drawio` (página 2) |
| ABC, PQR, XYZ, Comprabilidade, classe N, janela do MD, saldos, giro, cobertura | CONTEXTO §5–6 → `D04_PREPARACAO_CLASSIFICACAO.drawio` → contrato |
| Tabela, coluna, migração, troca de banco, modelo de dados | CONTEXTO §9 → `D09_MODELO_DADOS.drawio` (uma página por tabela) → `backend/app/models.py`, `lineage_models.py`, `planning_work_models.py` |
| Importação de planilhas, prévia, append/replace, recibos | CONTEXTO §10.5 → `D03_IMPORTACAO.drawio` → `D10_SEQUENCIAS.drawio` (página 1) |
| Visão geral, dashboard, ficha do material, Trilha do estoque | CONTEXTO §10.1, §10.6 → `D06_DASHBOARD_FICHA.drawio` → `D10_SEQUENCIAS.drawio` (página 2) |
| Simulação, validação, fila, ciclos, emissão do Excel, aplicação | CONTEXTO §10.7 → `D07_SIMULACAO_PLANEJAMENTO.drawio` → `D08_CICLOS_APLICACAO.drawio` → `D10_SEQUENCIAS.drawio` (páginas 3–5) |
| Erro, falha, retry, gravação incerta, recuperação | CONTEXTO §10.8 → `D12_ERROS_RECUPERACAO.drawio` |
| Login, autenticação, multi-tenant, isolamento, segurança, LGPD | CONTEXTO §15 → `D11_SEGURANCA_RASTREABILIDADE.drawio` → `D01_ARQUITETURA.drawio` |
| Arquitetura, deploy, Docker, Nginx, hospedagem | CONTEXTO §11 e §20.1 → `D01_ARQUITETURA.drawio` |
| Jornada do usuário de ponta a ponta | `resumido/02-jornada-cliente.drawio` → `D02_JORNADA_INTEGRADA.drawio` |
| Qualquer tela, componente, layout, texto de interface | `docs/referencia/ux/leis-ux-agro-mro.html` (obrigatório) → `ideias-design-agro-mro.html` → CONTEXTO §17–18 |
| Cobrança, assinatura, Asaas, inadimplência, somente leitura | CONTEXTO §16 |
| Estado de uma etapa (P0–P13), o que está aceito, o que falta | CONTEXTO §12–14 → `docs/referencia/plano/` (leia só o **topo**: o corpo é histórico preservado) |
| O que o Sander quer mudar ou tirar das telas | CONTEXTO §18 → `docs/referencia/reunioes/2026-11-02-reuniao-sander.md` |
| Não sabe onde algo está documentado | `docs/fluxogramas/INDICE.md` |

Os `.drawio` são XML. Para lê-los, extraia os atributos `value` das células `mxCell` (cada `<diagram name="...">` é uma página). Não edite os `.drawio` sem pedido.

## Regras que não se quebram

1. Não altere fórmula, corte de classificação, matriz de nível de serviço ou regra de cenário sem decisão do Sander registrada. Se achar erro matemático, explique com exemplo numérico e pare.
2. Não altere o Golden Master, as fixtures ou os oráculos para fazer teste passar.
3. Ausente ≠ zero ≠ padrão. NC (não calculável) e ND (não declarado) são estados com motivo, nunca zero.
4. SKU e Local são texto (zeros à esquerda). A unidade de análise é workspace + SKU + Local.
5. Toda query, rota, job, cache e arquivo filtra pelo workspace do usuário autenticado. Recurso de outro workspace responde 404. Toda rota nova vem com teste de acesso cruzado.
6. O frontend não calcula matemática; só mostra o que o backend devolve, com origem e período.
7. Simular não aplica, validar não aplica, exportar não confirma aplicação. Escrita incerta nunca tem retry automático.
8. Nenhum segredo em código ou commit. Nenhum dado real de cliente em teste, log ou print.
9. Sem agentes de IA dentro do produto no MVP.
10. Ao terminar, diga o que foi testado, o que não foi e o que depende do Hugo ou do Sander.

## Se houver conflito entre fontes

Instrução do Hugo na conversa > CONTEXTO > Contrato matemático mais recente > topo do Plano Único > diagramas > transcrição da reunião. Em regra de negócio, a palavra final é do Sander: pergunte, não decida.
