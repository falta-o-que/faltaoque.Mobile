# Estado atual

Última atualização: 12 de setembro de 2026.

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
- A cobertura automatizada inicial se concentra na adição de produtos e persistência; ainda não há suíte de interface consolidada.

## Trabalho humano em andamento

- Biblioteca de ícones convertida para componentes React Native SVG e centralizada em `src/assets/icons/export.js`.
- Ajustes na navbar.

Áreas temporariamente protegidas contra alterações não solicitadas:

- `src/components/Navbar/`
- `src/assets/icons/`

## Preparação concluída

- Fluxo de agentes e política de modelos registrados.
- Política vigente: Terra/leve como orquestrador para economizar tokens, Luna/médio para execução delimitada e Sol/médio ou alto para maior complexidade. Escalonamento e recomendações de raciocínio seguem `docs/agents/workflow.md` e a decisão de 9 de setembro de 2026.
- Memória operacional do projeto criada em `docs/project`.
- Especificação executável do marco criada em `docs/specs/milestone-2026-09-14.md`.
- Arquitetura substituível entre armazenamento local e backend registrada.
- Estratégia de spike da NFC-e de São Paulo documentada.
- `styled-components/native` definido como padrão obrigatório.

## Próxima etapa

Iniciar a próxima funcionalidade definida pelo usuário. A página da despensa, seus modais de adição e consulta/edição, busca, filtros por tags e controles de quantidade foram aprovados pelo usuário como base visual e funcional; ajustes futuros devem ser tratados como novo escopo ou feedback concreto.

## Ponto de parada — 12 de setembro de 2026

- Branch da sessão: `feature/DespensaPage`. As alterações permanecem locais e sem commit; conferir a branch e o estado do Git ao retomar e preservar esse trabalho.
- Referências visuais: página da despensa no Figma `641:1776` e modal de produto `824:4634`, arquivo `clwpIe4TC12SEAwf26SGo9`.
- Implementado nesta sessão: navegação Home → despensa, estado vazio, busca, seleção múltipla de categorias, ordenação no modal de filtros do Figma `820:3267`, card reutilizável com `legumesGrocery.png`, preço unitário, marcador circular de categoria, modais de adição e consulta/edição/exclusão e persistência local de produto/histórico.
- Correções aprovadas pelo usuário: manter Perfil selecionado na Navbar ao abrir pela Home; tags da busca aceitam múltipla seleção e usam texto branco em fundos escuros; categoria única e obrigatória; preço pode ser informado por unidade ou como total do lote, com cálculo do complementar. A página da despensa está aprovada como concluída para esta etapa.
- Verificação realizada: bundle Android compilado e `node tests/product-addition.cjs` aprovado com armazenamento simulado. Isso não substitui validação visual/interativa nem testes físicos de Android/iOS.
- O modal Info permite consulta e edição de nome, preço por unidade ou total do lote, quantidade, validade, peso/volume, unidade e categoria. A edição atualiza somente o produto; a compra manual original no histórico permanece imutável.
- A exclusão do produto está disponível no modal Info, exige confirmação explícita e remove apenas o produto da despensa; o histórico de compra é preservado. Ao retomar: aguardar a definição da próxima funcionalidade. A edição/exclusão de despensas e o spike fiscal SP continuam pendentes; este último requer validação com QR Code real.

## Riscos conhecidos

- Prazo curto para o escopo obrigatório.
- Ausência de dispositivo iOS para teste físico.
- Backend ainda indisponível para alguns fluxos.
- Consulta e extração de páginas da SEFAZ podem variar ou mudar sem controle do aplicativo.
- Fluxo visual da importação por QR Code ainda não foi aprovado no Figma.
- O Figma atualizado `824:4634` inclui o campo de preço; a pendência visual anterior desse campo foi resolvida.
- Sombras no Android dependem de `elevation` e não reproduzem de forma idêntica o `box-shadow` uniforme do Figma; a aparência final deve continuar sendo validada no aparelho-alvo.
- A compatibilidade visual e comportamental desta fatia ainda não foi validada em dispositivo iOS físico.
