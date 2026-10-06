# SDD — integração e fluxos definidos até 6 de outubro de 2026

Status: decisões funcionais em consolidação; não é confirmação de API implementada nem de migração aplicada no banco hospedado.

## Fontes e precedência

- O marco de 14 de setembro em `milestone-2026-09-14.md` descreve o MVP local e permanece como referência histórica de sua implementação.
- Este SDD e as decisões datadas em `../project/decisions.md` descrevem os fluxos posteriores discutidos com o grupo. Decisões posteriores do usuário prevalecem quando divergem do marco antigo.
- `../architecture/hosted-database-model-2026-10-05.json` é o retrato da modelagem MySQL recebido em 5 de outubro. `../architecture/hosted-database.sql` é o último script SQL recebido, de 1º de outubro, e já não representa todas as mudanças do retrato. Uma alteração adicional do banco foi anunciada, mas ainda não recebida.
- O backend e o banco são mantidos por outra parte da equipe. Este documento especifica comportamento do mobile e contratos a confirmar; não autoriza presumir que campos ou rotas já estejam disponíveis.

## Compras, produtos e estoque

- Todo produto hospedado pertence a uma compra, e toda compra pertence a uma despensa. A adição manual de um produto deverá consumir a rota de compras e criar uma compra com esse produto.
- `purchases` representa compras operacionais; seus registros também alimentam histórico e dashboards. Compras não devem ser apagadas. Produtos novos iniciam com `pantry_products.is_deleted = false`; ao removê-los da visualização, o campo passa a `true`, sem apagar o registro. Saldo zero, por si só, não altera `is_deleted`. Um saldo zerado poderá voltar a receber unidades.
- Cada ocorrência do produto em uma compra mantém ID próprio. O modelo de 5 de outubro separa `pantry_products.quantity` (quantidade comprada) de `current_quantity` (saldo). O histórico e o cálculo do preço unitário devem usar a quantidade comprada, nunca o saldo restante. `pantry_products.price` representa o preço total daquele item na compra; `purchases.total_price` representa o total da compra.
- O front soma o saldo dos registros equivalentes da despensa. Ao reduzir o saldo agregado, o backend consome primeiro o registro da compra mais antiga que ainda tenha saldo; ao aumentar pelo controle de estoque, acrescenta ao registro da compra mais recente. Compras na mesma data podem ser escolhidas em qualquer ordem. Alterações simultâneas de participantes devem ser aplicadas de forma consistente pelo backend, e o front exibe o saldo confirmado pela API.
- Produtos em embalagens ou apresentações diferentes não são somados. Marcas diferentes são registros distintos. O usuário poderá escolher visualizá-los juntos ou separados por marca sem fundir os registros. A persistência dessa preferência ainda não foi definida.
- A medida fracionada de um produto vendido por peso ou volume, como 0,750 kg de carne, será guardada em `content_value` com `unit_of_measure`. `quantity` e `current_quantity` aparecem como inteiros no retrato recebido. A unidade de medida será um enum; os valores finais e a regra para consumo parcial da medida ainda precisam ser confirmados.

## NFC-e e identificação da compra

- A mesma NFC-e não poderá ser importada duas vezes na mesma despensa, mas poderá ser usada em despensas diferentes. O identificador será o código único no início do parâmetro `p` do link do QR Code: extrair o trecho após `p=` e antes do primeiro `|`, descartando os demais segmentos do parâmetro. Esse código será enviado para armazenamento no banco hospedado e usado com a despensa para impedir duplicidade. O nome do campo e o contrato da API ainda precisam ser confirmados.
- Não haverá tabela de mercados no escopo atual. Na importação, o CNPJ virá da nota e o usuário poderá ajustar o nome do mercado. Na adição manual, o front oferecerá sugestões de nomes. O contrato ainda deve definir onde ficam CNPJ, nome escolhido e sugestões.
- O modelo recebido usa `purchases.is_finished` e `finish_date` opcional. Esses campos substituem, no retrato da modelagem, o antigo `finish_products NOT NULL` do script SQL de 1º de outubro. A API e a migração efetiva precisam ser verificadas antes de integrar.

## Listas de compras hospedadas

- As listas deste fluxo serão persistidas no banco hospedado em `grocery_lists` e nas relações correspondentes, incluindo `grocery_lists_pantry_products`. Compras realizadas por NFC-e ou adição manual também serão enviadas ao banco hospedado. A modelagem recebida contém as tabelas, mas a API e o esquema implantado ainda precisam ser confirmados.
- Quando um produto chegar a zero, o app pergunta se o usuário quer incluí-lo numa lista. Se não houver lista, sugere criar uma com nome e data planejada da compra. A inclusão depende de escolha explícita do usuário.
- Uma despensa pode ter várias listas, para compras previstas em locais ou períodos diferentes. O usuário escolhe a lista de destino. Quando o mesmo produto aparecer em duas listas, cada ocorrência corresponderá a um `pantry_products` diferente, com ID próprio e vínculo com sua respectiva lista por `grocery_lists_pantry_products`. Nomes iguais não implicam uma entidade compartilhada nem autorizam fusão automática. A interface pode tratar as ocorrências como semelhantes, preservando a distinção de marcas e apresentações já definida para produtos da despensa.
- Neste fluxo, o item da lista apresenta somente o nome do produto, sem marca ou demais atributos. O sistema deverá lembrar as listas usadas anteriormente e sugeri-las quando o produto voltar a acabar, sem impedir a escolha de outra lista. A relação necessária para essa sugestão e o gatilho para produtos agregados ainda precisam ser definidos com o backend.
- A lista estimará gastos e poderá comparar locais de compra usando o histórico de preços e locais disponíveis. O cálculo exato e o comportamento quando não houver histórico continuam abertos.
- Listas concluídas podem deixar a tela ativa e continuar no histórico hospedado. Repetir uma lista cria uma nova versão editável; a versão histórica fica intacta. O modelo recebido não explicita os campos de despensa, data planejada e estado/histórico da lista; a representação desses dados e a sincronização entre participantes precisam constar do contrato do backend.
- A entrada em listas de compras pela Navbar abre primeiro uma seleção da despensa. A página da despensa exibe apenas listas ativas; o histórico de listas concluídas é aberto por um botão próprio em modal. A retirada de itens de uma lista usa um modo de seleção com confirmação, separado da marcação de itens comprados.
- O modelo recebido exige `pantry_products.purchase_id`, mas uma lista pode conter itens antes de existir uma compra. O backend deverá definir como criar essas ocorrências distintas sem atribuir uma compra fictícia nem alterar o histórico de compras; essa parte do contrato segue em aberto.

## Despensas e contas

- A despensa receberá um indicador para deixar de ser exibida sem apagar compras e histórico. Todos os participantes convidados terão as mesmas ações na despensa; não haverá papéis individuais por participante neste escopo.
- O indicador do usuário permanece `users.is_active` no modelo recebido. Para produtos, a decisão de 6 de outubro define `pantry_products.is_deleted` como booleano, iniciado em `false` e alterado para `true` na remoção lógica. O retrato de 5 de outubro ainda mostra `is_in_pantry`, nome anterior à correção; confirmar o esquema implantado antes da integração.

## Tela de Configurações

- Escopo previsto: idioma, ajuste de tamanho de fonte, ativação/desativação de notificações, guia de uso, seção Sobre com versão, nomes da equipe e link do projeto, Política de Privacidade e Termos de Uso.
- Modo claro/escuro é desejado se houver tempo para implementar e validar o tema completo. A organização sugerida é preferências, notificações, ajuda, Sobre e documentos legais; não constitui uma ordem obrigatória de implementação.
- Ao iniciar essa tela, definir idiomas oferecidos, alcance do ajuste de fonte, notificações controladas, conteúdos e links. A entrada atual da navegação ainda informa `Em breve`.

## Fora do escopo atual e validações pendentes

- Automações recorrentes de listas não serão implementadas agora.
- Confirmar o contrato da API, a versão realmente aplicada do banco, os valores do enum e os campos de mercado antes de integrar o backend.
- Validar com notas reais a extração do código do parâmetro `p` e o mapeamento de quantidades fiscais fracionadas.
- Testar saldos agregados, consumo por antiguidade, atualizações simultâneas e o vínculo das listas hospedadas à despensa e aos participantes quando esses fluxos forem implementados.
