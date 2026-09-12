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
- O card de despensa exibe nome, cor, contagem de produtos cadastrados e contador provisório da lista, ícone de configuração em `black/400` e reticências para nomes longos. A Home atualiza a listagem ao recuperar o foco.
- A listagem da Home possui estado vazio e de erro, espaçamento de 16 px entre cards, rolagem por trás do botão `Criar` e recorte junto à Navbar.
- Ações ainda indisponíveis dos atalhos, da configuração do card e das demais opções da Navbar exibem o aviso `Em breve`.
- A cor do avatar exibida na Home é a cor escolhida e persistida durante o cadastro.
- O toque em um card da Home abre a tela da própria despensa (Figma `641:1776`). A tela consulta a despensa da conta ativa pelo identificador, mostra nome e cor persistidos e trata carregamento, erro e despensa indisponível.
- A tela da despensa inicia sem produtos de demonstração e mantém Perfil selecionado na Navbar, pois foi aberta pela Home. Possui busca reutilizável (`SearchField`), categorias com seleção múltipla e texto branco nos fundos escuros e botões redondos reutilizados de `ModalActionButton`. As tags permanecem visíveis; o botão de filtro mostra `Em breve` até a implementação do modal. Compartilhamento continua indisponível.
- Os ícones `AddUserIcon`, `DeliveryIcon` e `BoxIcon` foram convertidos dos SVGs fornecidos. O `ProductCard` reutilizável usa `legumesGrocery.png` como imagem genérica. A tela carrega os produtos persistidos da despensa/conta ativa e combina busca sem acentos com seleção múltipla de categorias. Ações de informação e alteração de quantidade ainda aguardam implementação.
- O botão de adição abre `AddProductModal`, baseado no Figma `824:4634`, com nome, preço unitário e quantidade obrigatórios; peso/volume e categoria única opcionais. Quando há medida, exige uma unidade entre `g`, `kg`, `ml` e `L`. O modal trata erros por campo, impede reenvio e preserva o formulário se o salvamento falhar.
- A adição manual persiste produto e compra numa única gravação, com origem `manual`, data/hora atual, local vazio e valores unitário/total. As operações de criação de contas, despensas e produtos usam uma fila de gravação para evitar perda por concorrência. Após adicionar, a tela limpa busca e filtros para mostrar o novo produto.
- Testes com armazenamento simulado em `tests/product-addition.cjs` cobrem validação, migração, isolamento por conta, falha de gravação, concorrência, histórico e releitura; executar com `node tests/product-addition.cjs`.
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

Retomar primeiro os ajustes da página da despensa e do modal de adição de produto. O usuário encerrou a sessão informando que ainda há ajustes necessários nessa página, mas não detalhou quais; não considerar essa interface aprovada ou concluída.

## Ponto de parada — 12 de setembro de 2026

- Branch da sessão: `feature/DespensaPage`. As alterações permanecem locais e sem commit; conferir a branch e o estado do Git ao retomar e preservar esse trabalho.
- Referências visuais: página da despensa no Figma `641:1776` e modal de produto `824:4634`, arquivo `clwpIe4TC12SEAwf26SGo9`.
- Implementado nesta sessão: navegação Home → despensa, estado vazio, busca, seleção múltipla de categorias, card reutilizável com `legumesGrocery.png`, modal de adição, ícones convertidos e persistência local de produto/histórico.
- Correções já confirmadas pelo usuário: manter Perfil selecionado na Navbar ao abrir pela Home; botão de filtro deve mostrar `Em breve` até existir seu modal; tags da busca aceitam múltipla seleção e usam texto branco em fundos escuros. A categoria de cada produto continua única e opcional.
- Verificação realizada: bundle Android compilado e `node tests/product-addition.cjs` aprovado com armazenamento simulado. Isso não substitui validação visual/interativa nem testes físicos de Android/iOS.
- Ao retomar: colher os ajustes concretos apontados pelo usuário e revisar página/modal no aplicativo, incluindo teclado, rolagem, seleção de categorias, cancelamento, erros e adição. Não presumir que os ajustes pendentes já foram identificados.
- Depois dessa revisão, continuar as operações restantes de produtos (informações, quantidade, edição e exclusão) e edição/exclusão de despensas. O spike fiscal SP continua pendente de validação com QR Code real.

## Riscos conhecidos

- Prazo curto para o escopo obrigatório.
- Ausência de dispositivo iOS para teste físico.
- Backend ainda indisponível para alguns fluxos.
- Consulta e extração de páginas da SEFAZ podem variar ou mudar sem controle do aplicativo.
- Fluxo visual da importação por QR Code ainda não foi aprovado no Figma.
- O Figma atualizado `824:4634` inclui o campo de preço; a pendência visual anterior desse campo foi resolvida.
- Sombras no Android dependem de `elevation` e não reproduzem de forma idêntica o `box-shadow` uniforme do Figma; a aparência final deve continuar sendo validada no aparelho-alvo.
- A compatibilidade visual e comportamental desta fatia ainda não foi validada em dispositivo iOS físico.
