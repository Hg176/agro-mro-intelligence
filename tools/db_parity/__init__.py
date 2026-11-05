"""Ferramentas de prova de paridade SQLite x PostgreSQL (Fase A).

Genéricas: recebem URL e MetaData por parâmetro. Não conhecem o modelo do produto.

- safety:          recusa bancos que não sejam de teste descartável
- audit_types:     lista colunas com tipos arriscados para a migração
- canonical_dump:  exporta tabelas para JSON canônico (comparável byte a byte)
- compare:         compara dois dumps canônicos, sem tolerância numérica
"""
