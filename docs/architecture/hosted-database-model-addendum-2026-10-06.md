# Aditivo histórico ao modelo do banco — 6 de outubro de 2026

> Este aditivo foi supersedido pelo JSON oficial fechado recebido em 8 de outubro de 2026, preservado sem alterações em `hosted-database-model-2026-10-08.json`. Use o arquivo de 8 de outubro como referência atual.

O arquivo recebido do grupo continua preservado sem alterações em `hosted-database-model-2026-10-06.json`. Conforme confirmação posterior do usuário, o modelo adotado pelo aplicativo inclui também estes dois campos que faltaram no desenho original:

| Tabela | Campo | Tipo | Regra | Uso |
| --- | --- | --- | --- | --- |
| `grocery_lists` | `is_finished` | `BOOLEAN` | `NOT NULL`, padrão `false` | Campo confirmado em 6 de outubro; substituído por `is_active` no modelo fechado de 8 de outubro. |
| `grocery_list_products` | `category_id` | `INTEGER` | `NOT NULL`, chave estrangeira para `categories.id` | Categoria do item planejado. |

O `category_id` usa a mesma tabela de categorias já referenciada por `pantry_products.category_id` e agora aparece no JSON oficial de 8 de outubro. A implantação hospedada e o contrato da API ainda precisam ser verificados separadamente.
