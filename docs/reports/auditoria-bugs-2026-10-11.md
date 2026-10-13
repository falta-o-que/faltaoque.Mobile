# Auditoria de bugs — FaltaOquê Mobile

Data: 11/10/2026. Branch: `develop`. Commit auditado: `8b62543ed9d40d7ed26e8d341548030bf032f84e`.

## Resumo

Foram identificados **31 defeitos: 7 de prioridade P1, 17 de prioridade P2 e 7 de prioridade P3**. Há também uma ambiguidade funcional e problemas nos scripts de teste existentes, descritos separadamente.

Os riscos mais urgentes são perda integral do banco local, gravações que retornam erro depois de persistir, corrupção de preços após consumo, associação automática de produtos diferentes, total fiscal incompleto, seleção incorreta de endereço e notificações de uma conta reaparecendo após logout.

Esta auditoria não corrigiu código nem alterou dados do aplicativo. Este relatório é o único arquivo criado. Nenhum commit foi feito. Uma auditoria não garante ausência de outros bugs; abaixo está a cobertura efetivamente realizada e a evidência de cada achado.

### Como interpretar

- **P1:** perda ou corrupção de dados, associação incorreta persistida ou falha de isolamento de sessão. Corrigir primeiro.
- **P2:** comportamento funcional incorreto, bloqueio de fluxo ou divergência relevante do contrato documentado.
- **P3:** defeito de apresentação, navegação, mensagem ou fluxo com impacto menor.
- **Reprodução isolada:** execução do código de domínio/serviço/repositório com adaptadores em memória, sem dados reais.
- **Inspeção:** caminho demonstrado pela leitura do código; não significa reprodução em dispositivo físico.

As referências de linha correspondem ao commit auditado.

## Cobertura e verificações

Foram revisados o shell do app, navegação, autenticação, armazenamento e migrações, contas, despensas, produtos, saldo e agrupamento, listas, histórico, estimativas, mercados, busca de lugares, extração/importação fiscal, scanner, reconciliação e checkout, notificações, perfil, configurações, preferências e tradução. A revisão incluiu componentes, telas, estilos e configuração associados a esses fluxos, inclusive leitura das áreas de trabalho humano em Navbar e ícones.

As fontes de requisitos foram o skill local, memory bank, decisões, estado atual, SDD original, especificação de integração e documentos relacionados aos módulos revisados. Foi usada a documentação versionada do [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), incluindo [notificações](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/).

Verificações realizadas:

- Análise sintática dos **154 arquivos JavaScript em `src`**: nenhum erro de parsing.
- Exportação JavaScript Android: concluída, **1.235 módulos** empacotados.
- Exportação iOS: artefatos de bundle e metadados gerados.
- Catálogos pt-BR, inglês e espanhol: **815 chaves por idioma**, sem divergência de chaves/argumentos nas verificações estáticas realizadas. Isso não assegura que toda tela utilize corretamente as traduções: o defeito B16 demonstra esse limite.
- Execução dos cinco scripts existentes em `tests`: um passou, quatro falharam por expectativas/mocks desatualizados, detalhados adiante.
- Reproduções isoladas para perda do banco, erro após gravação, preço após consumo, marca ignorada, cadastro parcial, conversão de estimativas, corrida de notificações após logout e comportamentos de importação/reconciliação/histórico fiscal.
- Revisão independente em três frentes, seguida de conferência dos resultados pelo agente principal.

Limites: não houve teste em aparelho físico, câmera real, entrega real de notificações pelo sistema operacional, chamada real ao Google Places, consulta real à SEFAZ ou teste de um backend hospedado. Exportar bundles não equivale a compilar/instalar um aplicativo nativo. Backend ainda não operacional e funcionalidades explicitamente futuras não foram classificados como bugs.

## P1 — corrigir primeiro

### B01 — Uma estrutura incompleta ou futura pode apagar todo o banco local

**Local:** `src/storage/localDatabase.js:83`, `:87`, `:180`.

`readDatabase()` chama `initializeDatabase()` quando o envelope é considerado legado. A classificação também aceita um banco da versão atual com uma tabela ausente ou uma versão futura com novas tabelas. A inicialização sobrescreve contas, despensas, compras, produtos e listas com um banco vazio.

**Reprodução isolada:** banco versão 11 com usuários e produtos; remover somente a chave de tabela `markets`; ler o banco. O resultado e o conteúdo persistido passam a ter zero usuários, mantendo versão 11.

**Impacto:** perda silenciosa de todos os dados; downgrade após evolução de esquema também fica exposto. A limpeza deliberada de versões antigas documentadas é outro caso e não constitui este achado.

**Correção recomendada:** rejeitar envelopes incompatíveis sem sobrescrever o original; impedir abertura destrutiva de versões futuras e implementar migrações explícitas.

### B02 — Uma operação informa falha depois de já ter gravado os dados

**Local:** `src/storage/localDatabase.js:188-206`.

O payload do banco é gravado antes da chave separada de versão. Se a segunda gravação falhar, a operação rejeita apesar de a mutação já estar persistida.

**Reprodução isolada:** falhar apenas a escrita da versão durante `addProduct()`. A chamada lança erro, mas o número de ocorrências sobe de 1 para 2.

**Impacto:** a tela informa falha e uma tentativa repetida pode duplicar compras/produtos. Também há risco de metadados de versão divergirem do payload.

**Correção recomendada:** estabelecer um protocolo de persistência que identifique o commit efetivo; evitar duas gravações independentes para metadados inseparáveis e tornar operações de criação idempotentes.

### B03 — Editar preço após consumo corrompe o preço histórico

**Local:** `src/repositories/productRepository.js:45-47`, `:200-220`; `src/domain/productValidation.js:62-70`; `src/components/ProductInfoModal/index.js:37-52`.

A edição recebe o saldo atual como quantidade, mas o preço unitário deriva da quantidade originalmente comprada. Ao normalizar uma edição em preço unitário, o código multiplica pelo saldo e grava o resultado como preço histórico do item.

**Reprodução isolada:** comprar 3 unidades por R$30; consumir até saldo 1; salvar R$10 por unidade. A quantidade comprada continua 3, o total do item vira R$10 e o preço unitário derivado vira R$3,33. A compra continua com total R$30.

Há ainda falta de uma política consistente para edição de preço e total da compra: `updateProduct()` muda o item, mas não trata o total do registro pai, inclusive numa compra manual de um único item. Para notas fiscais, atualizar automaticamente o total fiscal também seria incorreto sem uma decisão explícita.

**Impacto:** histórico e estimativas deixam de refletir os valores corretos.

**Correção recomendada:** separar saldo de quantidade comprada; calcular preço histórico com a quantidade apropriada e definir como correções de preço se relacionam ao total manual/fiscal.

### B08 — Correspondência automática vincula produtos comercialmente diferentes

**Local:** `src/domain/groceryCheckoutReconciliation.js:112-121`, `:197-213`.

Um único token longo pode receber pontuação 0,86; inclusão de todos os termos de um nome em outro recebe 0,94. Um candidato único acima de 0,85 é automaticamente aceito.

**Reprodução isolada:** `Chocolate` é vinculado a `Chocolate Granulado`; `Leite Integral` a `Leite Integral em Pó`, sem tamanho informado.

**Impacto:** uma linha pode receber identidade/categoria de um produto diferente como vínculo automático. A regra documentada exige comparação conservadora e tratamento de ambiguidade.

**Correção recomendada:** penalizar diferenças de apresentação/termos discriminantes e exigir confirmação nesses casos; pontuação lexical alta sozinha não comprova equivalência.

### B09 — Importação direta grava subtotal selecionado como total da compra

**Local:** `src/services/nfceImportService.js:76-82`.

O total persistido é a soma dos produtos selecionados para estoque, ignorando o total real da nota. No checkout de lista existe tratamento distinto para preservar o total fiscal.

**Reprodução isolada:** nota de R$25; selecionar produtos de R$20 e ignorar uma linha de R$5. A compra é gravada com R$20.

**Impacto:** ignorar sacolas ou outros itens do estoque altera indevidamente o gasto histórico.

**Correção recomendada:** persistir o total fiscal da compra separadamente do subtotal que entra na despensa.

### B17 — Resposta atrasada do Places pode salvar endereço/mercado errado

**Local:** `src/components/PlaceSearchField/index.js:18-68`, `:73-76`.

A busca de sugestões possui controle de sequência, mas `choose()` não possui. Opções continuam selecionáveis durante a consulta de detalhes e o campo continua editável.

**Cenário por inspeção:** selecionar A e depois B; B responde primeiro e A por último. O `onSelect` de A sobrescreve B. Limpar/editar o campo durante a espera também pode ser desfeito pela resposta antiga.

**Impacto:** o formulário pode persistir um endereço ou mercado diferente da última escolha.

**Correção recomendada:** invalidar solicitações antigas ao selecionar, editar, limpar e desmontar; aceitar somente o resultado da escolha vigente.

### B26 — Sincronização pendente recria notificações de uma conta após logout

**Local:** `src/services/notificationService.js:17`, `:243-324`; `src/navigation/RootNavigator.js:65-66`; `src/screens/HomeScreen/index.js:86`.

Existe limpeza de notificações no logout. Porém, uma sincronização iniciada antes do logout continua executando e pode agendar depois da limpeza. O lock é por conta, enquanto os agendamentos do dispositivo são compartilhados.

**Reprodução isolada:** pausar a leitura de despensas da conta A; executar a limpeza de logout; liberar a leitura. A sincronização agenda novamente uma notificação contendo `accountId: account-a`.

**Impacto:** alertas da conta anterior podem reaparecer após sair; em troca rápida de conta, sincronizações também podem interferir nos agendamentos da nova conta.

**Correção recomendada:** invalidar trabalhos de sessões anteriores e serializar reconciliação/limpeza do recurso global de notificações.

## P2 — funcionamento e integridade do fluxo

### B04 — Edição de marca é descartada

**Local:** `src/repositories/productRepository.js:209-214`.

O formulário e a normalização produzem a marca nova, mas o update não grava `brand`. **Reprodução isolada:** salvar `Marca B`; recarregar retorna `Marca A`. Isso também afeta agrupamento e preferência de marcas.

**Recomendação:** persistir o campo e conferir sua repercussão nos grupos.

### B05 — Cadastro pode criar conta e retornar falha sem sessão

**Local:** `src/services/authService.js:42-65`, especialmente `:62-64`; `src/repositories/accountRepository.js:23-35`.

A conta é persistida antes da sessão no SecureStore. **Reprodução isolada:** falhar a gravação da sessão; cadastro rejeita, conta existe, repetição acusa `EMAIL_ALREADY_EXISTS`.

**Impacto:** usuário fica sem indicação de que o cadastro ocorreu e precisa descobrir que login pode recuperá-lo.

**Recomendação:** tratar explicitamente cadastro confirmado com falha de sessão e oferecer recuperação coerente.

### B06 — Produtos zerados ou vencidos não permitem editar campos independentes

**Local:** `src/domain/productValidation.js:44`, `:49-51`; `src/components/ProductInfoModal/index.js:37-52`, `:96-103`.

A edição reutiliza validação de criação: quantidade precisa ser positiva e validade precisa ser hoje/futura. Saldo zero e validade passada são estados legítimos de ocorrências existentes.

**Cenários por inspeção:** zerar estoque e tentar alterar nome/categoria; deixar validade passar e tentar corrigir outro campo. Salvar exige inventar saldo ou remover/alterar a validade real.

**Recomendação:** distinguir validação de criação e edição, preservando estados existentes válidos.

### B07 — Estimativa não converte unidades equivalentes

**Local:** `src/services/groceryPriceEstimateService.js:68-71`, `:128-139`.

O cálculo exige igualdade do identificador da unidade. `g`/`kg` e `ml`/`L` caem no fallback sem a conversão física necessária.

**Reprodução isolada:** histórico de café 500g por R$10; lista de café 1kg. Estimativa retorna R$10, em vez de R$20 para a mesma referência de preço por massa.

**Recomendação:** normalizar massa e volume dentro da mesma dimensão antes de aplicar proporção; não converter dimensões distintas.

### B10 — Conclusão da lista destrói a estimativa final

**Local:** `src/services/groceryCheckoutService.js:110-116`; `src/services/groceryListService.js:62-65`, `:84-91`.

O checkout substitui `grocery_lists.estimated_price` pelo valor efetivamente pago. SDD de integração, linha 36, e decisões, linha 143, exigem preservar a estimativa de listas concluídas.

**Cenário por inspeção:** estimativa R$12, compra R$20; lista concluída fica com estimativa R$20. A previsão anterior se perde.

**Recomendação:** preservar estimativa e total real em seus respectivos registros, com associação explícita entre lista e compra.

### B11 — Preço unitário editado na revisão direta de NFC-e é ignorado

**Local:** `src/components/PurchaseProductReviewCard/index.js:122-125`; `src/screens/NfceReviewScreen/index.js:68-96`; `src/services/nfceImportService.js:76-82`.

Preço unitário e total são editáveis independentemente; o caminho de persistência privilegia o total e posteriormente deriva o unitário.

**Cenário conferido no serviço:** quantidade 2, total R$20; editar unitário para R$5 mantendo total. Ao recarregar, o unitário volta a R$10.

**Recomendação:** sincronizar os valores ou bloquear inconsistências com mensagem clara antes de salvar.

### B12 — Item fiscal ambíguo pode ser salvo sem revisão explícita

**Local:** `src/screens/NfceReviewScreen/index.js:29-36`, `:48-89`, `:118`, `:159`; `src/components/PurchaseProductReviewCard/index.js:117-145`.

O fluxo direto identifica `requiresReview`, mas não o usa para impedir confirmação. O aviso depende de expandir o card.

**Cenário por inspeção:** apresentação ambígua como `PACK 6 X 350ML` permanece selecionada e pode ser importada sem abrir/corrigir o card.

**Recomendação:** exigir resolução das ambiguidades antes da confirmação, conforme o contrato fiscal.

### B13 — Histórico associa lista à compra errada

**Local:** `src/services/groceryListService.js:40-49`.

A associação utiliza a primeira compra ainda não utilizada com mesmo título, despensa, mercado e total, sem uma relação persistida entre lista e compra.

**Reprodução isolada:** criar A e B com mesma assinatura; concluir B em 09/10 e A em 10/10. O histórico atribui 09/10 a A e 10/10 a B. Outra compra com mesma assinatura também pode ser escolhida.

**Recomendação:** persistir o vínculo de conclusão e usar esse identificador no histórico.

### B14 — Fechar scanner não cancela o resultado pendente

**Local:** `src/components/NfceScannerModal/index.js:17-26`.

Depois da leitura, a consulta aguarda e chama `onPurchaseLoaded` incondicionalmente. Fechar o modal não invalida a solicitação.

**Cenário por inspeção:** ler QR, fechar enquanto consulta carrega; resposta abre revisão após cancelamento. Reabrir pode permitir que o resultado antigo substitua o novo.

**Recomendação:** invalidar a leitura ao fechar/desmontar e aceitar somente a sessão atual do scanner.

### B16 — Validações da lista desaparecem em inglês/espanhol

**Local:** `src/components/GroceryListModal/index.js:136-140`, `:204`, `:214`, `:228`, `:333`.

O código traduz o erro e depois identifica o campo procurando palavras em português: `nome`, `data`, `mercado`. A mensagem geral fica oculta no formulário de lista.

**Cenário por inspeção:** escolher inglês ou espanhol e enviar nome vazio, data inválida ou mercado não selecionado. O envio é impedido sem a explicação correspondente.

**Recomendação:** armazenar códigos/erros por campo; texto traduzido não deve controlar lógica de validação.

### B18 — Falha de fontes deixa o aplicativo em carregamento infinito

**Local:** `src/App.js:51`, `:60`.

`useFonts` disponibiliza carregamento e erro, mas o app lê apenas o carregamento. Uma falha de fonte mantém o spinner e bloqueia autenticação e telas.

**Evidência:** inspeção do tratamento de erro e contrato do hook do SDK instalado. Não foi provocada falha de fontes em aparelho.

**Recomendação:** tratar o erro, permitir fallback ou apresentar recuperação.

### B20 — Modal de notificação reabre após o usuário fechá-lo

**Local:** `src/screens/NotificationsScreen/index.js:278-323`.

Adicionar à lista aguarda persistência e depois redefine `selectedNotification`. Os controles de fechar/adiar continuam disponíveis durante a espera.

**Cenário por inspeção:** iniciar adição, fechar modal antes da resposta; conclusão seleciona novamente a notificação e reabre o modal.

**Recomendação:** separar atualização dos dados da seleção visual e invalidar continuações quando a interação termina.

### B21 — Aberturas concorrentes de notificações misturam listas de despensas

**Local:** `src/screens/NotificationsScreen/index.js:150-179`, `:281-293`.

A consulta de listas não confere qual notificação continua selecionada. A resposta antiga pode sobrescrever as opções da nova seleção.

**Cenário por inspeção:** abrir A, depois B de outra despensa; A responde por último. B passa a mostrar listas de A, e a tentativa de adição pode falhar na validação de despensa.

**Recomendação:** vincular resultados à seleção vigente e invalidar requisições anteriores.

### B22 — Pergunta de agrupamento sobrevive à tela da despensa

**Local:** `src/screens/PantryScreen/index.js:117-157`, `:181-190`, `:270`, `:288`.

Verificações assíncronas e timers de pós-criação/edição não são cancelados ao sair. Podem abrir alerta nativo não cancelável sobre outra tela. A chamada iniciada no timer também pode rejeitar sem tratamento.

**Impacto:** interrupção de outro fluxo e gravação de preferência de uma despensa que já não está sendo visualizada.

**Recomendação:** condicionar alertas ao foco/vida da tela, limpar timers e tratar rejeições.

### B27 — Permissão concedida nas configurações do sistema não agenda imediatamente

**Local:** `src/screens/SettingsScreen/index.js:50-76`.

Ao voltar do sistema, a tela atualiza somente o estado da permissão. A reconciliação está ligada ao salvamento de preferências, que não fica disponível apenas pela mudança da permissão.

**Cenário por inspeção:** alertas existentes sem permissão; conceder no sistema e voltar a Settings. O controle indica permissão ativa, mas agendamentos aguardam outro fluxo que execute sincronização, como retornar à Home.

**Recomendação:** reconciliar quando a permissão efetivamente muda para autorizada.

### B28 — Falha de leitura pode apagar histórico de notificações na próxima escrita

**Local:** `src/services/notificationService.js:49-70`, `:84-90`.

`readMetadata()` transforma qualquer erro de leitura/JSON em metadados vazios. `updateMetadata()` usa esse resultado como base e o grava.

**Cenário por inspeção:** já existem IDs lidos, dispensados e tratados; a leitura falha temporariamente, mas a escrita seguinte funciona. O conjunto anterior é substituído por uma base vazia acrescida da alteração atual.

**Impacto:** alertas tratados/dispensados podem reaparecer e perder seu estado.

**Recomendação:** distinguir ausência de dados de falha de leitura; impedir atualização destrutiva quando não foi possível recuperar o estado anterior.

### B31 — Linhas fiscais repetidas são fundidas antes do vínculo e da persistência

**Local:** `src/services/nfceImportService.js:33-37`; `src/domain/fiscalItems.js:11-33`.

Linhas com mesma descrição/unidade viram um grupo com quantidade somada. O grupo recebe um vínculo único e produz uma ocorrência única.

**Reprodução isolada:** duas linhas de leite 1L, uma unidade cada, tornam-se um item de quantidade 2 com dois `sourceItems`, mas uma única decisão de vínculo/ocorrência.

**Requisito:** o agrupamento era autorizado historicamente em setembro. As decisões posteriores de 09/10 (`docs/project/decisions.md:65`, `:75`; SDD de integração `:111`) exigem vínculo por linha e uma ocorrência por linha fiscal confirmada. Agrupar visualmente pode continuar sendo possível; fundir vínculo/persistência viola a regra posterior.

**Recomendação:** conservar identidade e decisões das linhas originais, mesmo quando a interface mostra um agrupamento.

## P3 — apresentação, mensagens e navegação

### B15 — Scanner permite consultas duplicadas antes do próximo render

**Local:** `src/components/NfceScannerModal/index.js:18-21`.

O bloqueio usa estado React. Dois eventos nativos antes do render podem ambos observar `processing === false` e iniciar consultas. A proteção transacional de QR no repositório reduz o risco de duplicação persistida, mas não evita chamadas/callbacks duplicados.

**Evidência:** inspeção. **Recomendação:** trava síncrona por referência mais identificação da sessão de leitura.

### B19 — Checkout mostra mensagens técnicas sem tratamento consistente

**Local:** `src/screens/GroceryListScreen/index.js:441-443`, `:714`.

Somente `DUPLICATE_FISCAL_NOTE` é traduzido/mapeado; outros erros usam `cause.message`. Códigos internos, mensagens do armazenamento ou português podem aparecer diretamente em outra língua.

**Evidência:** inspeção. **Recomendação:** mapear erros esperados e usar fallback contextual traduzido para erros inesperados.

### B23 — Despensa marca Perfil como destino ativo

**Local:** `src/screens/PantryScreen/index.js:403`.

A tela usa `Navbar activeItem="profile"`; o destino visual e acessível selecionado não corresponde à despensa. `PantriesScreen` utiliza `pantry`.

**Evidência:** inspeção. **Recomendação:** corrigir a propriedade na tela; não exige alterar o componente Navbar da área humana.

### B24 — Home/Despensas mostram estado vazio antes de carregar

**Local:** `src/screens/HomeScreen/index.js:60`, `:66-84`, `:251-253`; `src/screens/PantriesScreen/index.js:41-70`, `:160-163`.

Arrays começam vazios e a mensagem de ausência de despensas aparece antes de terminar a leitura. Conta com dados recebe uma mensagem temporariamente falsa.

**Evidência:** inspeção. **Recomendação:** distinguir carregamento inicial e vazio confirmado.

### B25 — Atalhos de notificações anunciam destinos implementados como futuros

**Local:** `src/screens/NotificationsScreen/index.js:135-140`.

Na tela independente de notificações, ações rápidas de Perfil/Configurações ainda abrem aviso de disponibilidade futura, embora os destinos existam. O handler de Navbar dessa tela também encaminha Perfil à Home.

**Evidência:** inspeção. **Recomendação:** alinhar os handlers às rotas atuais.

### B29 — Contador da despensa não corresponde aos cards exibidos

**Local:** `src/repositories/pantryRepository.js:9-11`; `src/repositories/productRepository.js:66-103`, `:127-137`.

Home conta ocorrências com saldo; a tela agrupa apresentações equivalentes e também exibe ocorrências zeradas não excluídas. Duas compras podem significar “2 produtos” em Home e um card na despensa; produto zerado visível pode coexistir com contador zero.

**Evidência:** inspeção. **Recomendação:** definir o significado do contador e alinhar cálculo e rótulo à apresentação.

### B30 — Etapas já resolvidas permanecem no checkout

**Local:** `src/components/GroceryCheckoutReview/index.js:96-101`, `:437-448`.

Etapas de vínculos automáticos/manuais permanecem enquanto há vínculos, inclusive já resolvidos. Contagem de etapas e navegação de retorno continuam incluindo esses cards. As decisões atuais pedem etapas apenas enquanto há pendências.

**Evidência:** inspeção. **Recomendação:** construir etapas a partir de pendências, preservando revisão dos resultados por um mecanismo explícito.

## Ambiguidade que requer decisão funcional

### A01 — Checkout manual sem itens fecha lista sem criar compra

**Local:** `src/services/groceryCheckoutService.js:94-99`.

**Reprodução isolada:** desmarcar todos os itens no modo manual e concluir. A lista fica finalizada, mas o número de compras não aumenta. Data/mercado desse checkout não ficam em uma nova compra.

As fontes mantidas no repositório garantem registro de compra vazia explicitamente para NFC-e (`docs/project/current-state.md:198`). Não há garantia inequívoca equivalente para modo manual. Portanto este comportamento **não foi incluído nos 31 bugs**.

É necessário definir se “nenhum item comprado manualmente” deve apenas finalizar a lista ou também gerar compra vazia. Não atribuir uma exigência ao usuário sem que ela esteja registrada.

## Scripts de teste existentes

| Script | Resultado observado | Motivo da primeira falha |
| --- | --- | --- |
| `tests/package-measure.cjs` | Passou | Asserções executadas concluíram |
| `tests/product-addition.cjs` | Falhou | Expectativa não inclui `brand: null`, retornado pelo contrato atual |
| `tests/nfce-extraction.cjs` | Falhou | Expectativa não inclui `sourceUnitLabel: 'kg'`, retornado pelo contrato atual |
| `tests/grocery-list.cjs` | Falhou antes da verificação funcional | Transformação/eval deixa `require` indisponível para `expo-crypto` |
| `tests/grocery-checkout.cjs` | Falhou antes das asserções | Mock de AsyncStorage não implementa `removeItem`, chamado pela inicialização de fixture antiga |

Essas quatro falhas não equivalem a quatro bugs no aplicativo. Contudo, a suíte atual não fornece cobertura confiável desses fluxos e precisa ser atualizada antes de servir como critério de regressão. As asserções posteriores à primeira falha não foram consideradas executadas.

## Risco técnico separado

O simulador de autenticação usa rotina própria de SHA-256 com 4.096 rodadas e hashes no armazenamento local. Se os dados do app forem extraídos, a resistência a tentativa offline merece revisão. Isso foi tratado como questão de endurecimento/arquitetura, sem contá-lo como defeito funcional confirmado nem como comprovação de comprometimento. Backend/autenticação remota futura precisam de avaliação própria.

## Ordem sugerida de correção

1. Proteger o banco contra sobrescrita e esclarecer confirmação de gravações: B01/B02.
2. Separar saldo, quantidade comprada, preço histórico, total fiscal e estimativa: B03/B09/B10/B11.
3. Tornar vínculos conservadores e preservar linhas originais: B08/B12/B31; criar associação lista–compra: B13.
4. Corrigir invalidação de requisições e sessão: B17/B26, depois B14/B20/B21/B22/B28.
5. Recuperação de cadastro/fontes e edição de estados existentes: B05/B06/B18; persistência da marca e unidades: B04/B07.
6. Validação por idioma, permissão e demais ajustes de interface: B16/B27 e P3.
7. Atualizar a infraestrutura de testes e cobrir os cenários acima; validar câmera, notificações, permissões e ciclo de vida em Android/iOS reais.

## Áreas sem outro defeito confirmado nesta revisão

Os caminhos normais de isolamento por conta/despensa, redução FIFO e aumento na ocorrência mais recente, exclusão em cascata de despensa, proteção de QR repetido dentro da despensa, normalização de e-mail/data, agrupamento de apresentação por massa/volume e deduplicação/validação de coordenadas de mercados foram revisados sem novo defeito confirmado. Isso não elimina os problemas específicos de concorrência, edição e integração descritos acima.
