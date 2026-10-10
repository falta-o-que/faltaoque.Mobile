# Decisões do projeto

As decisões mais recentes prevalecem quando uma proposta ou anotação anterior descreve outro fluxo. O SDD `../specs/integracao-e-fluxos-2026-10-05.md` reúne os fluxos posteriores ao MVP, com atualizações datadas até 9 de outubro de 2026. Ele descreve requisitos e decisões, sem afirmar que a API ou o banco hospedado estejam implementados.

## 2026-10-09 - Identidade do APK de produção

O nome público do app é `FaltaOquê?`; o identificador Android escolhido é `com.faltaoque.app`. O perfil EAS `production` gera APK para instalação direta. A equipe quer incluir o nome do projeto e os cinco créditos em uma futura tela Sobre/Créditos e nos materiais do projeto. Nenhuma razão social foi informada; `Projeto FaltaOquê?` é o nome do projeto e não deve ser apresentado como empresa registrada. Detalhes e ativos ficam em [`app-identity.md`](app-identity.md).

## 2026-10-09 - Data planejada da lista é opcional

A data informada ao criar, editar ou repetir uma lista é apenas uma previsão e pode ficar em branco. Se preenchida, deve ser uma data real igual ou posterior ao dia atual do aparelho. A data efetiva da compra (`purchases.purchase_date`) é obrigatória no registro da compra e deve ser definida no momento em que a lista é concluída; ela não é a data planejada do formulário.

## 2026-10-09 - Status das sugestões por mercado

O usuário considera validado no Android o fluxo atual de endereço da despensa, identificação dos mercados e estimativas exibidas. A fixture demonstrativa permanece desativada. A entidade `markets`, seus vínculos com compras/listas e o tratamento do histórico antigo serão ajustados no banco hospedado pela equipe responsável; não são pendências atuais do mobile. A revisão da proteção da chave do Maps para produção também não faz parte das pendências desta etapa.

## 2026-10-09 - Encerramento atual da página de listas

O usuário considera a página de listas de compras concluída e validada no Android. A fixture demonstrativa continua desativada. Os próximos trabalhos relacionados a essa página são refazer o fluxo de finalização de lista e revisar a normalização de produtos; o escopo dessas alterações será detalhado quando forem iniciadas.

## 2026-10-09 - Revisão de compra consistente com a entrada por QR da despensa

Os cards da revisão da lista e da revisão direta por QR Code na despensa compartilham a mesma estrutura visual, o mesmo editor (nome, marca, quantidade, preços, embalagem, unidade e categoria) e os mesmos controles de categoria. Informações próprias da lista, como vínculo e conflito de categoria, aparecem no card recolhido, sem alterar o editor compartilhado. As etapas da revisão fiscal são dinâmicas: uma etapa só aparece enquanto houver itens pendentes nela; vínculos resolvidos e linhas fiscais já confirmadas como produto novo ou ignoradas não mantêm etapas vazias no fluxo.

## 2026-10-09 - Direção para finalizar listas e normalizar produtos

Ao finalizar uma lista, o usuário poderá escolher entre informar os dados manualmente ou ler o QR Code de uma NFC-e. Ambos os caminhos terão data da compra limitada ao dia atual ou a datas anteriores e seleção opcional do mercado pelo Google Places. Na leitura fiscal, o app tentará relacionar os itens reconhecidos com os itens da lista e preencher quantidade, preço e marca quando disponíveis. Qualquer item da nota que não puder ser vinculado deverá ser destacado para revisão; antes de adicionar à despensa, o usuário decide explicitamente se será incluído ou ignorado, podendo corrigir o vínculo e completar os dados manualmente.

O nome fiscal deve ser normalizado para um nome de produto legível, separando a marca quando reconhecível. Exemplo: `CAIXA DE CHOCOLATE PRESTIGIO NESTLE` resulta em `Caixa de Chocolate Prestígio`, com marca `Nestlé`. O item de `grocery_list_products` é genérico e não recebe marca; ao finalizar, a compra cria ocorrências em `pantry_products`, onde a marca identificada ou informada é registrada. Compras futuras do mesmo produto permanecem ocorrências separadas, cada uma ligada à sua `purchases` e com seu próprio ID, preço, `quantity` comprada e `current_quantity` disponível. O front soma `current_quantity` para exibir o saldo de ocorrências equivalentes com mesma apresentação/tamanho/unidade; tamanhos diferentes ficam separados. Marcas, inclusive a ausência de marca, continuam distinguíveis, com opção de exibir saldos juntos ou separados por marca sem fundir ocorrências. Ao reduzir saldo agregado, consome-se primeiro o registro mais antigo com saldo; ao aumentar, acrescenta-se ao registro mais recente. O adaptador local deve espelhar esse comportamento para o modelo hospedado, sem alterar o esquema remoto.

Antes de confirmar, a revisão deve mostrar a descrição original da nota, os dados reconhecidos e exatamente como cada produto será nomeado, marcado, dimensionado, vinculado e exibido na despensa. O usuário pode corrigir esses campos; reconhecimento ou vínculo ambíguo não pode alterar o produto silenciosamente. O esquema hospedado não tem campo próprio para descrição original de cada linha fiscal nem identificador canônico de produto. Não acrescentar tabela ou coluna à nuvem. Quando necessário à experiência do front, metadados auxiliares e preferências podem ser mantidos apenas no armazenamento local do aparelho, fora do contrato remoto. Após confirmar, o produto comprado usa os campos existentes, com nome normalizado em `pantry_products.name` e marca em `pantry_products.brand`. O saldo exibido é a soma determinística de `current_quantity` das ocorrências equivalentes de mesmo nome normalizado e tamanho/unidade; cada ID/compra permanece separado, `quantity` continua representando o que foi originalmente comprado e a soma não usa correspondência difusa. A visualização agrupada por marca calcula o total do grupo sem fundir ocorrências. Redução do saldo agregado consome primeiro o registro mais antigo com saldo; aumento acrescenta ao mais recente. O adaptador local deve reproduzir essas regras do fluxo hospedado.

Na finalização por NFC-e, `purchases.purchase_date` vem da data extraída da nota, é mostrada preenchida e não pode ser editada. Na finalização manual, a data pode ser escolhida pelo usuário dentro das regras já definidas; para preço, a interface pode receber preço unitário ou total do item e o front converte para `pantry_products.price` (total da ocorrência) e `purchases.total_price` (total da compra), sem mudar o modelo. Itens novos usam a categoria da lista. Se o item vinculado já existir na despensa com outra categoria, o app mostra o conflito e o usuário escolhe qual categoria manter; ainda falta definir se essa escolha atualiza só a nova ocorrência ou também ocorrências históricas equivalentes. O sistema sempre tenta vincular automaticamente; quando não conseguir determinar vínculo seguro, pede a resolução manual. A preferência de exibição das marcas é local por conta e despensa, por nome e tamanho, e é solicitada novamente após reinstalação. A pergunta aparece quando houver duas ocorrências com mesmo nome normalizado e tamanho equivalente, mesmo que as marcas sejam diferentes; reaparece a cada nova ocorrência e não faz parte do modal de filtros.

Ao comparar lista e nota, avisar quando houver itens da lista não localizados e exibir separadamente as linhas fiscais que ficaram sem vínculo. O usuário pode vincular uma linha manualmente; uma linha fiscal sem correspondência pode ser adicionada como produto novo com dados preenchidos manualmente ou ignorada. Para um item da lista ausente da nota, o usuário decide entre registrá-lo manualmente com os dados da compra ou não adicioná-lo à despensa. O vínculo é um para um: cada linha fiscal pode ser associada a no máximo um item genérico da lista, e cada item genérico pode ser usado por no máximo uma linha fiscal. Cada linha fiscal confirmada cria sua própria ocorrência em `pantry_products`, preservando marca, compra e preço. O usuário escolhe se ocorrências de marcas diferentes aparecem juntas ou separadas na despensa; a escolha só altera a visualização e não funde registros.

Pendências de planejamento: definir se a lista vai ao histórico/concluída quando alguns itens não forem comprados e se a escolha de categoria em conflito altera apenas a nova ocorrência ou também as antigas.

## 2026-10-09 - Fechamento do fluxo de finalização da lista

Ao concluir uma lista, ela vai para o histórico mesmo quando alguns itens não forem comprados; os itens não comprados não são adicionados ao estoque. Quando houver conflito de categoria entre o produto planejado e uma ocorrência existente, a escolha do usuário vale somente para a nova ocorrência, preservando as históricas. A escolha de agrupar ou separar marcas é solicitada quando houver duas ocorrências com o mesmo nome normalizado e tamanho equivalente, mesmo quando as marcas forem diferentes; aplica-se à apresentação daquele nome e tamanho, fica salva localmente por conta e despensa, e é perguntada novamente a cada nova ocorrência. Antes de salvar, o usuário confirma que compreendeu que a decisão não poderá ser desfeita; ao voltar, retorna às opções de juntar ou separar. A opção não aparece no modal de filtros. Após reinstalar o aplicativo, a preferência local é solicitada novamente.

## 2026-10-09 - Revisão da compra em etapas e vínculos únicos

A revisão da NFC-e deve separar o fluxo em etapas: mostrar primeiro os vínculos automáticos encontrados; depois permitir relacionar manualmente as linhas fiscais restantes aos itens da lista; em seguida apresentar os itens da lista que não apareceram na nota; por fim, mostrar as linhas fiscais ainda sem vínculo para o usuário incluir como produtos novos ou ignorar. Itens da lista ausentes da nota podem ser adicionados manualmente ou descartados. Uma linha fiscal só pode se relacionar com um item da lista, e cada item da lista só pode ser usado por uma linha fiscal. A mesma regra vale para vínculos automáticos e manuais; opções já usadas ficam indisponíveis. Os cards da revisão devem reutilizar o componente de item de lista existente. A comparação deve entender abreviações fiscais comuns, incluindo `Bic.` e `Bisc.` como Biscoito e `Rech.` como Recheio, removendo os pontos do nome normalizado e preservando a descrição original da nota para conferência. A decisão de vínculo continua conservadora em caso de ambiguidade.

## 2026-10-09 - Tratamento padronizado de erros no mobile

Erros mostrados ao usuário passam por um catálogo central que traduz códigos conhecidos e só preserva mensagens de domínio explicitamente aprovadas. Detalhes técnicos inesperados não aparecem na tela; a interface usa uma mensagem curta e contextual. Validações aparecem junto ao campo; falhas de carregamento mantêm uma ação visível de tentar novamente; falhas de operação preservam os dados preenchidos e explicam o próximo passo quando conhecido. Erros inline e estados de falha anunciam a mensagem a tecnologias assistivas. Mensagens específicas de configuração das APIs Places e Geocoding continuam distinguindo chave, API desabilitada e faturamento.

## 2026-10-09 - Seleção obrigatória de endereço sugerido

Campos de endereço e mercado aceitam somente uma sugestão selecionada do Google Places. Texto digitado sem seleção não pode ser salvo; ao não haver resultados, a busca explica que é necessário selecionar um endereço sugerido ou limpar o campo opcional. A seleção continua dependendo de Place Details válido, com CEP e coordenadas disponíveis.

## 2026-10-09 - Identificação visual de preços estimados

Valores calculados para listas de compras devem ser identificados claramente como estimativas, em especial nos cartões e opções das sugestões de mercado. A interface informa que são calculados a partir do histórico de compras e podem variar. Preços que o usuário informa ao concluir uma lista continuam sendo valores reais pagos e não devem receber o rótulo de estimativa.

## 2026-10-08 - Persistência da expansão das listas

O estado aberta/recolhida de cada lista ativa deve ser restaurado quando o usuário voltar à página de listas. O app guarda localmente os IDs das listas recolhidas, isolados por conta e despensa; essa preferência de interface não faz parte dos dados da lista nem do backend. IDs de listas que já não estão ativas são ignorados ao restaurar o estado.

## 2026-10-08 - Mercados como entidade relacionada

Para sugestões e histórico, o mercado passa a ser uma entidade própria, pois CEP não identifica uma unidade de mercado de forma única. A tabela `markets` terá `id` interno, `cep`, `latitude` e `longitude`; CEP pode se repetir, e as coordenadas distinguem unidades no mesmo CEP. `grocery_lists` e `purchases` terão `market_id` opcional como chave estrangeira para `markets.id`. Ao selecionar um estabelecimento no Maps, o mobile obtém CEP, coordenadas e nome retornado pelo Google Places; o nome fica em `markets.local_name`, somente no armazenamento local do aparelho. Digitar apenas o CEP não identifica com segurança qual estabelecimento foi visitado, então o fluxo deve selecionar o resultado do Places. O `place_id` do Google não será a chave primária do domínio nem persistido.

O banco hospedado é externo a este repositório. A alteração acima é a decisão de modelagem para o contrato/migração do backend; o JSON oficial de 8 de outubro permanece preservado como fotografia do modelo anterior e não confirma implantação. Durante a transição, manter os campos `location` existentes até que o backend defina o backfill e publique o contrato novo. Dados históricos que contêm apenas CEP não permitem distinguir mercados diferentes com o mesmo CEP; esse histórico só poderá ser associado com segurança a um mercado quando houver informação adicional. O simulador local implementa a tabela no esquema versão 11 e preserva dados das versões 8, 9 e 10 nas migrações; o Places API está ligado aos campos de mercado no mobile.

Na despensa, o CEP continua sendo o dado enviado ao modelo, mas a interface mostra somente o nome principal retornado pelo Places. Esse nome é cacheado no aparelho em `pantries.location_name`, campo local que não pertence ao esquema hospedado. Mercados usam `markets.local_name` com somente o nome principal do resultado Places selecionado; nenhum CEP nem endereço detalhado deve ser exposto como nome do local. Um registro antigo que tenha somente CEP não contém informação suficiente para recuperar com segurança o estabelecimento; o usuário precisa selecionar o local novamente para preencher o cache.

## 2026-10-08 - Estimativa e sugestões por mercado na lista

Quando uma lista ativa está vinculada por `grocery_lists.market_id`, `grocery_lists.estimated_price` representa a estimativa daquela lista para o mercado escolhido, usando o histórico da mesma despensa e o mesmo `purchases.market_id`. O CEP continua no registro relacionado `markets` e pode ser exibido no histórico. Ao concluir a compra da lista, a compra recebe o mesmo `market_id`. Quando um item não tiver histórico nesse mercado, ele fica fora da soma e a interface avisa quais produtos faltam para aproximar a estimativa. Sem mercado selecionado na lista ativa, as sugestões controlam o cartão: cada sugestão identifica um mercado e pode exibir a estimativa da lista naquele mercado. Remover o mercado da lista ativa reabre as opções de sugestão; isso não altera os mercados das compras já concluídas. Registros locais antigos sem um vínculo confiável continuam usando `location` como dado legado.

As sugestões de mercado usam três opções: “Mais perto”, “Melhor custo-benefício” e “Marcas mais compradas”. “Mais perto” ordena mercados pelas coordenadas de `markets` e da despensa, consultando a API do Maps quando necessário. “Melhor custo-benefício” compara a estimativa da lista por `market_id`. “Marcas mais compradas” deriva as marcas do histórico em `pantry_products.brand`, associadas ao mercado pela compra; itens planejados não precisam de coluna `brand`. O nome retornado pelo Places para cada estabelecimento selecionado fica armazenado apenas localmente no celular; o banco armazena o ID interno, CEP e coordenadas. A interface abre as opções a partir do próprio cartão de estimativa e atualiza o conteúdo do mesmo cartão ao escolher uma opção. A chave de Maps será usada em configuração local restrita, não escrita no código versionado.

Na implementação local de 8 de outubro, o cálculo de proximidade geocodifica o CEP da despensa e compara coordenadas em linha reta com os mercados históricos; a distância de rota fica fora desta etapa. A comparação de custo-benefício prioriza mercados com maior cobertura de itens e, entre coberturas iguais, o menor total estimado, para não favorecer um subtotal baixo que omita itens sem histórico. A opção de marcas conta, para cada item planejado, se o mercado tem a marca mais recorrente nas compras da despensa. A escolha atualiza o cartão e permanece somente no estado da tela.

A Geocoding API também exige faturamento ativo no projeto Google Cloud associado à chave. O erro retornado por uma chamada real deve ser exibido separadamente da API desabilitada, para orientar a configuração correta.

## 2026-10-08 - Embalagem histórica na estimativa

Categoria do item planejado é obrigatória, conforme `grocery_list_products.category_id`; peso/volume continua opcional. Sem peso/volume, o estimador escolhe uma apresentação histórica representativa dentro da categoria selecionada: prevalece a mais recorrente no histórico do mercado e, em empate, a compra mais recente; calcula o preço do pacote escolhido pela mediana das até três ocorrências mais recentes dessa apresentação. Se não houver histórico nessa categoria, usa ocorrências compatíveis pelo nome em outras categorias. Com peso/volume informado, prioriza a mesma apresentação; quando o histórico não tem aquele tamanho, estima pelo preço histórico por g/ml convertido para a unidade solicitada.

## 2026-10-06 - Acesso, histórico e retirada em listas de compras

Ao tocar em Lista de compras na Navbar, o usuário escolhe primeiro a despensa, mesmo que tenha apenas uma. A página da despensa exibe somente listas ativas; as concluídas ficam em um modal de histórico aberto por botão redondo verde com ícone de histórico. O modal de filtros trata apenas da ordenação, sem controle de histórico nem ícones de ticket nas opções. Para retirar produtos de uma lista, o usuário entra em um modo de seleção próprio e confirma a remoção; essa seleção não altera as marcações de itens comprados. Repetir uma lista histórica cria uma nova lista ativa e preserva a original.

## 2026-10-06 - Exclusão lógica de produto com `is_deleted`

O campo do produto para exclusão lógica será `pantry_products.is_deleted`, iniciado como booleano `false`. Quando o usuário remover o produto, o campo passará a `true`; o registro permanecerá no banco para preservar sua compra e o histórico, mas deixará de aparecer entre os produtos ativos da despensa. Estoque zerado não altera `is_deleted`. O modelo final enviado em 6 de outubro inclui `is_deleted` junto de `is_in_pantry`; o segundo não deve substituir a exclusão lógica. A implantação desse modelo ainda não foi verificada.

## 2026-10-06 - Identificador da NFC-e no parâmetro `p`

O QR Code da NFC-e contém um link cujo parâmetro `p` começa com o código único da nota, seguido por `|` e outros dados. O aplicativo extrai o trecho entre `p=` e o primeiro `|` e o modelo final recebido em 6 de outubro o nomeia `purchases.qr_code_id`. A duplicidade é verificada por código e despensa: a mesma nota não pode ser importada duas vezes na mesma despensa, mas pode ser usada em despensas diferentes. O contrato da API e a implantação ainda precisam ser confirmados.

## 2026-10-06 - Listas de compras no banco hospedado

As listas de compras do fluxo atual serão persistidas no banco hospedado, usando `grocery_lists` e `grocery_list_products`; não ficarão apenas no armazenamento local do aplicativo. Mantêm-se as regras funcionais de escolha explícita, múltiplas listas e histórico. O modelo oficial fechado recebido em 8 de outubro define `grocery_lists.is_active` e `grocery_list_products.category_id`; `is_active` é `true` para listas ativas e `false` para concluídas. O contrato da API e a implantação ainda precisam ser verificados antes da integração. Esta decisão substitui a persistência local indicada na entrada de 5 de outubro abaixo e o aditivo de 6 de outubro.

## 2026-10-08 - Modelo oficial fechado do banco

O arquivo `Downloads/FaltaOque.json` recebido em 6 de outubro está preservado em `docs/architecture/hosted-database-model-2026-10-06.json`. O JSON oficial fechado recebido em 8 de outubro e preservado em `docs/architecture/hosted-database-model-2026-10-08.json` passa a ser a referência mais recente. Ele define `grocery_lists.is_active` no lugar de `is_finished` e inclui `grocery_list_products.category_id`. A estrutura também inclui `colors`, `users_pantries`, `purchases.qr_code_id`, `pantry_products.is_deleted`, `grocery_lists.pantry_id` e itens planejados independentes em `grocery_list_products`; não usa a junção antiga `grocery_lists_pantry_products`.

Decisão inicial de 8 de outubro, posteriormente substituída: naquela proposta, dados anteriores seriam descartados ao migrar para o esquema v8. O estado atual documentado em `current-state.md` e no aditivo de mercados registra o esquema local v11 e migrações que preservam dados. Essa decisão de descarte não deve orientar novas migrações. `grocery_lists.is_active` guarda o estado ativo/concluído; `purchases.is_finished` continua sendo um campo distinto do modelo recebido. O JSON descreve a modelagem oficial desejada, mas não confirma que ela esteja implantada no banco hospedado.

## 2026-10-06 - Simulador local da API de listas

Enquanto a API não estiver disponível, o app deve simular suas operações de listas com persistência local durável, isolada por conta e despensa. O adaptador mantém coleções locais para listas e itens planejados, sem criar compras ou produtos fictícios só para satisfazer `pantry_products.purchase_id`. A interface continua chamando `groceryListService`, cuja implementação poderá ser trocada pelo adaptador hospedado quando o contrato for confirmado. Essa persistência local é temporária e não substitui o destino hospedado definido acima.

## 2026-10-06 - Estimativa de preço da lista

`grocery_lists.estimated_price` guarda a soma das estimativas disponíveis para uma lista ativa, usando compras da mesma despensa. A busca do histórico é pelo nome normalizado; unidade e conteúdo, quando informados, ajudam a priorizar observações da mesma apresentação, mas não são obrigatórios. Categoria não é chave de correspondência. O preço unitário de cada observação usa `pantry_products.price / quantity`; a estimativa do item usa a mediana das até três observações mais recentes, e o total soma os itens cobertos. Itens sem histórico ficam fora dessa soma e a tela indica quantos entraram no total; se nenhum tiver histórico, o total permanece nulo. A estimativa ativa é recalculada ao alterar a lista e ao recarregar as listas, incluindo após mudanças no histórico; listas concluídas preservam o valor final.

Para permitir validar a interface antes de haver histórico real, em desenvolvimento o app inclui três compras históricas sintéticas na despensa caso ainda não existam fixtures demonstrativas. Se ela não tiver listas, também cria uma lista demonstrativa. Os itens dessas compras ficam excluídos do estoque visível. Esses mocks existem apenas em desenvolvimento; sugestão por proximidade de mercados permanece fora deste escopo.

## 2026-10-06 - Ocorrências distintas do mesmo produto em listas diferentes

O registro comprado em estoque permanece distinto por compra em `pantry_products`. No modelo final recebido em 6 de outubro, cada item ainda planejado em uma lista tem seu próprio registro em `grocery_list_products`, mesmo que o nome se repita em outras listas. Esses itens não são `pantry_products` até uma compra ser realizada e não compartilham identidade por coincidência de nome.

## 2026-10-05 - Listas de compras sugeridas ao zerar estoque (persistência substituída em 6/10)

No fluxo descrito pelo usuário, uma NFC-e pode ser a primeira compra de uma despensa sem listas. Quando um produto chegar a zero no estoque, o aplicativo perguntará se o usuário deseja colocá-lo em uma lista; não fará a inclusão sem essa escolha. Se ainda não houver lista, sugerirá criar uma com nome e data planejada opcional para a compra. Uma despensa poderá ter várias listas, organizadas conforme onde ou quando o usuário pretende comprar. O usuário escolherá a lista de destino e poderá incluir o mesmo produto em mais de uma lista.

Nesse fluxo, o item exibido na lista terá somente o nome do produto, sem marca ou demais atributos de compra. O aplicativo deverá lembrar a associação entre produto e lista anterior para sugerir essa lista quando o produto voltar a acabar, sem impedir que o usuário escolha outra. A lista estimará valores com base no histórico de preços e locais das compras realizadas. A definição original de persistência apenas local foi substituída pela decisão de 6 de outubro acima.

## 2026-10-05 - Escopo da tela de Configurações

A tela de Configurações deverá oferecer seleção de idioma, ajuste para aumentar ou diminuir o tamanho da fonte, controle para habilitar ou desabilitar notificações, acesso a um guia de uso do aplicativo, seção Sobre com versão, nomes da equipe e link do projeto, e acesso à Política de Privacidade e aos Termos de Uso. A opção de modo claro/escuro também é desejada, condicionada ao tempo disponível. A organização sugerida para a página é: preferências de leitura e idioma; notificações; ajuda; Sobre; documentos legais. Essa ordem é de apresentação, não de prioridade de implementação. Permanecem para definição os idiomas disponíveis, o alcance do ajuste de fonte, o comportamento das notificações e os conteúdos ou endereços dos links.

## 2026-10-05 - Mercado identificado na compra sem tabela própria (superada em 08/10)

O grupo decidiu não criar uma tabela de mercados neste momento. Na importação fiscal, o CNPJ virá dos dados da nota e o usuário poderá alterar o nome do mercado exibido. Na adição manual, o front oferecerá sugestões de nomes de mercados. O contrato da API ainda deverá esclarecer onde ficam salvos o CNPJ, o nome escolhido e as sugestões, pois a modelagem compartilhada até esta data não explicita esses campos.

## 2026-10-05 - Automações adiadas

A funcionalidade de automações de listas de compras não será implementada agora. A proposta de regras recorrentes e registro de execuções fica fora do escopo atual.

## 2026-10-05 - Quantidade comprada e saldo atual separados

O modelo de banco compartilhado em 5 de outubro inclui `pantry_products.quantity` para a quantidade comprada e `pantry_products.current_quantity` para o saldo atual. Essa separação preserva a quantidade original da compra quando o estoque é consumido e permite calcular o preço unitário a partir do total pago e da quantidade comprada. Conforme esclarecimento do usuário, valores fracionados de produtos comprados por peso, como carne, serão armazenados em `pantry_products.content_value` (`DOUBLE`) junto de `unit_of_measure`. `quantity` e `current_quantity` permanecem `INTEGER` no modelo recebido e representam contagens. A forma de reduzir parcialmente uma medida fracionada no estoque ainda não foi definida.

## 2026-10-05 - Atualização concorrente do estoque no backend

O grupo informou que o backend será ajustado para aplicar as alterações de estoque de forma consistente quando participantes da mesma despensa agirem simultaneamente. O front exibirá o saldo retornado pela API após a operação.

## 2026-10-05 - Desativação lógica de usuários e produtos

O grupo confirmou que haverá um indicador de atividade para usuários e exclusão lógica para produtos da despensa. No produto, ele será usado quando o usuário escolher “deletar”: o registro permanecerá no banco para preservar sua ligação com a compra e o histórico, mas deixará de aparecer como produto ativo no front. O modelo recebido em 5 de outubro usava `pantry_products.is_in_pantry`; a decisão posterior de 6 de outubro define `pantry_products.is_deleted`. `users.is_active` refere-se ao usuário e não foi alterado por essa correção.

## 2026-10-05 - Unidade de medida como enum

O grupo confirmou que a unidade de medida do produto será representada por um enum no banco hospedado. A lista exata de valores e o mapeamento com as unidades usadas pelo aplicativo deverão constar do contrato atualizado.

## 2026-10-01 - Compra obrigatória para produto no banco hospedado

Após discussão com o grupo, todo produto no banco hospedado deve estar vinculado a uma compra. A hierarquia funcional definida é compra vinculada à despensa e produto vinculado à compra. No fluxo de adição manual, o aplicativo consumirá a rota de compras; cada produto adicionado manualmente gerará uma nova compra. Essa decisão substitui a proposta de permitir produto de estoque independente de compra. O campo `purchases.finish_products` passará a aceitar `NULL`; a equipe responsável ainda corrigirá o banco hospedado. Até essa correção, o script de referência permanece com `NOT NULL`. O contrato da API e as regras de preservação do histórico ainda precisam ser definidos com o backend antes da integração.

## 2026-10-01 - Preservação do histórico após retirada da interface

O grupo definiu que produtos não serão apagados fisicamente. A nomenclatura atual para a remoção lógica do produto é `pantry_products.is_deleted = true`, conforme decisão de 6 de outubro acima. A despensa receberá um campo booleano equivalente para controlar sua exibição sem apagar o registro. Uma lista de compras sairá da tela de listas ativas quando uma compra for realizada, mas permanecerá no banco como histórico. Compras na tabela `purchases` não serão apagadas e servirão ao histórico e aos dashboards. Para repetir uma lista em outro mês, o sistema criará uma nova versão por cópia. O usuário poderá alterar itens e preços apenas nessa nova versão; a lista histórica original e a compra anterior permanecerão intactas.

## 2026-10-01 - Bloqueio de importação duplicada por despensa (identificador definido em 6/10)

O grupo aprovou impedir que a mesma NFC-e seja importada mais de uma vez na mesma despensa, permitindo sua importação em despensas diferentes. A forma de identificação foi definida posteriormente, na decisão de 6 de outubro acima.

## 2026-10-01 - Marca e visualização de produtos equivalentes

O campo `pantry_products.brand` já atende ao armazenamento da marca; não é necessária uma nova coluna para isso. Produtos com o mesmo nome e marcas diferentes, como dois cafés, são registros distintos no banco. No front, o usuário poderá escolher se deseja visualizá-los juntos ou separados por marca. Essa escolha de apresentação não funde nem apaga os registros dos produtos. Embalagens ou apresentações diferentes são produtos diferentes na despensa e não devem ter suas quantidades somadas. A forma de persistir a preferência de visualização será detalhada posteriormente.

## 2026-10-01 - Compras e histórico no modelo hospedado

O grupo definiu que `purchases` representa as compras no funcionamento do sistema, não apenas uma tabela de histórico. Os registros de compras permanecerão no banco e também serão usados para compor o histórico e os dashboards, junto dos produtos vinculados por `pantry_products.purchase_id` e das demais relações existentes. Não foi aprovada, neste ponto, a criação de uma tabela separada de itens históricos. As regras de edição dos dados vinculados à compra deverão ser conferidas antes da integração para preservar a leitura das compras anteriores.

## 2026-10-01 - Saldo agregado por produto e consumo por antiguidade

Quando o mesmo produto com a mesma embalagem ou apresentação aparecer em compras diferentes, cada registro em `pantry_products` manterá seu próprio ID e vínculo com a respectiva compra. O front exibirá a soma das quantidades desses registros equivalentes na despensa. Produtos em embalagens ou apresentações diferentes permanecem separados e não são somados. Ao reduzir uma unidade do estoque agregado, o sistema deverá reduzir primeiro o saldo do registro da compra mais antiga que ainda tenha unidades. Ao aumentar pelo controle de estoque, deverá acrescentar a unidade ao registro da compra mais recente. Se duas compras tiverem a mesma data, qualquer uma delas poderá ser escolhida no desempate. Saldo zero não altera `is_deleted`; esse campo só passa a `true` quando o usuário remove o produto manualmente. Um registro com saldo zero poderá voltar a receber unidades. A preservação da quantidade originalmente comprada e o tratamento de atualizações simultâneas por participantes da despensa permanecem para discussão.

## 2026-10-01 - Unidade de medida no banco hospedado

O grupo informou que a unidade de medida do produto será armazenada no banco hospedado; em 5 de outubro confirmou o uso de enum, conforme decisão posterior neste arquivo. Não haverá colunas distintas para preço unitário e preço total do item: `pantry_products.price` armazenará o preço total do item na compra, e o front calculará o preço unitário quando necessário. `purchases.total_price` continuará representando o total da compra. O cálculo precisará considerar a quantidade originalmente comprada, que pode diferir do saldo atual após consumo ou ajuste de estoque.

## 2026-10-01 - Relação entre listas e produtos existentes (identidade por lista definida em 6/10)

O grupo apontou que `grocery_lists_pantry_products` associa listas de compras a registros em `pantry_products`. A despensa de um produto comprado pode ser identificada indiretamente por `pantry_products.purchase_id` e `purchases.pantry_id`. A decisão posterior de 6 de outubro exige registros `pantry_products` diferentes para ocorrências do mesmo produto em listas diferentes. Como `purchase_id` é obrigatório no modelo recebido, o vínculo de itens planejados antes da compra ainda depende de definição do backend. A garantia de que todos os itens de uma lista pertençam à mesma despensa permanece para análise de implementação.

## 2026-10-01 - Permissões dos participantes da despensa

Conforme esclarecimento do usuário, todos os usuários convidados para uma despensa poderão realizar as mesmas ações nela. Não há necessidade de papéis ou permissões individuais por participante em `users_pantries` para o escopo discutido. O tópico anterior sobre níveis de permissão por despensa fica encerrado com essa regra.

## 2026-09-12 - Medida da embalagem no nome fiscal

Na importação por QR Code, uma medida única e explícita (`g`, `kg`, `ml` ou `L`) no nome será transferida para peso/volume e unidade, removendo esse trecho do nome exibido. A revisão permite corrigir ou limpar a medida. A quantidade comprada permanece independente; as descrições fiscais originais são preservadas no histórico. Agrupamento ocorre antes da remoção, preservando a separação de embalagens diferentes. Multipacks e descrições com múltiplas medidas não são interpretados automaticamente.

## 2026-09-12 - Categoria Outros e repetições na mesma nota

Por solicitação do usuário, a lista fixa passa a incluir `Outros`, disponível no cadastro manual, revisão fiscal e filtros da despensa. Na importação, itens sem correspondência no dicionário recebem essa categoria, permanecendo editáveis; isso substitui a decisão anterior de deixá-los sem categoria.

Linhas da mesma nota com descrição e unidade iguais após normalização de caixa, acentos e espaços são agrupadas antes da revisão. Quantidades e totais são somados; marcas e apresentações descritas permanecem distintas. Havendo preços unitários diferentes, a revisão informa o preço médio ponderado pela quantidade. As linhas fiscais originais ficam preservadas em `sourceItems` no histórico, independentemente das edições na revisão. Esse agrupamento não equivale à reconciliação com produtos de compras anteriores na despensa.

Este arquivo registra decisões confirmadas. Alterações devem incluir data e motivo.

## 2026-09-07 - Escopo do repositório

O trabalho deste repositório cobre somente o aplicativo mobile. Backend e banco de dados pertencem a outras pessoas da equipe.

## 2026-09-07 - Linguagem

O projeto continuará em JavaScript porque nem todas as pessoas responsáveis pelo front-end trabalham com TypeScript. PropTypes, JSDoc pontual e testes podem ser usados para reduzir erros sem migrar a linguagem.

A estilização da aplicação deve usar `styled-components/native`. Novos componentes devem consumir o tema compartilhado e evitar cores, tipografia e espaçamentos literais quando houver tokens correspondentes.

## 2026-09-08 - Organização dos estilos

Cada componente e tela que usar `styled-components/native` deve manter as declarações `styled.*` em um arquivo irmão chamado `styles.js`. O arquivo `index.js` fica responsável pela lógica, estado, handlers e JSX, importando os elementos estilizados de `./styles`.

Helpers usados exclusivamente para resolver propriedades visuais podem permanecer em `styles.js`. Regras de domínio, constantes funcionais e decisões de comportamento permanecem fora dele.

## 2026-09-07 - Plataformas

O aplicativo deve suportar Android e iOS. Expo Web não faz parte do escopo. Somente Android poderá ser validado fisicamente pelo grupo durante a entrega atual.

## 2026-09-07 - Ambiente Expo

Expo Go será usado enquanto atender aos recursos implementados. O projeto poderá migrar para development build quando uma dependência nativa realmente exigir.

## 2026-09-07 - Persistência temporária

Enquanto o backend não estiver pronto, os fluxos obrigatórios usarão persistência local. Telas não devem acessar a tecnologia de armazenamento diretamente; devem depender de uma camada de serviço ou repositório substituível.

Quando a documentação do backend for fornecida, a implementação local correspondente será removida ou substituída pela integração da API sem reescrever as telas.

O modo local deve permitir várias contas no mesmo aparelho. Contas, sessão ativa e dados associados a cada usuário devem permanecer disponíveis após o aplicativo ser fechado e aberto novamente.

No cadastro local, o e-mail é obrigatório e deve ser único no aparelho. A senha é obrigatória e deve conter entre 8 e 20 caracteres. Não há requisito adicional de letra maiúscula, número ou caractere especial.

Conforme a tela atualizada do Figma, o cadastro contém nome, e-mail, cor do avatar, senha e confirmação de senha. A confirmação deve coincidir com a senha e não deve ser persistida. A cor do avatar é escolhida entre 12 opções fixas definidas no Figma. Localização e imagem de avatar não fazem parte do cadastro atual.

O aceite dos Termos de Uso e da Política de Privacidade é obrigatório para criar uma conta. Sem o aceite explícito, o cadastro deve ser rejeitado com orientação visível ao usuário.

Após um cadastro bem-sucedido, o aplicativo deve autenticar a nova conta automaticamente. Um pop-up deve informar que a conta foi criada e que o usuário será redirecionado para o aplicativo; depois, a tela inicial será aberta sem exigir um novo login.

O pop-up de cadastro concluído deve apresentar o botão `Continuar`. O redirecionamento ocorre quando o usuário aciona esse botão, sem temporizador automático.

A opção de recuperação de senha permanece visível na tela de login. Enquanto não houver backend para concluir o fluxo, ela deve exibir uma mensagem informando que o recurso está indisponível no momento.

O compartilhamento de despensas permanecerá desativado enquanto o aplicativo operar com persistência local. Não haverá simulação de convites, sincronização ou compartilhamento entre contas do mesmo aparelho. Esse recurso será habilitado somente após a integração com o backend.

As despensas devem permitir criar, visualizar, editar e excluir. Nome e cor são os únicos campos obrigatórios na entrega de 14 de setembro.

Ao excluir uma despensa que contenha produtos, o aplicativo deve solicitar confirmação explícita. Após a confirmação, a despensa e todos os produtos vinculados a ela serão removidos do armazenamento local.

Os produtos devem permitir criar, visualizar, editar e excluir. Nome, quantidade, preço e categoria são obrigatórios; peso é opcional. Atualização de 12 de setembro de 2026: o modal do Figma `824:4634` já inclui o preço; na adição manual, o usuário escolhe se informou o preço por unidade ou o total do lote. O aplicativo calcula e armazena o valor complementar pela quantidade, preservando o tipo de preço informado.

A exclusão de um produto exige confirmação explícita. Após a confirmação, somente o produto selecionado será removido da despensa.

A tela da despensa deve oferecer busca e filtros por categoria funcionais na entrega de 14 de setembro. Ambos operam sobre os produtos persistidos localmente. Atualização de 12 de setembro de 2026: as tags de categoria continuam aceitando seleção múltipla diretamente na tela; o modal de filtros oferece ordenação por nome, preço ou quantidade e só aplica a ordenação quando o usuário confirma.

A busca considera somente o nome do produto e ignora diferenças de maiúsculas, minúsculas e acentos. Conforme ajuste de 12 de setembro de 2026 solicitado pelo usuário, a busca pode ser combinada com múltiplas categorias selecionadas. Produtos de qualquer categoria selecionada são incluídos; sem seleção, todas são incluídas.

A quantidade do produto aceita somente números inteiros positivos. O peso pode aceitar valores fracionados e deve ser interpretado junto de sua unidade de medida.

As unidades aceitas inicialmente são `g`, `kg`, `ml` e `L`. O valor da medida e sua unidade devem ser armazenados separadamente.

As categorias de produto são fixas: Bebidas, Orgânicos, Integrais/Cereais, Frescos, Limpeza/Higiene e Carnes. Usuários não podem criar, editar ou excluir categorias. Atualização de 12 de setembro de 2026: categoria é obrigatória ao adicionar um produto manualmente.

Produtos adicionados manualmente podem registrar uma data de validade opcional. A interface aplica a máscara `DD/MM/AAAA` durante a digitação, valida uma data real igual ou posterior ao dia atual do aparelho e persiste em `AAAA-MM-DD`. A categoria aparece no próprio card quando nenhuma tag de filtro estiver selecionada; com uma ou mais tags ativas, a lista é agrupada por categoria como no Figma.

Os controles `-` e `+` do card alteram somente a quantidade atual do produto na despensa. A quantidade nunca fica abaixo de 1, e o histórico da compra manual original não é reescrito por esses ajustes de estoque.

Na importação de nota fiscal, o aplicativo deve tentar sugerir uma categoria para cada produto a partir de seu nome. A sugestão deve ser exibida na etapa de revisão e permanecer editável antes da confirmação.

A sugestão de categoria será feita localmente por um dicionário de palavras-chave normalizadas, sem IA ou API externa. Quando não houver correspondência suficientemente clara, o item permanecerá sem categoria para seleção manual.

O produto deve armazenar preço unitário e preço total do item. Na importação fiscal, os valores originais fornecidos pela nota devem ser preservados. Quando apenas um dos valores estiver disponível, o outro poderá ser calculado se houver dados suficientes.

## 2026-09-07 - Importação por QR Code

A importação deve ser real: ler o QR Code da nota fiscal eletrônica, consultar os dados, extrair produtos e permitir revisão antes de adicioná-los à despensa.

A primeira entrega precisa suportar notas de São Paulo. O objetivo final é aceitar notas de qualquer estado por meio de extratores específicos e um modelo normalizado comum. A extração deverá permanecer no aplicativo mobile conforme decisão da equipe.

O fluxo de leitura do QR Code deve ser iniciado dentro de uma despensa específica. Os produtos confirmados na revisão serão adicionados diretamente à despensa de origem, sem uma etapa posterior para escolher o destino.

Antes da importação, uma tela de revisão deve listar os itens extraídos. O usuário pode desmarcar itens que não deseja importar e editar nome, quantidade, preço unitário, preço total, peso, unidade e categoria antes da confirmação final.

Durante a revisão, o aplicativo deve procurar produtos equivalentes já existentes mesmo quando as descrições não forem idênticas. A comparação deve considerar texto normalizado, marca, peso, unidade e apresentação. Correspondências prováveis devem ser apresentadas ao usuário antes de mesclar ou somar quantidades.

Quando o usuário confirmar que duas descrições representam o mesmo produto, o aplicativo deve salvar um alias local ligado ao produto canônico. Em notas futuras, essa associação será aplicada automaticamente e ficará visível na revisão. O usuário pode corrigir o vínculo e remover aliases aprendidos.

Ao mesclar uma nova compra com um produto existente, a quantidade disponível deve ser somada e o produto deve exibir o preço unitário mais recente. Cada compra e seus valores originais devem permanecer preservados em um histórico separado para análises e dashboards futuros.

Produtos adicionados manualmente também devem gerar uma entrada no histórico. Cada registro local deve identificar sua origem como `manual` ou `nota_fiscal`.

O histórico deve ser persistido corretamente na entrega de 14 de setembro, mas a tela para consultá-lo fica fora desse marco.

O modelo local de histórico é provisório e não deve ser tratado como contrato definitivo do backend. Quando a documentação da API for fornecida, entidades, adaptadores e estratégia de migração devem ser revistos conforme o modelo oficial.

Ao adicionar um produto manualmente, o aplicativo deve registrar automaticamente a data e hora atuais do aparelho e deixar o local da compra vazio. Esses dados não devem adicionar novos campos ao formulário da entrega atual.

Para uma compra importada por nota fiscal, o histórico visível deve guardar somente a data da compra, o local da compra e o valor total, além dos itens associados. Chave de acesso, CNPJ e URL consultada não fazem parte dos dados funcionais preservados.

Para o MVP local de 14 de setembro, a proposta era armazenar uma impressão digital técnica derivada do conteúdo do QR Code e bloquear duplicidade por conta. A decisão de 6 de outubro acima substitui essa proposta para a integração hospedada: código do parâmetro `p`, armazenado no banco e verificado por despensa. O identificador técnico não deve ser exibido ao usuário.

A revisão deve procurar produtos equivalentes já existentes na despensa mesmo quando os nomes não forem idênticos. A comparação deve normalizar descrições comerciais e considerar termos relevantes, marca, peso, unidade e apresentação. Para cada correspondência provável, o aplicativo deve perguntar ao usuário se o item importado é o mesmo produto antes de somar a quantidade ou mesclar dados. Sem confirmação, nenhum item deve ser mesclado automaticamente.

## 2026-09-07 - Figma

O Figma atualizado é a fonte de verdade visual. A página `Alta FIdelidade` prevalece sobre referências antigas. O fluxo de QR Code ainda não existe no Figma e deverá ser especificado e revisado antes da implementação.

## 2026-09-07 - Git e colaboração

As duas pessoas do front-end trabalham em branches individuais. Alterações produzidas por agentes ficam sem commit até solicitação explícita. Arquivos com mudanças humanas em andamento devem ser preservados.

## 2026-09-07 - Modelos e subagentes

Decisão histórica, substituída pela política de 8 de setembro de 2026 abaixo.

O orquestrador deve operar com GPT-5.6 Sol. Subagentes usam GPT-5.6 Luna com raciocínio médio por padrão. O limite normal é de três subagentes simultâneos; o Sol pode excedê-lo quando houver tarefas independentes suficientes e benefício claro.

O Sol pode escolher um modelo mais forte para tarefas que excedam a capacidade adequada do Luna.

## 2026-09-08 - Astra como orquestrador e escalonamento por complexidade

Decisão histórica: a escolha do orquestrador foi substituída em 9 de setembro de 2026. As regras de delegação continuam válidas conforme a política vigente.

Por escolha do usuário, o orquestrador passa a ser GPT-6 Astra com raciocínio leve (`low`) por padrão. O objetivo é concentrar planejamento, arquitetura, integração e revisão final no Astra, distribuindo trabalho independente conforme sua complexidade.

GPT-5.6 Luna com raciocínio médio executa escopos delimitados. GPT-5.6 Sol com raciocínio médio, ou alto quando justificado, assume tarefas intermediárias com maior síntese, documentação substancial, investigação ou implementação em poucos módulos relacionados. O orquestrador pode escolher diretamente um agente mais forte quando Luna for inadequado; não precisa esperar uma tentativa falhar.

Sol é opcional: não há cadeia obrigatória Astra → Sol → Luna. O limite é de três subagentes simultâneos em toda a árvore, respeitando a capacidade do ambiente. Arquitetura de alto risco, segurança, autenticação, migração de dados, decisões fiscais e integração final permanecem sob responsabilidade do Astra, com apoio independente quando útil.

Quando a dificuldade justificar, o orquestrador deve recomendar ao usuário subir o Astra para médio e explicar o motivo concreto. O ajuste do modelo e do raciocínio da tarefa principal é feito pelo usuário no Codex. Uma recomendação não bloqueia trabalho independente nem significa que a configuração foi alterada. Ao encerrar a etapa exigente, pode recomendar retornar ao leve.

O procedimento operacional, inclusive transferência de escopo entre agentes, está em `docs/agents/workflow.md`.

## 2026-09-09 - Terra no leve para economia de tokens

Decisão histórica, substituída pela política de 30 de setembro de 2026 abaixo.

Por solicitação do usuário, GPT-5.6 Terra com raciocínio leve (`low`) passa a ser o orquestrador padrão. O usuário selecionará esse modelo no novo chat. A documentação orienta a execução, mas não altera a configuração do modelo no Codex.

Permanecem Luna/médio para execução delimitada, Sol/médio ou alto para trabalho independente de maior complexidade, escolha direta de um agente mais forte quando necessário, limite global de três subagentes e revisão final pelo orquestrador. Não há cadeia obrigatória entre modelos.

Para dificuldades concretas, recomendar elevar Terra para médio ou trocar o orquestrador para Sol/Astra, explicando o motivo. Priorizar contexto relevante, relatórios concisos e delegações com benefício real. Os demais requisitos, critérios de aceite e regras de colaboração permanecem vigentes.

## 2026-09-30 - GPT-6 Sol como orquestrador

Por solicitação do usuário, GPT-6 Sol com raciocínio leve (`low`) passa a ser o orquestrador padrão. A documentação orienta os chats do projeto, mas a seleção do modelo e do raciocínio da tarefa principal é feita pelo usuário no Codex.

Permanecem GPT-5.6 Luna/médio para execução delimitada, GPT-5.6 Sol/médio ou alto para trabalho independente de maior complexidade, escolha direta do agente adequado, limite global de três subagentes e revisão final pelo orquestrador. Para dificuldades concretas, recomendar elevar o raciocínio do orquestrador para médio ou alto com justificativa.

## 2026-10-08 - Dados demonstrativos para sugestões de mercados

Para validar as sugestões locais de listas de compras, a fixture de desenvolvimento deve usar estabelecimentos, produtos e marcas reais, com endereços, CEPs e coordenadas confirmados. Compras anteriores e seus preços permanecem sintéticos; não podem ser apresentados nem documentados como transações, cupons ou preços atuais garantidos. Os itens planejados precisam obedecer ao modelo local de inserção: nome, quantidade, categoria obrigatória e embalagem/unidade coerentes quando informadas.

A fixture atual cobre três mercados da zona sul de São Paulo e cria uma lista ativa com arroz 5 kg, feijão 1 kg, leite 1 L, macarrão 500 g e óleo 900 ml. A geometria e a composição de histórico são montadas para exercitar as três opções (mais perto, custo-benefício e marcas mais compradas). Os mocks antigos de CEPs genéricos podem ser removidos apenas quando identificados pelos marcadores conhecidos; dados reais do usuário devem permanecer intactos.
