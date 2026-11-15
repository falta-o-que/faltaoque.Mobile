# Auditoria de código — 15 de novembro de 2026

## Escopo e verificação

Revisão estática de fluxos de armazenamento, autenticação, despensas, listas, estoque, NFC-e, notificações, Dashboard, preferências, navegação e alterações recentes de interface. Foram executados os 38 scripts existentes: 37 passaram e um falhou antes de executar o cenário. A exportação Android do Expo passou. Não houve execução dos fluxos no aparelho nem validação física em iOS. Os cenários adicionais abaixo usam o harness local isolado. Esta revisão não prova ausência de outros defeitos nem verifica a API hospedada.

## Achados adicionais

### A45 — P1 — Revisões por ambiguidade são ignoradas em linhas fiscais agrupadas

`src/screens/NfceReviewScreen/index.js:54` desativa `requiresReview` para qualquer grupo de linhas, inclusive quando a própria descrição tem ambiguidade. `src/services/nfceImportService.js:109` também dispensa a validação de revisão para grupos. Assim, duas linhas fiscais idênticas com nome ou embalagem ambíguos podem ser incluídas sem a decisão necessária. O teste `tests/nfce-duplicate-lines.cjs` confirma a dispensa mesmo com `requiresReview: true`; a decisão de 7 de novembro dispensa apenas revisão causada pelo agrupamento, não ambiguidades reais.

### A46 — P2 — Nova cor é salva como ciano em bancos já existentes

`src/constants/colorOptions.js:1` oferece o novo verde e `src/storage/localDatabase.js:18` o inclui somente na criação de bancos novos. Um banco já criado conserva sua tabela de cores anterior; `src/storage/localDatabase.js:50` escolhe a primeira cor quando não encontra a solicitada. Cadastro, edição de perfil e criação/edição de despensa usam essa resolução. Reproduzido com um banco existente cuja cor antiga estava na tabela: escolher o novo verde resolveu para ciano. Cor antiga também pode continuar aparecendo em dados já salvos.

### A47 — P2 — Dashboard compara períodos mensais diferentes

`src/domain/dashboardAnalytics.js:90` a `:98` soma todo o mês anterior, mas a decisão de 7 de novembro exige comparar os mesmos dias do mês anterior. Reproduzido com uma compra de 10 no dia 2 e outra de 90 no dia 20 do mês anterior, comparadas a 20 até o dia 5 atual: o código usa 100 e mostra -80%; deveria usar 10 e mostrar +100%.

### A48 — P2 — Teste de sincronização de notificações não executa

`tests/settings-notification-permission-sync.cjs:110` rejeita um import da tela de configurações que não está nos mocks do harness. O teste termina antes de testar a permissão, portanto não estabelece que a funcionalidade esteja quebrada; a cobertura precisa ser atualizada.

## Achados anteriores que permanecem

A auditoria de 6 de novembro documenta com cenários reproduzidos os problemas B35 a B44 e C03. A inspeção atual encontrou as mesmas estruturas nos pontos correspondentes; os cenários antigos não foram reproduzidos novamente nesta revisão. Eles devem continuar em aberto até correção e verificação específica:

- **B35, P1:** inicializações concorrentes podem sobrescrever dados recém-gravados (`src/storage/localDatabase.js:141`).
- **B36, P1:** falha na recarga após gravação pode apresentar erro e induzir repetição (`src/screens/GroceryListScreen/index.js:221`, `:527`; `src/screens/PantryScreen/index.js:335`).
- **B37, P2:** submissões simultâneas podem duplicar operações (`src/components/CreatePantryModal/index.js:120`; `src/screens/NotificationsScreen/index.js`).
- **B38, P2:** venda fiscal em peso com quantidade inteira perde a medida (`src/services/nfceImportService.js:118`); a representação final depende de decisão funcional.
- **B39, P2:** precisão decimal pode separar apresentações equivalentes (`src/domain/pantryProductGrouping.js:6`).
- **B40, P2:** gravações simultâneas podem perder escolhas de agrupamento (`src/services/pantryProductViewPreferenceService.js:28`).
- **B41, P2:** falha de leitura pode levar à substituição das preferências de agrupamento (`src/services/pantryProductViewPreferenceService.js:12`).
- **B42, P2:** estimativa pode usar compras menos recentes quando várias são do mesmo dia (`src/services/groceryPriceEstimateService.js:104`).
- **B43, P2:** resposta antiga de notificação pode navegar depois da troca de conta (`src/navigation/RootNavigator.js:62`).
- **B44, P2:** leitura atrasada pode ocultar uma despensa recém-criada até a recarga (`src/screens/HomeScreen/index.js:87`; `src/screens/PantriesScreen/index.js:60`).
- **C03, P2:** falha temporária ao restaurar sessão pode mostrar login como se não existisse sessão (`src/contexts/AuthContext.js:15`).

A descrição completa, evidências e decisões pendentes R01 e C05 estão em `auditoria-bugs-2026-11-06.md`.

## Prioridade sugerida

Primeiro proteger a inicialização do banco e distinguir gravações concluídas de falhas de atualização da tela. Em seguida corrigir a revisão fiscal, compatibilidade da cor em bancos existentes e o cálculo do Dashboard. Depois tratar as demais corridas e falhas de preferência e restaurar a cobertura do teste de notificações.
