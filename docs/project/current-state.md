# Estado atual

Última atualização: 11 de setembro de 2026.

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
- Componentes existentes incluem `ButtonClick`, `CategoryTag`, `Navbar`, `QuickActionButton`, `CreatePantryModal`, `ModalActionButton` e `PantryCard`.
- React Navigation está instalado e a estrutura inicial separa o fluxo público (`Login` e `Register`) do fluxo autenticado (`Home`).
- As telas-base de login, cadastro e home foram criadas a partir dos nós atuais de alta fidelidade do Figma.
- A troca entre os navegadores depende da sessão restaurada pelo contexto de autenticação.
- Contas locais são persistidas em um esquema versionado por meio de repositório substituível; senhas são armazenadas somente como hash com salt.
- A sessão ativa usa armazenamento seguro e é restaurada após reiniciar o aplicativo.
- Cadastro, login, login automático após cadastro e logout estão conectados às telas existentes.
- Despensas locais são criadas e listadas na Home por uma camada de serviço e repositório, com esquema local migrado para a versão 2 e isolamento por `accountId`.
- O modal de criação valida nome e cor, reutiliza botões de ação, bloqueia reenvio durante a persistência e apresenta erros junto aos dois campos.
- O card de despensa exibe nome, cor, contadores provisórios de produtos e lista, ícone de configuração em `black/400` e reticências para nomes longos.
- A listagem da Home possui estado vazio e de erro, espaçamento de 16 px entre cards, rolagem por trás do botão `Criar` e recorte junto à Navbar.
- Ações ainda indisponíveis dos atalhos, da configuração do card e das demais opções da Navbar exibem o aviso `Em breve`.
- A cor do avatar exibida na Home é a cor escolhida e persistida durante o cadastro.
- Ainda não existem mocks ou testes automatizados consolidados.

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

Executar as próximas operações do CRUD local de despensas (visualização, edição e exclusão) e, em paralelo, validar o spike fiscal com o conteúdo de um QR Code real de NFC-e de São Paulo.

## Riscos conhecidos

- Prazo curto para o escopo obrigatório.
- Ausência de dispositivo iOS para teste físico.
- Backend ainda indisponível para alguns fluxos.
- Consulta e extração de páginas da SEFAZ podem variar ou mudar sem controle do aplicativo.
- Fluxo visual da importação por QR Code ainda não foi aprovado no Figma.
- O modal de adição de produtos no Figma não mostra o campo de preço, embora ele seja obrigatório.
- Sombras no Android dependem de `elevation` e não reproduzem de forma idêntica o `box-shadow` uniforme do Figma; a aparência final deve continuar sendo validada no aparelho-alvo.
- A compatibilidade visual e comportamental desta fatia ainda não foi validada em dispositivo iOS físico.
