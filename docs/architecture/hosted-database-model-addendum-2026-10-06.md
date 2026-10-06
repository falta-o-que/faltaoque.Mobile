# Aditivo ao modelo do banco — 6 de outubro de 2026

O arquivo recebido do grupo continua preservado sem alterações em `hosted-database-model-2026-10-06.json`. Conforme confirmação posterior do usuário, o modelo adotado pelo aplicativo inclui também estes dois campos que faltaram no desenho original:

| Tabela | Campo | Tipo | Regra | Uso |
| --- | --- | --- | --- | --- |
| `grocery_lists` | `is_finished` | `BOOLEAN` | `NOT NULL`, padrão `false` | `false` significa lista ativa; `true`, concluída. |
| `grocery_list_products` | `category_id` | `INTEGER` | `NOT NULL`, chave estrangeira para `categories.id` | Categoria do item planejado. |

O `category_id` usa a mesma tabela de categorias já referenciada por `pantry_products.category_id`. O adaptador local combina este aditivo ao JSON original; ele não altera o arquivo recebido do grupo. A implantação hospedada e o contrato da API ainda precisam incluir os mesmos campos.
