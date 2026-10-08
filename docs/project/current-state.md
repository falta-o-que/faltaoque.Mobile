# Estado atual

Última atualização da memória de planejamento: 8 de outubro de 2026. A descrição da implementação abaixo registra o estado do MVP local e as atualizações incorporadas nesta data.

## Marco imediato

Entrega em 14 de setembro de 2026.

Funcionalidades exigidas para essa entrega:

- Cadastro e login.
- Suporte a várias contas locais no mesmo aparelho, com sessão e dados persistentes após reiniciar o aplicativo.
- Criação e configuração de despensa.
- CRUD completo de despensas, com nome e cor obrigatórios.
- Adição e configuração de produtos.
- CRUD de produtos com nome, quantidade e preço obrigatórios; peso e categoria opcionais.
- Busca de produtos e filtros por categoria funcionais.
- Leitura real do QR Code de nota fiscal de São Paulo.
- Extração dos produtos da nota.
- Revisão dos itens antes da inclusão na despensa.
- Persistência local enquanto o backend correspondente não estiver disponível.
- Compartilhamento de despensas desativado até a integração com o backend.

## Implementação atual

- Em 5 de outubro, `CategoryTag` recebeu o ícone de tag do SVG fornecido pelo usuário, convertido ao padrão `react-native-svg`; o ícone usa a mesma cor calculada para o texto. O espaçamento da variante de produto foi ajustado ao nó Figma `654:2312`. A verificação por bundle permanece pendente porque as dependências locais não estão instaladas neste checkout e a consulta ao registro npm foi bloqueada.

- Projeto Expo SDK 57 com React Native e JavaScript.
- Estilização com `styled-components`.
- `styled-components/native` é o padrão obrigatório para novos componentes e deve consumir o tema compartilhado.
- Tokens do Figma exportados em `src/theme/tokens.json` e adaptados em `src/theme/index.js`.
- Componentes existentes incluem `ButtonClick`, `CategoryTag`, `Navbar`, `QuickActionButton`, `CreatePantryModal`, `ModalActionButton`, `PantryCard`, `SearchField`, `ProductCard` e `AddProductModal`.
- React Navigation separa o fluxo público (`Login` e `Register`) do fluxo autenticado (`Home` e `Pantry`).
- As telas-base de login, cadastro e home foram criadas a partir dos nós atuais de alta fidelidade do Figma.
- A troca entre os navegadores depende da sessão restaurada pelo contexto de autenticação.
- Contas locais são persistidas em um esquema versionado por meio de repositório substituível; senhas são armazenadas somente como hash com salt.
- A sessão ativa usa armazenamento seguro e é restaurada após reiniciar o aplicativo.
- Cadastro, login, login automático após cadastro e logout estão conectados às telas existentes.
- Despensas locais são criadas e listadas na Home por uma camada de serviço e repositório, com isolamento por `accountId`. O esquema local está na versão 3, com migração das versões 1 e 2 preservando contas e despensas e acrescentando produtos e compras.
- O modal de criação valida nome e cor, reutiliza botões de ação, bloqueia reenvio durante a persistência e apresenta erros junto aos dois campos. O seletor de cor abre e fecha com a mesma animação do seletor de avatar do cadastro.
- O card de despensa exibe nome, cor, contagem de produtos cadastrados e contador provisório da lista, ícone de configuração em `black/400` e reticências para nomes longos. Ao tocá-lo, a Home abre um modal próprio, com a ação de abrir a despensa antes da lista de compras; a primeira opção navega para a despensa e a segunda informa que a lista ainda será disponibilizada. A Home atualiza a listagem ao recuperar o foco.
- A listagem da Home possui estado vazio e de erro, espaçamento de 16 px entre cards, rolagem por trás do botão `Criar` e recorte junto à Navbar.
- Ações ainda indisponíveis dos atalhos, da configuração do card e das demais opções da Navbar exibem o aviso `Em breve`.
- A cor do avatar exibida na Home é a cor escolhida e persistida durante o cadastro.
- O toque em um card da Home abre a tela da própria despensa (Figma `641:1776`). A tela consulta a despensa da conta ativa pelo identificador, mostra nome e cor persistidos e trata carregamento, erro e despensa indisponível.
- A tela da despensa inicia sem produtos de demonstração e mantém Perfil selecionado na Navbar, pois foi aberta pela Home. Possui busca reutilizável (`SearchField`), categorias com seleção múltipla e texto branco nos fundos escuros e botões redondos reutilizados de `ModalActionButton`. O botão de filtro abre `ProductFilterModal` seguindo o Figma `820:3267`: ele ordena produtos por nome, preço ou quantidade após confirmação; as tags da tela mantêm a filtragem múltipla por categoria. Quando não há produtos, inclusive após excluir o último, mostra explicitamente o estado vazio; quando busca/filtros não encontram resultados, mostra a mensagem correspondente. Compartilhamento continua indisponível.
- Os ícones `AddUserIcon`, `DeliveryIcon` e `BoxIcon` foram convertidos dos SVGs fornecidos. O `ProductCard` reutilizável usa `legumesGrocery.png` como imagem genérica, exibe o preço unitário em reais e um círculo colorido ao lado do nome para indicar visualmente a categoria. A tela carrega os produtos persistidos da despensa/conta ativa e combina busca sem acentos com seleção múltipla de categorias. A ação Info abre um modal de consulta e edição: ao salvar, o card é atualizado sem reescrever a compra manual original.
- O botão de adição abre `AddProductModal`, baseado no Figma `824:4634`, com nome, quantidade e categoria única obrigatórios; peso/volume e validade opcionais. Antes de informar o preço, o usuário escolhe entre valor por unidade ou total do lote; o valor complementar é calculado a partir da quantidade e ambos ficam persistidos. A validade recebe máscara `DD/MM/AAAA`, aceita somente o dia atual ou posterior e é persistida em `AAAA-MM-DD`. Quando há medida, exige uma unidade entre `g`, `kg`, `ml` e `L`. O modal trata erros por campo, impede reenvio e preserva o formulário se o salvamento falhar.
- O seletor de categoria do modal inicia fechado e abre/fecha em 180 ms com opacidade, escala vertical, deslocamento e rotação da seta, seguindo o padrão dos seletores de cor existentes.
- Sem filtros de categoria, o card mostra sua tag para preservar o contexto; com filtros ativos, a lista é agrupada sob as tags selecionadas conforme o Figma `641:2244`.
- Os botões de quantidade do `ProductCard` agora alteram e persistem a quantidade atual. O botão de diminuir fica indisponível em 1, atualizações concorrentes do mesmo card são bloqueadas e falhas preservam o valor exibido.
- A adição manual persiste produto e compra numa única gravação, com origem `manual`, data/hora atual, local vazio e valores unitário/total. As operações de criação de contas, despensas e produtos usam uma fila de gravação para evitar perda por concorrência. Após adicionar, a tela limpa busca e filtros para mostrar o novo produto.
- Testes com armazenamento simulado em `tests/product-addition.cjs` cobrem validação de validade, migração, isolamento por conta, falha de gravação, concorrência, histórico, alteração de quantidade e releitura; executar com `node tests/product-addition.cjs`.
- A fatia da tela da despensa compilou no bundle Android. A comparação foi feita entre código e referência do Figma; a validação visual/interativa no aplicativo e os testes físicos de Android e iOS seguem pendentes.
- Implementação histórica anterior ao alinhamento de 6 de outubro: a revisão fiscal gravava fingerprint e bloqueava por conta. A versão atual usa o código do parâmetro `p` em `purchases.qr_code_id` e impede repetição por despensa; ver a atualização do modelo final abaixo. O extrator ainda precisa de validação com uma NFC-e paulista real no Android físico.
- A cobertura automatizada inicial se concentra na adição de produtos e persistência; ainda não há suíte de interface consolidada.

## Trabalho humano em andamento

- Biblioteca de ícones convertida para componentes React Native SVG e centralizada em `src/assets/icons/export.js`.
- Ajustes na navbar.

Áreas temporariamente protegidas contra alterações não solicitadas:

- `src/components/Navbar/`
- `src/assets/icons/`

## Preparação concluída

- Fluxo de agentes e política de modelos registrados.
- Política vigente: GPT-6 Sol/leve como orquestrador, GPT-5.6 Luna/médio para execução delimitada e GPT-5.6 Sol/médio ou alto para maior complexidade. Escalonamento e recomendações de raciocínio seguem `docs/agents/workflow.md` e a decisão de 30 de setembro de 2026.
- Memória operacional do projeto criada em `docs/project`.
- Especificação executável do marco criada em `docs/specs/milestone-2026-09-14.md`.
- Arquitetura substituível entre armazenamento local e backend registrada.
- Estratégia de spike da NFC-e de São Paulo documentada.
- `styled-components/native` definido como padrão obrigatório.

## Próxima etapa

- A tela de leitura de QR Code foi reestilizada com a linguagem da despensa: fundo claro, cabeçalho com ação circular de cancelamento, painel explicativo, moldura verde no preview e botão principal reutilizado para a permissão. Estados de carregamento, consulta e erro seguem a tipografia e as cores do tema. Bundle Android compilado; validar a aparência e a câmera no Expo Go.

- Reconhecimento de medidas ampliado para abreviações coladas à medida por ponto, hífen ou dois-pontos (ex.: `ALMOF.500G`, `TRAD.300G`). Validado contra a segunda nota fornecida pelo usuário sem gravar HTML ou URL em arquivo, com testes sintéticos de regressão; o molho dessa nota registra 300 g.

- A importação extrai medidas explícitas da embalagem do nome (`500g`, `1 kg`, `350 ml`, `1,5 L`), remove o trecho do nome de revisão e persiste peso/unidade separados. A revisão oferece campo editável e seletor reutilizado do cadastro manual. A quantidade e o histórico fiscal original são preservados; multipacks e múltiplas medidas permanecem para revisão manual. Testes de persistência cobrem extração, correção da medida e unidade inválida; teste físico no Expo Go pendente.

- Revisão fiscal agrupa linhas repetidas da mesma descrição/unidade, mostra a quantidade somada e preserva as linhas originais no histórico. A seleção usa estado explícito “Será adicionado” / “Não será adicionado”, com ação textual para excluir da seleção ou incluir novamente. Categoria `Outros` implementada em todos os seletores e filtros, com sugestão automática para itens não reconhecidos. Testes cobrem agrupamento, separação por apresentação, preços, exclusão da seleção e gravação atômica; reteste visual no Expo Go pendente.

- Refinamento visual da revisão fiscal: título “Guardar compras”, identificação da despensa por nome/cor, cards com a imagem já usada na despensa, sombra e preço verde, seleção explícita para inclusão, categoria editável diretamente e atalho para resolver categorias pendentes. Reutiliza `ModalActionButton` para editar/concluir/cancelar e `ButtonClick` para guardar. Bundle Android aprovado; validação visual no Expo Go permanece pendente.

- Revisão de NFC-e convertida em uma rota própria (`NfceReview`) por solicitação do usuário. A página reutiliza `FormField`, `CategoryTag` e `ButtonClick`, apresenta resumo da nota, cards selecionáveis com edição expansível e rodapé fixo com contagem e valor selecionados. Nome, quantidade, preço unitário, total e categoria possuem validação antes da importação; vírgula decimal é aceita. Ao salvar, volta à despensa e recarrega seus produtos. O modal antigo foi removido. Bundle Android compilado; aparência e interação no Expo Go aguardam validação física, assim como iOS.

Iniciar a próxima funcionalidade definida pelo usuário. A página da despensa, seus modais de adição e consulta/edição, busca, filtros por tags e controles de quantidade foram aprovados pelo usuário como base visual e funcional; ajustes futuros devem ser tratados como novo escopo ou feedback concreto.

## Ponto de parada — 12 de setembro de 2026

- Branch da sessão: `feature/DespensaPage`. As alterações permanecem locais e sem commit; conferir a branch e o estado do Git ao retomar e preservar esse trabalho.
- Referências visuais: página da despensa no Figma `641:1776` e modal de produto `824:4634`, arquivo `clwpIe4TC12SEAwf26SGo9`.
- Implementado nesta sessão: navegação Home → despensa, estado vazio, busca, seleção múltipla de categorias, ordenação no modal de filtros do Figma `820:3267`, card reutilizável com `legumesGrocery.png`, preço unitário, marcador circular de categoria, modais de adição e consulta/edição/exclusão e persistência local de produto/histórico.
- Correções aprovadas pelo usuário: manter Perfil selecionado na Navbar ao abrir pela Home; tags da busca aceitam múltipla seleção e usam texto branco em fundos escuros; categoria única e obrigatória; preço pode ser informado por unidade ou como total do lote, com cálculo do complementar. A página da despensa está aprovada como concluída para esta etapa.
- Verificação realizada: bundle Android compilado e `node tests/product-addition.cjs` aprovado com armazenamento simulado. Isso não substitui validação visual/interativa nem testes físicos de Android/iOS.
- O modal Info permite consulta e edição de nome, preço por unidade ou total do lote, quantidade, validade, peso/volume, unidade e categoria. A edição atualiza somente o produto; a compra manual original no histórico permanece imutável.
- A exclusão do produto está disponível no modal Info, exige confirmação explícita e remove apenas o produto da despensa; o histórico de compra é preservado. Ao retomar: aguardar a definição da próxima funcionalidade. A edição/exclusão de despensas e o spike fiscal SP continuam pendentes; este último requer validação com QR Code real.

## Modelo hospedado e novos fluxos — atualização em 8 de outubro de 2026

O JSON anterior enviado pelo grupo em 6 de outubro está preservado em `docs/architecture/hosted-database-model-2026-10-06.json`; o JSON oficial fechado recebido em 8 de outubro está em `docs/architecture/hosted-database-model-2026-10-08.json` e é a referência atual. Ele contém `grocery_lists.is_active` (ativo quando `true`, concluído quando `false`) e `grocery_list_products.category_id`. O campo `is_active` substitui `is_finished` usado no aditivo histórico de 6 de outubro. Não há confirmação de que o modelo atualizado esteja implantado nem de que a API esteja pronta.

As decisões funcionais e os pontos em aberto estão consolidados em `docs/specs/integracao-e-fluxos-2026-10-05.md` e em `docs/project/decisions.md`. O app usa localmente as tabelas e campos do JSON oficial fechado de 8 de outubro, com os aditivos locais `markets`/`market_id` e `pantries.location_name` no esquema 11 de `src/storage/localDatabase.js`; apenas o número da versão fica em uma chave separada. As migrações preservam os registros e criam mercados legados por CEP histórico, com coordenadas nulas, pois os dados antigos não identificam unidades por coordenadas. O Places API fornece CEP, coordenadas e nome do local selecionado; o app mantém os nomes apenas localmente. Isso ainda não prova integração nem implantação no banco hospedado.

Decisão anterior de 6 de outubro: a exclusão lógica usa `pantry_products.is_deleted`, iniciado como `false`; o modelo final enviado pelo grupo em seguida inclui esse campo junto com `is_in_pantry`. `users.is_active` permanece distinto e não muda por essa decisão.

## Página de listas de compras — 6 de outubro de 2026

A branch `feature/page-grocery-list` recebeu a primeira implementação da página de listas a partir do Figma `601:3423`. Pela Navbar, o usuário escolhe a despensa em uma página intermediária; pela Home, ainda pode acessar a lista pelo modal de destino de uma despensa. A tela apresenta categorias, criação de listas, expansão/recolhimento, adição de itens, marcação de compra, seleção para retirada, configuração e conclusão. O histórico fica em modal próprio e permite repetir uma lista concluída. O mesmo nome adicionado a duas listas recebe IDs de ocorrência diferentes.

Como o contrato das rotas `grocery_lists` ainda não foi recebido, a primeira implementação mantinha estado apenas em memória. Em 6 de outubro, por solicitação do usuário, essa camada foi substituída por um simulador local durável da API, usando coleções locais de listas e itens planejados na chave do banco. Após a confirmação do usuário, estado da lista e categoria do item passaram a ser colunas das tabelas; somente a versão fica separada. A interface continua chamando `groceryListService`, que poderá receber o adaptador hospedado depois. Os nós dos modais foram enviados posteriormente pelo usuário e estão descritos abaixo. A validação visual no Expo Go e o contrato de persistência hospedada seguem pendentes.

Na continuação de 6 de outubro, o usuário forneceu os nós dos modais de criação (`766:3283`), edição (`777:3266`), adição de itens (`780:3994`) e filtros (`820:3050`) e pediu um indicador com o nome da despensa na página. O modal de criação/edição terá campo adicional de data planejada com o ícone `Calendar.svg` convertido em componente, embora o Figma original ainda não mostre essa data. Essa data aceita somente dias reais do calendário desde três meses antes de hoje, inclusive, e datas futuras, tanto no formulário quanto no serviço de persistência; a subtração de meses ajusta o dia para o último válido do mês quando necessário. Repetir uma lista concluída abre o formulário com os itens copiados e exige uma nova data, sem reutilizar a data anterior. O usuário confirmou que finalizar uma lista deve adicionar os itens marcados ao estoque local nesta etapa, solicitando o preço unitário de cada item antes de gravar. O serviço de conclusão valida os preços e grava os produtos e suas compras em uma única atualização local; após essa gravação, a lista persistida passa ao histórico. Esta solução temporária não substitui a futura integração hospedada das listas e compras.

Outra correção de 6 de outubro: a Navbar de listas abre uma tela intermediária para escolher a despensa, mesmo quando há apenas uma. A página de uma despensa mostra somente listas ativas; um botão redondo verde com o componente `HistoryIcon`, derivado do SVG enviado, abre o histórico em modal e permite repetir uma lista concluída. O modal de filtros não mostra controle de histórico nem ícones de ticket nas opções de ordenação. O botão de retirar produtos ativa um modo de seleção separado das marcações de compra; a remoção exige escolha dos itens e confirmação, e o serviço valida todos os IDs antes de alterar a lista da sessão.

### Status para retomada — 6 de outubro de 2026

- Implementado na branch `feature/page-grocery-list`: tela de escolha da despensa pela Navbar; listas ativas por despensa com indicador de nome/cor; modais de criação, edição, produto, filtro, finalização com preço unitário e histórico; seleção e confirmação para remover itens; repetição de lista histórica por cópia. Os SVGs de calendário, histórico e check foram convertidos em componentes. A opção de ordenar por preço permanece desabilitada porque os itens planejados não têm preço.
- Persistência atual: `groceryListService` grava nas coleções locais `grocery_lists` e `grocery_list_products`, com isolamento por membership de usuário/despensa. `grocery_lists.is_active` guarda o estado (ativo `true`, concluído `false`) e `grocery_list_products.category_id` guarda a categoria. A finalização cria uma linha `purchases` e linhas de estoque `pantry_products`. O contrato e a implantação da API hospedada ainda precisam ser verificados.
- O campo `grocery_lists.estimated_price` é recalculado para listas ativas como a soma dos itens com histórico na própria despensa: busca por nome (incluindo nome curto pelo termo principal), preço pela mediana das até três compras recentes por item e preferência pela mesma medida quando informada. Categoria e medida não são chaves obrigatórias; itens sem histórico não entram na soma, e a tela mostra a cobertura. Listas concluídas preservam a estimativa. Em desenvolvimento, fixtures de histórico sintéticas são acrescentadas caso ainda não existam, inclusive em despensas com listas; produtos demonstrativos ficam excluídos do estoque visível. Nenhum mock é criado em produção.
- Peso/volume é opcional e categoria obrigatória nos itens da lista. Sem peso/volume, a estimativa seleciona a apresentação de embalagem mais recorrente dentro da categoria escolhida, com desempate pela compra mais recente; se não houver histórico nela, usa ocorrências compatíveis pelo nome em outras categorias. Peso informado prioriza o tamanho exato ou estima o tamanho pedido pelo preço histórico normalizado por g/ml na mesma unidade.
- Verificado: bundle Android via `npx expo export --platform android`; `node tests/grocery-list.cjs`, `node tests/grocery-checkout.cjs` e `node tests/product-addition.cjs`; `git diff --check`. A interface e os fluxos não foram validados visualmente no Expo Go nem em dispositivo físico Android ou iOS.
- Em 8 de outubro, o esquema local foi alinhado ao JSON oficial fechado e elevado à versão 8. Na próxima leitura, dados de versões anteriores serão descartados; status de listas é persistido em `grocery_lists.is_active` e convertido para o estado `active`/`finished` consumido pela interface. Essa inicialização ainda não foi verificada em aparelho.
- Estado do Git ao registrar: alterações da funcionalidade presentes na branch e sem commit solicitado. Há exclusões de SVGs em `src/assets/icons/` no estado de trabalho; são trabalho humano pré-existente e não devem ser revertidas ou editadas automaticamente.

### CEPs de despensa e mercado — 8 de outubro de 2026

- Implementados campos opcionais de CEP na criação/configuração da despensa, na criação/edição/repetição da lista, na compra manual e na revisão de NFC-e. A entrada é formatada como `00000-000` e persistida somente com os oito dígitos. A configuração da despensa permite alterar ou remover o CEP de despensas já existentes.
- A estimativa de uma lista ativa passa a restringir o histórico ao CEP da lista quando preenchido; sem CEP, conserva o cálculo geral anterior. A tela permite consultar os produtos sem histórico no mercado selecionado e mostra o mercado escolhido mesmo antes da inclusão dos primeiros itens. Nas configurações, a ação “Remover CEP da lista” limpa a localização e recalcula a estimativa sem filtro. Ao concluir a lista, o CEP da lista segue para `purchases.location`; o histórico de listas mostra o CEP e `estimated_price` preservados.
- Em desenvolvimento, o serviço `groceryEstimateDemoData` mantém dados demonstrativos locais para comparar estimativas por mercado. Os mocks anteriores de CEPs genéricos foram substituídos em 8 de outubro de 2026 por unidades reais na zona sul de São Paulo. Nenhum mock é criado em produção.
- A validação anterior das sugestões no Android usou dados demonstrativos locais. A nova fixture com endereços reais foi adicionada depois e ainda precisa ser conferida no aparelho, conforme o status atualizado abaixo.

### Modelo de mercado — decisão de 8 de outubro de 2026

- Aprovada a tabela `markets` com ID interno, CEP, latitude/longitude e `local_name` apenas local. Listas e compras apontam para ela por `market_id` opcional; CEP não é único. O nome principal vem do estabelecimento selecionado no Google Places e fica cacheado no registro local do mercado, sem persistir `place_id`.
- A decisão está documentada em `docs/architecture/markets-model-addendum-2026-10-08.md` e implementada no banco local do app (versão 11), incluindo relação opcional de listas e compras com `markets`. A busca Google Places foi conectada à lista, compra manual, revisão de NFC-e e criação/edição da despensa. Para mercados guarda CEP, coordenadas e somente o nome principal retornado pelo Places, sem persistir `place_id`; para despensas grava o CEP em `pantries.location` e somente o nome principal em cache local em `pantries.location_name`. O banco hospedado ainda não foi alterado. A fotografia oficial do banco de 8 de outubro continua preservada sem alterações.
- A chave preenchida pelo usuário está em `.env.local` (ignorado pelo Git; o conteúdo não é registrado na memória). Após a atualização, Places Autocomplete retornou quatro sugestões e Place Details forneceu CEP e coordenadas em uma chamada real feita deste ambiente. Chamadas separadas ao Routes API e ao Directions API (Legacy) foram rejeitadas; não são necessárias para a busca de endereço. O teste visual no app Android ainda está pendente. Antes de produção, preferir um proxy autenticado ou SDK nativo; não distribuir chave irrestrita no bundle `EXPO_PUBLIC_`.
- O aparelho Android `RMX3710` está conectado pelo ADB quando executado fora do sandbox.
- O contrato do backend precisa definir o backfill de `location` para `market_id`; registros históricos que só têm CEP não identificam com segurança qual unidade foi visitada.

- O estado recolhida/aberta das listas ativas é salvo localmente por conta e despensa. Ao voltar à página, os cards recolhidos permanecem recolhidos; listas removidas ou concluídas são ignoradas ao restaurar a preferência.
- Implementado o seletor de sugestões no cartão de estimativa: “Mais perto”, “Melhor custo-benefício” e “Marcas mais compradas”. O cálculo local compara mercados do histórico, estima a lista por mercado, prioriza cobertura antes do menor preço, e relaciona marcas preferidas com os registros de cada mercado. A proximidade geocodifica o CEP da despensa e compara coordenadas em linha reta; requer Geocoding API habilitada e faturamento ativo no projeto Google Cloud da chave. No Android, as três sugestões foram validadas com dados locais após ativação da API.

### Fixtures demonstrativas de sugestões — 8 de outubro de 2026

- O endereço recomendado para testar a despensa é a Estação São Judas, Av. Jabaquara, 2438, Mirandópolis, São Paulo - SP, CEP 04046-400. No formulário, procurar o endereço no Maps e selecionar a sugestão correta; a lista de sugestões usa o CEP e o nome que o Places devolver para o local selecionado.
- Em desenvolvimento, a primeira abertura da página de listas cria uma lista ativa `Lista demonstrativa — Indianópolis`, com arroz tipo 1 5 kg, feijão carioca tipo 1 1 kg, leite semidesnatado UHT 1 L, macarrão espaguete com ovos 500 g e óleo de soja 900 ml. Cada item tem categoria obrigatória, quantidade e unidade/embalagem coerentes com o modelo local.
- O histórico de demonstração cria sete compras sintéticas ligadas a Atacadão - Indianópolis (CEP 04045-004), Carrefour Express Moema (CEP 04077-023) e Minuto Pão de Açúcar (CEP 04089-001), com nomes cacheados, coordenadas, marcas e itens em `pantry_products`. Isso permite diferenciar o Atacadão como mercado mais próximo e de menor custo no cenário, e o Minuto Pão de Açúcar como mercado com maior cobertura das marcas preferidas. Os produtos, marcas e lojas são reais; as compras não são transações nem cupons reais, e os preços são valores de referência demonstrativos, aproximados de catálogos públicos e podem variar por unidade, promoção e data.
- Endereços verificados em [Metrô São Judas](https://www.metro.sp.gov.br/pt_BR/sua-viagem/linhas-estacoes/linha-1-azul/estacao-sao-judas/), [Atacadão Indianópolis](https://www.atacadao.com.br/loja/indianopolis), [Carrefour Express Moema](https://www.waze.com/live-map/directions/br/sp/carrefour-express-moema?to=place.ChIJvxt21fpbzpQRM_SDSVHIFzI) e [Minuto Pão de Açúcar Indianópolis](https://www.paodeacucar.com/nossas-lojas/alameda-dos-maracatins-88.sdx?filter=Minuto). CEP/coords dos registros locais foram conferidos com Places para os locais selecionados.
- Ao inserir a nova fixture, o serviço remove apenas os mocks antigos identificados pelos títulos/nome exatos. Registros de compras e mercados sem esses marcadores são preservados. Se a fixture completa já existir, ela não é recriada nem sobrescreve alterações feitas pelo usuário na lista demonstrativa.
- Estado desta sessão: fixture e documentação atualizadas; `npx expo export --platform android` compilou com sucesso e `git diff --check` passou. Ainda falta conferir no Android que o usuário seleciona a Estação São Judas no Maps e que a lista/sugestões aparecem no aparelho. A fixture é disparada ao focar a página de listas da despensa em modo de desenvolvimento.

Na continuação da página, os cards dos produtos usam a cor da categoria na barrinha lateral; `Limpeza/Higiene`, cujo fundo é branco puro, recebe contorno cinza. Foi incluído um atalho de lápis para abrir o modal de edição do produto, que permite alterar nome, quantidade, peso/volume, unidade e categoria na lista ativa. O serviço mantém o estado de marcação do item.

Os dropdowns com seta da página de listas e do seletor de categoria animam a mudança de layout e a rotação da seta, preservando as alturas naturais definidas pelo conteúdo. A entrada e a saída do conteúdo usam 180 ms de opacidade, escala vertical e deslocamento, seguindo o padrão dos seletores de avatar/cor.

## Riscos conhecidos

- Em 12/09, o extrator foi corrigido e validado por consulta HTTP de uma NFC-e SP fornecida pelo usuário: reconhece os campos `txtTit`, `Rqtd`, `RUN`, `RvlUnit`, `valor`, `u20` e `txtMax`, incluindo quantidade fracionada, preço sem símbolo de moeda e emissão. A amostra real não foi gravada em arquivo; o teste `node tests/nfce-extraction.cjs` usa dados sintéticos. O reteste no Expo Go continua pendente. Essa validação cobre a extração, não conclui os requisitos de revisão completa, aliases e conversão de produtos vendidos por peso para o estoque de quantidade inteira.

- Prazo curto para o escopo obrigatório.
- Ausência de dispositivo iOS para teste físico.
- Backend ainda indisponível para alguns fluxos.
- Consulta e extração de páginas da SEFAZ podem variar ou mudar sem controle do aplicativo.
- Fluxo visual da importação por QR Code ainda não foi aprovado no Figma.
- O Figma atualizado `824:4634` inclui o campo de preço; a pendência visual anterior desse campo foi resolvida.
- Sombras no Android dependem de `elevation` e não reproduzem de forma idêntica o `box-shadow` uniforme do Figma; a aparência final deve continuar sendo validada no aparelho-alvo.
- A compatibilidade visual e comportamental desta fatia ainda não foi validada em dispositivo iOS físico.
