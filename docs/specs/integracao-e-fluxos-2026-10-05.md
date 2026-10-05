# SDD — integração e fluxos definidos até 5 de outubro de 2026

Status: decisões funcionais em consolidação; não é confirmação de API implementada nem de migração aplicada no banco hospedado.

## Fontes e precedência

- O marco de 14 de setembro em `milestone-2026-09-14.md` descreve o MVP local e permanece como referência histórica de sua implementação.
- Este SDD e as decisões datadas em `../project/decisions.md` descrevem os fluxos posteriores discutidos com o grupo. Decisões posteriores do usuário prevalecem quando divergem do marco antigo.
- `../architecture/hosted-database-model-2026-10-05.json` é o retrato da modelagem MySQL recebido em 5 de outubro. `../architecture/hosted-database.sql` é o último script SQL recebido, de 1º de outubro, e já não representa todas as mudanças do retrato. Uma alteração adicional do banco foi anunciada, mas ainda não recebida.
- O backend e o banco são mantidos por outra parte da equipe. Este documento especifica comportamento do mobile e contratos a confirmar; não autoriza presumir que campos ou rotas já estejam disponíveis.

## Compras, produtos e estoque

- Todo produto hospedado pertence a uma compra, e toda compra pertence a uma despensa. A adição manual de um produto deverá consumir a rota de compras e criar uma compra com esse produto.
- `purchases` representa compras operacionais; seus registros também alimentam histórico e dashboards. Compras não devem ser apagadas. Retirar um produto da visualização será uma desativação lógica; saldo zero, por si só, não desativa o produto. Um saldo zerado poderá voltar a receber unidades.
- Cada ocorrência do produto em uma compra mantém ID próprio. O modelo de 5 de outubro separa `pantry_products.quantity` (quantidade comprada) de `current_quantity` (saldo). O histórico e o cálculo do preço unitário devem usar a quantidade comprada, nunca o saldo restante. `pantry_products.price` representa o preço total daquele item na compra; `purchases.total_price` representa o total da compra.
- O front soma o saldo dos registros equivalentes da despensa. Ao reduzir o saldo agregado, o backend consome primeiro o registro da compra mais antiga que ainda tenha saldo; ao aumentar pelo controle de estoque, acrescenta ao registro da compra mais recente. Compras na mesma data podem ser escolhidas em qualquer ordem. Alterações simultâneas de participantes devem ser aplicadas de forma consistente pelo backend, e o front exibe o saldo confirmado pela API.
- Produtos em embalagens ou apresentações diferentes não são somados. Marcas diferentes são registros distintos. O usuário poderá escolher visualizá-los juntos ou separados por marca sem fundir os registros. A persistência dessa preferência ainda não foi definida.
- A medida fracionada de um produto vendido por peso ou volume, como 0,750 kg de carne, será guardada em `content_value` com `unit_of_measure`. `quantity` e `current_quantity` aparecem como inteiros no retrato recebido. A unidade de medida será um enum; os valores finais e a regra para consumo parcial da medida ainda precisam ser confirmados.

## NFC-e e identificação da compra

- A mesma NFC-e não poderá ser importada duas vezes na mesma despensa, mas poderá ser usada em despensas diferentes. A identidade técnica da nota e sua forma de armazenamento serão estudadas com notas reais; o link do QR Code não deve ser presumido como identificador estável.
- Não haverá tabela de mercados no escopo atual. Na importação, o CNPJ virá da nota e o usuário poderá ajustar o nome do mercado. Na adição manual, o front oferecerá sugestões de nomes. O contrato ainda deve definir onde ficam CNPJ, nome escolhido e sugestões.
- O modelo recebido usa `purchases.is_finished` e `finish_date` opcional. Esses campos substituem, no retrato da modelagem, o antigo `finish_products NOT NULL` do script SQL de 1º de outubro. A API e a migração efetiva precisam ser verificadas antes de integrar.

## Listas de compras locais

- Neste fluxo, listas ficam somente no dispositivo; compras realizadas por NFC-e ou adição manual vão ao banco hospedado. As tabelas hospedadas de listas permanecem no retrato do banco, mas não serão usadas para persistir esse fluxo local até nova decisão.
- Quando um produto chegar a zero, o app pergunta se o usuário quer incluí-lo numa lista. Se não houver lista, sugere criar uma com nome e data planejada da compra. A inclusão depende de escolha explícita do usuário.
- Uma despensa pode ter várias listas, para compras previstas em locais ou períodos diferentes. O usuário escolhe a lista de destino; o mesmo produto pode estar em mais de uma lista.
- Neste fluxo, o item da lista apresenta somente o nome do produto, sem marca ou demais atributos. Uma associação técnica local poderá lembrar as listas usadas anteriormente e sugeri-las quando o produto voltar a acabar, sem impedir a escolha de outra lista. A forma dessa associação e o gatilho para produtos agregados ainda precisam ser definidos.
- A lista estimará gastos e poderá comparar locais de compra usando o histórico de preços e locais disponíveis. O cálculo exato e o comportamento quando não houver histórico continuam abertos.
- Listas concluídas podem deixar a tela ativa e continuar no histórico local. Repetir uma lista cria uma nova versão editável; a versão histórica fica intacta. Listas locais não são sincronizadas entre aparelhos pelo fluxo atual.

## Despensas e contas

- A despensa receberá um indicador para deixar de ser exibida sem apagar compras e histórico. Todos os participantes convidados terão as mesmas ações na despensa; não haverá papéis individuais por participante neste escopo.
- O modelo recebido contém `users.is_active` e `pantry_products.is_in_pantry`. O usuário esclareceu que o indicador de atividade do produto servirá à remoção lógica; o nome final da coluna ainda depende do esquema atualizado.

## Tela de Configurações

- Escopo previsto: idioma, ajuste de tamanho de fonte, ativação/desativação de notificações, guia de uso, seção Sobre com versão, nomes da equipe e link do projeto, Política de Privacidade e Termos de Uso.
- Modo claro/escuro é desejado se houver tempo para implementar e validar o tema completo. A organização sugerida é preferências, notificações, ajuda, Sobre e documentos legais; não constitui uma ordem obrigatória de implementação.
- Ao iniciar essa tela, definir idiomas oferecidos, alcance do ajuste de fonte, notificações controladas, conteúdos e links. A entrada atual da navegação ainda informa `Em breve`.

## Fora do escopo atual e validações pendentes

- Automações recorrentes de listas não serão implementadas agora.
- Confirmar o contrato da API, a versão realmente aplicada do banco, os valores do enum e os campos de mercado antes de integrar o backend.
- Verificar com notas reais a identidade estável da NFC-e e o mapeamento de quantidades fiscais fracionadas.
- Testar saldos agregados, consumo por antiguidade, atualizações simultâneas e isolamento de listas locais por conta e despensa quando esses fluxos forem implementados.
