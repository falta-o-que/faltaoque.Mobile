# SDD — integração e fluxos definidos até 8 de outubro de 2026

Status: decisões funcionais em consolidação; não é confirmação de API implementada nem de migração aplicada no banco hospedado.

## Fontes e precedência

- O marco de 14 de setembro em `milestone-2026-09-14.md` descreve o MVP local e permanece como referência histórica de sua implementação.
- Este SDD e as decisões datadas em `../project/decisions.md` descrevem os fluxos posteriores discutidos com o grupo. Decisões posteriores do usuário prevalecem quando divergem do marco antigo.
- `../architecture/hosted-database-model-2026-10-05.json` é o retrato inicial da modelagem MySQL recebido em 5 de outubro. `../architecture/hosted-database.sql` é o último script SQL recebido, de 1º de outubro, e já não representa as mudanças dos retratos posteriores.
- O modelo oficial fechado recebido em 8 de outubro está preservado em `../architecture/hosted-database-model-2026-10-08.json`; ele atualiza a referência recebida em 6 de outubro. Ainda não confirma o esquema implantado nem o contrato da API.
- O backend e o banco são mantidos por outra parte da equipe. Este documento especifica comportamento do mobile e contratos a confirmar; não autoriza presumir que campos ou rotas já estejam disponíveis.

## Compras, produtos e estoque

- Todo produto hospedado pertence a uma compra, e toda compra pertence a uma despensa. A adição manual de um produto deverá consumir a rota de compras e criar uma compra com esse produto.
- `purchases` representa compras operacionais; seus registros também alimentam histórico e dashboards. Compras não devem ser apagadas. Produtos novos iniciam com `pantry_products.is_deleted = false`; ao removê-los da visualização, o campo passa a `true`, sem apagar o registro. Saldo zero, por si só, não altera `is_deleted`. Um saldo zerado poderá voltar a receber unidades.
- Cada ocorrência do produto em uma compra mantém ID próprio. O modelo de 5 de outubro separa `pantry_products.quantity` (quantidade comprada) de `current_quantity` (saldo). O histórico e o cálculo do preço unitário devem usar a quantidade comprada, nunca o saldo restante. `pantry_products.price` representa o preço total daquele item na compra; `purchases.total_price` representa o total da compra.
- O front soma o saldo dos registros equivalentes da despensa. Ao reduzir o saldo agregado, o backend consome primeiro o registro da compra mais antiga que ainda tenha saldo; ao aumentar pelo controle de estoque, acrescenta ao registro da compra mais recente. Compras na mesma data podem ser escolhidas em qualquer ordem. Alterações simultâneas de participantes devem ser aplicadas de forma consistente pelo backend, e o front exibe o saldo confirmado pela API.
- Produtos em embalagens ou apresentações diferentes não são somados. Marcas diferentes são registros distintos. O usuário poderá escolher visualizá-los juntos ou separados por marca sem fundir os registros. A persistência dessa preferência ainda não foi definida.
- A medida fracionada de um produto vendido por peso ou volume, como 0,750 kg de carne, será guardada em `content_value` com `unit_of_measure`. `quantity` e `current_quantity` aparecem como inteiros no retrato recebido. A unidade de medida será um enum; os valores finais e a regra para consumo parcial da medida ainda precisam ser confirmados.

## NFC-e e identificação da compra

- A mesma NFC-e não poderá ser importada duas vezes na mesma despensa, mas poderá ser usada em despensas diferentes. O identificador será o código único no início do parâmetro `p` do link do QR Code: extrair o trecho após `p=` e antes do primeiro `|`, descartando os demais segmentos do parâmetro. O modelo final recebido em 6 de outubro nomeia o campo `purchases.qr_code_id`; rota, formato aceito e validação do contrato da API ainda precisam ser confirmados.
- A decisão inicial de não criar tabela de mercados foi substituída pela decisão de 8 de outubro registrada abaixo. Na importação, o CNPJ ainda pode vir da nota, mas não substitui o vínculo ao mercado escolhido.
- O modelo recebido usa `purchases.is_finished` e `finish_date` opcional. Esses campos substituem, no retrato da modelagem, o antigo `finish_products NOT NULL` do script SQL de 1º de outubro. A API e a migração efetiva precisam ser verificadas antes de integrar.

## Listas de compras hospedadas

- As listas deste fluxo serão persistidas no banco hospedado em `grocery_lists` e `grocery_list_products`; itens planejados não são `pantry_products` e não usam `grocery_lists_pantry_products`. Compras realizadas por NFC-e ou adição manual também serão enviadas ao banco hospedado. A API e o esquema implantado ainda precisam ser confirmados.
- Quando um produto chegar a zero, o app pergunta se o usuário quer incluí-lo numa lista. Se não houver lista, sugere criar uma com nome e data planejada da compra. A inclusão depende de escolha explícita do usuário.
- Uma despensa pode ter várias listas, para compras previstas em locais ou períodos diferentes. O usuário escolhe a lista de destino. Cada item ainda planejado fica em `grocery_list_products` com seu próprio ID e `grocery_list_id`; nomes repetidos em listas diferentes não implicam entidade compartilhada nem fusão automática. Após a compra, os produtos de estoque são registrados em `pantry_products` e ligados à compra.
- Neste fluxo, o item da lista apresenta somente o nome do produto, sem marca ou demais atributos. O sistema deverá lembrar as listas usadas anteriormente e sugeri-las quando o produto voltar a acabar, sem impedir a escolha de outra lista. A relação necessária para essa sugestão e o gatilho para produtos agregados ainda precisam ser definidos com o backend.
- Atualização de 6 e 8 de outubro: a estimativa usa compras da mesma despensa e busca itens pelo nome normalizado; unidade e conteúdo priorizam apresentações iguais quando disponíveis. O preço por ocorrência comprada é `price / quantity`, e o estimador-base usa a mediana das até três observações mais recentes. Quando `grocery_lists.location` contém o CEP do mercado escolhido, a soma de `grocery_lists.estimated_price` deve usar apenas o histórico de compras (`purchases.location`) daquele CEP. Itens sem histórico nesse mercado não entram na soma; o app informa quais faltam para aproximar a estimativa. CEP e valor estimado permanecem na lista para o histórico, e o CEP também é gravado em `purchases.location` ao concluir a lista. Sem CEP na lista ativa, as sugestões controlam o cartão e cada opção pode exibir a estimativa para o mercado sugerido. Remover o CEP da lista ativa reabre as opções de sugestão; os CEPs de compras já concluídas permanecem no histórico. A sugestão de custo-benefício compara o total estimado por CEP; proximidade usa os CEPs distintos do histórico e o CEP da despensa via Maps; marcas são inferidas de `pantry_products.brand` no histórico por mercado, sem coluna de marca em `grocery_list_products`. Listas concluídas preservam seu total estimado e CEP. O contrato da API e a implantação ainda precisam ser verificados.
- Listas concluídas podem deixar a tela ativa e continuar no histórico hospedado. Repetir uma lista cria uma nova versão editável; a versão histórica fica intacta. O modelo final já explicita despensa e data, mas não estado ativo/concluído; a representação do histórico e a sincronização entre participantes precisam constar do contrato do backend.
- A entrada em listas de compras pela Navbar abre primeiro uma seleção da despensa. A página da despensa exibe apenas listas ativas; o histórico de listas concluídas é aberto por um botão próprio em modal. A retirada de itens de uma lista usa um modo de seleção com confirmação, separado da marcação de itens comprados.
- O modelo final separa itens planejados (`grocery_list_products`) de produtos comprados (`pantry_products`, com `purchase_id` obrigatório), sem exigir compra fictícia para uma lista. O contrato da API ainda precisa definir como a conclusão converte os itens planejados em compra e estoque.

## Atualização do modelo recebida em 8 de outubro

O JSON oficial fechado recebido em 8 de outubro, preservado em `docs/architecture/hosted-database-model-2026-10-08.json`, define `grocery_lists.pantry_id`, `date`, `location`, `suggestion`, `estimated_price` e `is_active`. `is_active` é `true` para lista ativa e `false` para concluída; substitui o campo `is_finished` do aditivo de 6 de outubro. Cada item planejado fica em `grocery_list_products`, com nome, quantidade, medida, marcação de retirada, `category_id` (chave para `categories.id`) e chave da lista. `pantry_products` mantém `is_in_pantry` e também `is_deleted`; a remoção lógica usa `is_deleted`, conforme a decisão de 6 de outubro. `purchases.qr_code_id` é a coluna disponível para guardar o código da NFC-e extraído do parâmetro `p`.

## Decisão posterior de 8 de outubro: mercado como entidade

O usuário aprovou uma entidade `markets` com `id` interno, CEP, latitude e longitude. O CEP não é único; as coordenadas permitem distinguir unidades no mesmo CEP. `grocery_lists` e `purchases` passam a referenciar o mercado escolhido por `market_id` opcional. O nome escolhido pelo usuário permanece local no aparelho. O `place_id` do Google não será chave primária. A modelagem está detalhada em `../architecture/markets-model-addendum-2026-10-08.md`.

Esta decisão substitui as regras anteriores de comparação e associação de histórico exclusivamente por CEP. As estimativas e sugestões devem agrupar compras e listas por `market_id`; CEP segue disponível no registro relacionado `markets`. Durante a transição, os campos `location` do modelo oficial devem ser preservados até que o backend defina o backfill e publique o contrato. O JSON oficial recebido em 8 de outubro continua sendo a fotografia do modelo anterior, não a confirmação de implantação dessa alteração.

### Regra posterior de embalagem para a estimativa — 8 de outubro de 2026

Peso/volume de um item planejado é opcional; a categoria é obrigatória, conforme `grocery_list_products.category_id`. Sem peso/volume, o estimador escolhe a apresentação histórica mais recorrente dentro da categoria no mercado considerado, usando recência para desempatar, e calcula o preço do pacote pelas até três ocorrências mais recentes dessa apresentação. Se não houver histórico nessa categoria, o estimador usa as ocorrências compatíveis pelo nome em outras categorias. Com peso/volume informado, a apresentação exata tem prioridade; sem uma correspondência exata, o valor é normalizado por g/ml dentro da mesma unidade de medida para estimar o tamanho solicitado.

### Sugestões de mercado e fixture local de desenvolvimento — 8 de outubro de 2026

- Quando a lista ativa não tem mercado definido, o cartão oferece três tipos: **Mais perto**, **Melhor custo-benefício** e **Marcas mais compradas**. O usuário pode trocar o tipo de sugestão e ver o mercado e a estimativa correspondente. Se escolher um CEP/mercado na lista, esse mercado determina a estimativa e o histórico da compra; remover o mercado volta a habilitar as sugestões.
- As candidatas vêm dos mercados vinculados a compras do histórico da mesma despensa (`purchases.market_id`). A proximidade compara a localização da despensa geocodificada pelo Google Maps com latitude/longitude dos mercados. Custo-benefício compara cobertura e total estimado por mercado. A preferência de marca é inferida de `pantry_products.brand` e da disponibilidade dessa marca no histórico de cada mercado; não se adiciona coluna de marca aos itens planejados.
- Em desenvolvimento, a fixture usa três estabelecimentos reais da zona sul de São Paulo e produtos/marcas reais para uma lista com categoria obrigatória e embalagens definidas. Ela cria compras anteriores sintéticas para que as opções possam ser exercitadas sem recibos do usuário. Os preços são referências demonstrativas, não preços transacionais, ofertas válidas ou cotações ao vivo. A fixture não pode ser criada em produção nem sobrescrever compras/listas reais; sua limpeza fica limitada aos marcadores exatos de demonstração.
- Na fixture de 8 de outubro, use a Estação São Judas, Av. Jabaquara, 2438, como endereço de teste da despensa. A validação por Maps/ADB no aparelho permanece pendente, mesmo após o bundle Android compilar.

## Despensas e contas

- A despensa receberá um indicador para deixar de ser exibida sem apagar compras e histórico. Todos os participantes convidados terão as mesmas ações na despensa; não haverá papéis individuais por participante neste escopo.
- O indicador do usuário é `users.is_active`. O modelo final de 6 de outubro contém tanto `pantry_products.is_in_pantry` quanto `pantry_products.is_deleted`; a remoção lógica usa `is_deleted`, iniciado em `false` e alterado para `true`. Confirmar a implantação do JSON antes da integração.

## Tela de Configurações

- Escopo previsto: idioma, ajuste de tamanho de fonte, ativação/desativação de notificações, guia de uso, seção Sobre com versão, nomes da equipe e link do projeto, Política de Privacidade e Termos de Uso.
- Modo claro/escuro é desejado se houver tempo para implementar e validar o tema completo. A organização sugerida é preferências, notificações, ajuda, Sobre e documentos legais; não constitui uma ordem obrigatória de implementação.
- Ao iniciar essa tela, definir idiomas oferecidos, alcance do ajuste de fonte, notificações controladas, conteúdos e links. A entrada atual da navegação ainda informa `Em breve`.

## Fora do escopo atual e validações pendentes

- Automações recorrentes de listas não serão implementadas agora.
- Confirmar o contrato da API, a versão realmente aplicada do banco, os valores do enum e os campos de mercado antes de integrar o backend.
- Validar com notas reais a extração do código do parâmetro `p` e o mapeamento de quantidades fiscais fracionadas.
- Testar saldos agregados, consumo por antiguidade, atualizações simultâneas e o vínculo das listas hospedadas à despensa e aos participantes quando esses fluxos forem implementados.
