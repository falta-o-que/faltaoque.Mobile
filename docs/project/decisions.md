# Decisões do projeto

As decisões mais recentes prevalecem quando uma proposta ou anotação anterior descreve outro fluxo. O SDD `../specs/integracao-e-fluxos-2026-10-05.md` consolida o estado atual das decisões posteriores ao MVP, sem afirmar implementação no app ou no banco hospedado.

## 2026-10-06 - Identificador da NFC-e no parâmetro `p`

O QR Code da NFC-e contém um link cujo parâmetro `p` começa com o código único da nota, seguido por `|` e outros dados. O aplicativo deverá extrair o trecho entre `p=` e o primeiro `|` e enviar esse código para armazenamento no banco hospedado. A duplicidade será verificada por código e despensa: a mesma nota não poderá ser importada duas vezes na mesma despensa, mas poderá ser importada em despensas diferentes. Esta decisão substitui a proposta de usar a impressão digital do QR Code como identidade definitiva; o campo do banco e o contrato da API ainda precisam ser confirmados.

## 2026-10-06 - Listas de compras no banco hospedado

As listas de compras do fluxo atual serão persistidas no banco hospedado, usando `grocery_lists` e suas relações, incluindo `grocery_lists_pantry_products`; não ficarão apenas no armazenamento local do aplicativo. Mantêm-se as regras funcionais de sugestão ao zerar estoque, escolha explícita do usuário, múltiplas listas e histórico de listas. O retrato de modelagem de 5 de outubro contém essas duas tabelas, mas não explicita todos os campos necessários para despensa, data planejada, estado/histórico e sugestão de lista anterior; essas relações e o contrato da API devem ser confirmados com o backend antes da integração. Esta decisão substitui a persistência local indicada na entrada de 5 de outubro abaixo.

## 2026-10-06 - Ocorrências distintas do mesmo produto em listas diferentes

Se um produto de mesmo nome aparecer em duas listas de compras, cada lista terá uma entidade `pantry_products` distinta, com ID próprio. As duas ocorrências não devem compartilhar o mesmo registro nem ser fundidas por coincidência de nome. A interface pode reconhecer e apresentar produtos semelhantes, conforme a regra já definida para marcas e apresentações, preservando a identidade e o vínculo de cada ocorrência com sua lista. O contrato do backend ainda deve esclarecer a criação dessas entidades e sua relação obrigatória com `purchases` antes de uma compra ser realizada.

## 2026-10-05 - Listas de compras sugeridas ao zerar estoque (persistência substituída em 6/10)

No fluxo descrito pelo usuário, uma NFC-e pode ser a primeira compra de uma despensa sem listas. Quando um produto chegar a zero no estoque, o aplicativo perguntará se o usuário deseja colocá-lo em uma lista; não fará a inclusão sem essa escolha. Se ainda não houver lista, sugerirá criar uma com nome e data planejada para a compra. Uma despensa poderá ter várias listas, organizadas conforme onde ou quando o usuário pretende comprar. O usuário escolherá a lista de destino e poderá incluir o mesmo produto em mais de uma lista.

Nesse fluxo, o item exibido na lista terá somente o nome do produto, sem marca ou demais atributos de compra. O aplicativo deverá lembrar a associação entre produto e lista anterior para sugerir essa lista quando o produto voltar a acabar, sem impedir que o usuário escolha outra. A lista estimará valores com base no histórico de preços e locais das compras realizadas. A definição original de persistência apenas local foi substituída pela decisão de 6 de outubro acima.

## 2026-10-05 - Escopo da tela de Configurações

A tela de Configurações deverá oferecer seleção de idioma, ajuste para aumentar ou diminuir o tamanho da fonte, controle para habilitar ou desabilitar notificações, acesso a um guia de uso do aplicativo, seção Sobre com versão, nomes da equipe e link do projeto, e acesso à Política de Privacidade e aos Termos de Uso. A opção de modo claro/escuro também é desejada, condicionada ao tempo disponível. A organização sugerida para a página é: preferências de leitura e idioma; notificações; ajuda; Sobre; documentos legais. Essa ordem é de apresentação, não de prioridade de implementação. Permanecem para definição os idiomas disponíveis, o alcance do ajuste de fonte, o comportamento das notificações e os conteúdos ou endereços dos links.

## 2026-10-05 - Mercado identificado na compra sem tabela própria

O grupo decidiu não criar uma tabela de mercados neste momento. Na importação fiscal, o CNPJ virá dos dados da nota e o usuário poderá alterar o nome do mercado exibido. Na adição manual, o front oferecerá sugestões de nomes de mercados. O contrato da API ainda deverá esclarecer onde ficam salvos o CNPJ, o nome escolhido e as sugestões, pois a modelagem compartilhada até esta data não explicita esses campos.

## 2026-10-05 - Automações adiadas

A funcionalidade de automações de listas de compras não será implementada agora. A proposta de regras recorrentes e registro de execuções fica fora do escopo atual.

## 2026-10-05 - Quantidade comprada e saldo atual separados

O modelo de banco compartilhado em 5 de outubro inclui `pantry_products.quantity` para a quantidade comprada e `pantry_products.current_quantity` para o saldo atual. Essa separação preserva a quantidade original da compra quando o estoque é consumido e permite calcular o preço unitário a partir do total pago e da quantidade comprada. Conforme esclarecimento do usuário, valores fracionados de produtos comprados por peso, como carne, serão armazenados em `pantry_products.content_value` (`DOUBLE`) junto de `unit_of_measure`. `quantity` e `current_quantity` permanecem `INTEGER` no modelo recebido e representam contagens. A forma de reduzir parcialmente uma medida fracionada no estoque ainda não foi definida.

## 2026-10-05 - Atualização concorrente do estoque no backend

O grupo informou que o backend será ajustado para aplicar as alterações de estoque de forma consistente quando participantes da mesma despensa agirem simultaneamente. O front exibirá o saldo retornado pela API após a operação.

## 2026-10-05 - Desativação lógica de usuários e produtos

O grupo confirmou que haverá um indicador de atividade para usuários e para produtos da despensa. No produto, ele será usado quando o usuário escolher “deletar”: o registro permanecerá no banco para preservar sua ligação com a compra e o histórico, mas deixará de aparecer como produto ativo no front. No modelo recebido em 5 de outubro, os nomes são `users.is_active` e `pantry_products.is_in_pantry`; a nomenclatura definitiva do indicador no produto depende da próxima atualização do esquema.

## 2026-10-05 - Unidade de medida como enum

O grupo confirmou que a unidade de medida do produto será representada por um enum no banco hospedado. A lista exata de valores e o mapeamento com as unidades usadas pelo aplicativo deverão constar do contrato atualizado.

## 2026-10-01 - Compra obrigatória para produto no banco hospedado

Após discussão com o grupo, todo produto no banco hospedado deve estar vinculado a uma compra. A hierarquia funcional definida é compra vinculada à despensa e produto vinculado à compra. No fluxo de adição manual, o aplicativo consumirá a rota de compras; cada produto adicionado manualmente gerará uma nova compra. Essa decisão substitui a proposta de permitir produto de estoque independente de compra. O campo `purchases.finish_products` passará a aceitar `NULL`; a equipe responsável ainda corrigirá o banco hospedado. Até essa correção, o script de referência permanece com `NOT NULL`. O contrato da API e as regras de preservação do histórico ainda precisam ser definidos com o backend antes da integração.

## 2026-10-01 - Preservação do histórico após retirada da interface

O grupo definiu que produtos não serão apagados fisicamente: `pantry_products.is_in_pantry = false` retira o produto da exibição no front. A despensa receberá um campo booleano equivalente para controlar sua exibição sem apagar o registro. Uma lista de compras sairá da tela de listas ativas quando uma compra for realizada, mas permanecerá no banco como histórico. Compras na tabela `purchases` não serão apagadas e servirão ao histórico e aos dashboards. Para repetir uma lista em outro mês, o sistema criará uma nova versão por cópia. O usuário poderá alterar itens e preços apenas nessa nova versão; a lista histórica original e a compra anterior permanecerão intactas.

## 2026-10-01 - Bloqueio de importação duplicada por despensa (identificador definido em 6/10)

O grupo aprovou impedir que a mesma NFC-e seja importada mais de uma vez na mesma despensa, permitindo sua importação em despensas diferentes. A forma de identificação foi definida posteriormente, na decisão de 6 de outubro acima.

## 2026-10-01 - Marca e visualização de produtos equivalentes

O campo `pantry_products.brand` já atende ao armazenamento da marca; não é necessária uma nova coluna para isso. Produtos com o mesmo nome e marcas diferentes, como dois cafés, são registros distintos no banco. No front, o usuário poderá escolher se deseja visualizá-los juntos ou separados por marca. Essa escolha de apresentação não funde nem apaga os registros dos produtos. Embalagens ou apresentações diferentes são produtos diferentes na despensa e não devem ter suas quantidades somadas. A forma de persistir a preferência de visualização será detalhada posteriormente.

## 2026-10-01 - Compras e histórico no modelo hospedado

O grupo definiu que `purchases` representa as compras no funcionamento do sistema, não apenas uma tabela de histórico. Os registros de compras permanecerão no banco e também serão usados para compor o histórico e os dashboards, junto dos produtos vinculados por `pantry_products.purchase_id` e das demais relações existentes. Não foi aprovada, neste ponto, a criação de uma tabela separada de itens históricos. As regras de edição dos dados vinculados à compra deverão ser conferidas antes da integração para preservar a leitura das compras anteriores.

## 2026-10-01 - Saldo agregado por produto e consumo por antiguidade

Quando o mesmo produto com a mesma embalagem ou apresentação aparecer em compras diferentes, cada registro em `pantry_products` manterá seu próprio ID e vínculo com a respectiva compra. O front exibirá a soma das quantidades desses registros equivalentes na despensa. Produtos em embalagens ou apresentações diferentes permanecem separados e não são somados. Ao reduzir uma unidade do estoque agregado, o sistema deverá reduzir primeiro o saldo do registro da compra mais antiga que ainda tenha unidades. Ao aumentar pelo controle de estoque, deverá acrescentar a unidade ao registro da compra mais recente. Se duas compras tiverem a mesma data, qualquer uma delas poderá ser escolhida no desempate. Saldo zero não altera `is_in_pantry`; esse campo só passa a `false` quando o usuário remove o produto manualmente. Um registro com saldo zero poderá voltar a receber unidades. A preservação da quantidade originalmente comprada e o tratamento de atualizações simultâneas por participantes da despensa permanecem para discussão.

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
