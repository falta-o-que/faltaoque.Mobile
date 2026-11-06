# Auditoria de bugs — FaltaOquê Mobile

Data: 11/10/2026. Branch: `develop`. Commit auditado: `8b62543ed9d40d7ed26e8d341548030bf032f84e`.

## Resumo

A auditoria original identificou **31 defeitos: 7 de prioridade P1, 17 de prioridade P2 e 7 de prioridade P3**. Depois
do fechamento da auditoria, o usuário relatou o B32 sobre notificações de marcas separadas, o B33 sobre a ordem da lista
de notificações e o B34 sobre o desempate de compras na mesma data, registrados abaixo como acompanhamentos. Em 6 de
novembro, B31 foi reclassificado após o usuário esclarecer que linhas fiscais idênticas devem formar um produto com
várias unidades. Há também uma ambiguidade funcional e problemas nos scripts de teste existentes, descritos
separadamente.

Os riscos mais urgentes são perda integral do banco local, gravações que retornam erro depois de persistir, corrupção de
preços após consumo, associação automática de produtos diferentes, total fiscal incompleto, seleção incorreta de
endereço e notificações de uma conta reaparecendo após logout.

Esta auditoria não corrigiu código nem alterou dados do aplicativo. Este relatório é o único arquivo criado. Nenhum
commit foi feito. Uma auditoria não garante ausência de outros bugs; abaixo está a cobertura efetivamente realizada e a
evidência de cada achado.

### Como interpretar

- **P1:** perda ou corrupção de dados, associação incorreta persistida ou falha de isolamento de sessão. Corrigir
  primeiro.
- **P2:** comportamento funcional incorreto, bloqueio de fluxo ou divergência relevante do contrato documentado.
- **P3:** defeito de apresentação, navegação, mensagem ou fluxo com impacto menor.
- **Reprodução isolada:** execução do código de domínio/serviço/repositório com adaptadores em memória, sem dados reais.
- **Inspeção:** caminho demonstrado pela leitura do código; não significa reprodução em dispositivo físico.

As referências de linha correspondem ao commit auditado.

## Cobertura e verificações

Foram revisados o shell do app, navegação, autenticação, armazenamento e migrações, contas, despensas, produtos, saldo e
agrupamento, listas, histórico, estimativas, mercados, busca de lugares, extração/importação fiscal, scanner,
reconciliação e checkout, notificações, perfil, configurações, preferências e tradução. A revisão incluiu componentes,
telas, estilos e configuração associados a esses fluxos, inclusive leitura das áreas de trabalho humano em Navbar e
ícones.

As fontes de requisitos foram o skill local, memory bank, decisões, estado atual, SDD original, especificação de
integração e documentos relacionados aos módulos revisados. Foi usada a documentação versionada
do [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/),
incluindo [notificações](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/).

Verificações realizadas:

- Análise sintática dos **154 arquivos JavaScript em `src`**: nenhum erro de parsing.
- Exportação JavaScript Android: concluída, **1.235 módulos** empacotados.
- Exportação iOS: artefatos de bundle e metadados gerados.
- Catálogos pt-BR, inglês e espanhol: **815 chaves por idioma**, sem divergência de chaves/argumentos nas verificações
  estáticas realizadas. Isso não assegura que toda tela utilize corretamente as traduções: o defeito B16 demonstra esse
  limite.
- Execução dos cinco scripts existentes em `tests`: um passou, quatro falharam por expectativas/mocks desatualizados,
  detalhados adiante.
- Reproduções isoladas para perda do banco, erro após gravação, preço após consumo, marca ignorada, cadastro parcial,
  conversão de estimativas, corrida de notificações após logout e comportamentos de importação/reconciliação/histórico
  fiscal.
- Revisão independente em três frentes, seguida de conferência dos resultados pelo agente principal.

Limites: não houve teste em aparelho físico, câmera real, entrega real de notificações pelo sistema operacional, chamada
real ao Google Places, consulta real à SEFAZ ou teste de um backend hospedado. Exportar bundles não equivale a
compilar/instalar um aplicativo nativo. Backend ainda não operacional e funcionalidades explicitamente futuras não foram
classificados como bugs.

## P1 — corrigir primeiro

### B01 — Uma estrutura incompleta ou futura pode apagar todo o banco local

**Atualização de 01/11/2026:** corrigido no código local: banco atual incompatível, versão futura e versão desconhecida
são rejeitados sem sobrescrita. Por decisão do usuário, versões anteriores conhecidas são recriadas vazias no esquema
11, sem migração. A gravação em duas chaves continua tratada separadamente em B02.

**Local:** `src/storage/localDatabase.js:83`, `:87`, `:180`.

`readDatabase()` chama `initializeDatabase()` quando o envelope é considerado legado. A classificação também aceita um
banco da versão atual com uma tabela ausente ou uma versão futura com novas tabelas. A inicialização sobrescreve contas,
despensas, compras, produtos e listas com um banco vazio.

**Reprodução isolada:** banco versão 11 com usuários e produtos; remover somente a chave de tabela `markets`; ler o
banco. O resultado e o conteúdo persistido passam a ter zero usuários, mantendo versão 11.

**Impacto:** perda silenciosa de todos os dados; downgrade após evolução de esquema também fica exposto. A limpeza
deliberada de versões antigas documentadas é outro caso e não constitui este achado.

**Correção recomendada:** rejeitar envelopes incompatíveis sem sobrescrever o original; impedir abertura destrutiva de
versões futuras e implementar migrações explícitas.

### B02 — Uma operação informa falha depois de já ter gravado os dados

**Atualização de 01/11/2026:** versão e tabelas são gravadas em um único registro. Identificador e marcador local de
operação permitem conferir uma escrita que retornou erro e bloquear novas gravações enquanto seu resultado não puder ser
determinado, inclusive após reiniciar. O usuário confirmou o funcionamento normal e a persistência no Android; falhas
antes/depois da escrita e da leitura foram testadas em simulação, não no aparelho. Não há garantia geral de idempotência
para ações fora desse armazenamento.

**Local:** `src/storage/localDatabase.js:188-206`.

O payload do banco é gravado antes da chave separada de versão. Se a segunda gravação falhar, a operação rejeita apesar
de a mutação já estar persistida.

**Reprodução isolada:** falhar apenas a escrita da versão durante `addProduct()`. A chamada lança erro, mas o número de
ocorrências sobe de 1 para 2.

**Impacto:** a tela informa falha e uma tentativa repetida pode duplicar compras/produtos. Também há risco de metadados
de versão divergirem do payload.

**Correção recomendada:** estabelecer um protocolo de persistência que identifique o commit efetivo; evitar duas
gravações independentes para metadados inseparáveis e tornar operações de criação idempotentes.

### B03 — Editar preço após consumo corrompe o preço histórico

**Atualização de 01/11/2026:** corrigido no simulador local; a edição unitária usa a quantidade comprada. O total da
compra manual com uma ocorrência é corrigido, enquanto o total fiscal ou de compras com várias ocorrências é preservado.
Testes automatizados passaram e o usuário confirmou que o problema foi resolvido após o teste solicitado.

**Local:** `src/repositories/productRepository.js:45-47`, `:200-220`; `src/domain/productValidation.js:62-70`;
`src/components/ProductInfoModal/index.js:37-52`.

A edição recebe o saldo atual como quantidade, mas o preço unitário deriva da quantidade originalmente comprada. Ao
normalizar uma edição em preço unitário, o código multiplica pelo saldo e grava o resultado como preço histórico do
item.

**Reprodução isolada:** comprar 3 unidades por R$30; consumir até saldo 1; salvar R$10 por unidade. A quantidade
comprada continua 3, o total do item vira R$10 e o preço unitário derivado vira R$3,33. A compra continua com total R$

30.

Há ainda falta de uma política consistente para edição de preço e total da compra: `updateProduct()` muda o item, mas
não trata o total do registro pai, inclusive numa compra manual de um único item. Para notas fiscais, atualizar
automaticamente o total fiscal também seria incorreto sem uma decisão explícita.

**Impacto:** histórico e estimativas deixam de refletir os valores corretos.

**Correção recomendada:** separar saldo de quantidade comprada; calcular preço histórico com a quantidade apropriada e
definir como correções de preço se relacionam ao total manual/fiscal.

### B08 — Correspondência automática vincula produtos comercialmente diferentes

**Encerramento em 01/11/2026:** o usuário confirmou no Android o vínculo de “Banana” com “BANANA NANICA kg” e encerrou a
correção após aprovação dos testes de reconciliação, checkout, extração, medidas e cache. Descrições ambíguas seguem
para decisão manual; a confirmação não cobre todas as descrições fiscais possíveis.

**Atualização de 01/11/2026:** a correspondência automática exige nomes equivalentes após normalização e na mesma ordem,
além das demais regras existentes. Nomes parciais e com termos adicionais exigem revisão manual. Testes automatizados
passaram; validação em aparelho pendente.

**Validação parcial em Android:** com NFC-e real, duas descrições com termos adicionais ficaram para vínculo manual; o
usuário escolheu os itens correspondentes e os vínculos foram conferidos na tela por ADB. Não foi testado o vínculo
automático de um nome equivalente nem finalizada a compra de teste.

**Local:** `src/domain/groceryCheckoutReconciliation.js:112-121`, `:197-213`.

Um único token longo pode receber pontuação 0,86; inclusão de todos os termos de um nome em outro recebe 0,94. Um
candidato único acima de 0,85 é automaticamente aceito.

**Reprodução isolada:** `Chocolate` é vinculado a `Chocolate Granulado`; `Leite Integral` a `Leite Integral em Pó`, sem
tamanho informado.

**Impacto:** uma linha pode receber identidade/categoria de um produto diferente como vínculo automático. A regra
documentada exige comparação conservadora e tratamento de ambiguidade.

**Correção recomendada:** penalizar diferenças de apresentação/termos discriminantes e exigir confirmação nesses casos;
pontuação lexical alta sozinha não comprova equivalência.

### B09 — Importação direta grava subtotal selecionado como total da compra

**Encerramento:** o usuário confirmou que considera o B09 resolvido.

**Atualização de 01/11/2026:** corrigido no simulador local. O total fiscal válido da nota é gravado na compra,
independentemente dos itens enviados ao estoque; total ausente ou inválido bloqueia a confirmação. Teste automatizado
passou; validação em aparelho pendente.

**Local:** `src/services/nfceImportService.js:76-82`.

O total persistido é a soma dos produtos selecionados para estoque, ignorando o total real da nota. No checkout de lista
existe tratamento distinto para preservar o total fiscal.

**Reprodução isolada:** nota de R$25; selecionar produtos de R$20 e ignorar uma linha de R$5. A compra é gravada com R$

20.

**Impacto:** ignorar sacolas ou outros itens do estoque altera indevidamente o gasto histórico.

**Correção recomendada:** persistir o total fiscal da compra separadamente do subtotal que entra na despensa.

### B17 — Resposta atrasada do Places pode salvar endereço/mercado errado

**Teste controlado Android:** atraso temporário de 25 segundos na primeira consulta de detalhes; a segunda seleção
permaneceu no campo após o prazo da primeira e, em rodada separada, o campo limpo continuou vazio. Formulário cancelado
e atraso removido após os testes.

**Teste Android:** consulta real por endereço, edição logo após seleção e nova seleção executadas via ADB; formulário
cancelado sem salvar. A ordem das respostas de rede não foi controlada no aparelho e foi testada em simulação.

**Atualização de 01/11/2026:** a seleção de detalhes invalida requisições anteriores e é invalidada ao editar, limpar,
desabilitar ou desmontar o campo. Teste isolado cobre respostas fora de ordem e invalidação; bundle Android gerado.
Falta validação física com Places.

**Local:** `src/components/PlaceSearchField/index.js:18-68`, `:73-76`.

A busca de sugestões possui controle de sequência, mas `choose()` não possui. Opções continuam selecionáveis durante a
consulta de detalhes e o campo continua editável.

**Cenário por inspeção:** selecionar A e depois B; B responde primeiro e A por último. O `onSelect` de A sobrescreve B.
Limpar/editar o campo durante a espera também pode ser desfeito pela resposta antiga.

**Impacto:** o formulário pode persistir um endereço ou mercado diferente da última escolha.

**Correção recomendada:** invalidar solicitações antigas ao selecionar, editar, limpar e desmontar; aceitar somente o
resultado da escolha vigente.

### B26 — Sincronização pendente recria notificações de uma conta após logout

**Encerramento:** o usuário confirmou no Android o teste solicitado de notificações e troca entre contas; a corrida com
sincronização pausada foi coberta em simulação.

**Atualização de 01/11/2026:** corrigido com invalidação por sessão e fila global para sincronização e limpeza do
aparelho. Teste simulado cobre sincronização pausada e troca de contas; validação física pendente.

**Local:** `src/services/notificationService.js:17`, `:243-324`; `src/navigation/RootNavigator.js:65-66`;
`src/screens/HomeScreen/index.js:86`.

Existe limpeza de notificações no logout. Porém, uma sincronização iniciada antes do logout continua executando e pode
agendar depois da limpeza. O lock é por conta, enquanto os agendamentos do dispositivo são compartilhados.

**Reprodução isolada:** pausar a leitura de despensas da conta A; executar a limpeza de logout; liberar a leitura. A
sincronização agenda novamente uma notificação contendo `accountId: account-a`.

**Impacto:** alertas da conta anterior podem reaparecer após sair; em troca rápida de conta, sincronizações também podem
interferir nos agendamentos da nova conta.

**Correção recomendada:** invalidar trabalhos de sessões anteriores e serializar reconciliação/limpeza do recurso global
de notificações.

## P2 — funcionamento e integridade do fluxo

### B04 — Edição de marca é descartada

**Atualização de 01/11/2026:** a correção anterior passou a persistir a marca na ocorrência. O usuário confirmou que a
marca era alterada no aparelho; a exibição no card agrupado foi tratada separadamente. O teste automatizado de salvar e
limpar a marca passou.

**Local:** `src/repositories/productRepository.js:209-214`.

O formulário e a normalização produzem a marca nova, mas o update não grava `brand`. **Reprodução isolada:** salvar
`Marca B`; recarregar retorna `Marca A`. Isso também afeta agrupamento e preferência de marcas.

**Recomendação:** persistir o campo e conferir sua repercussão nos grupos.

### B05 — Cadastro pode criar conta e retornar falha sem sessão

**Teste Android:** falha de sessão simulada após a criação de uma conta fictícia exibiu a mensagem correta e permitiu
retornar ao login; a entrada posterior nessa conta funcionou. A simulação temporária foi removida.

**Atualização de 01/11/2026:** o cadastro distingue conta criada de falha ao iniciar sessão, oferece retorno ao login e
confere se uma gravação que retornou erro foi efetivada. Teste simulado passou; caminho de falha ainda não validado no
aparelho.

**Local:** `src/services/authService.js:42-65`, especialmente `:62-64`; `src/repositories/accountRepository.js:23-35`.

A conta é persistida antes da sessão no SecureStore. **Reprodução isolada:** falhar a gravação da sessão; cadastro
rejeita, conta existe, repetição acusa `EMAIL_ALREADY_EXISTS`.

**Impacto:** usuário fica sem indicação de que o cadastro ocorreu e precisa descobrir que login pode recuperá-lo.

**Recomendação:** tratar explicitamente cadastro confirmado com falha de sessão e oferecer recuperação coerente.

### B06 — Produtos zerados ou vencidos não permitem editar campos independentes

**Teste Android:** um produto fictício zerado teve nome editado; após preparar uma validade vencida exclusivamente para
teste e remover o instrumento temporário, a marca foi editada mantendo saldo zero e a validade anterior.

**Atualização de 01/11/2026:** edição aceita saldo zero e validade vencida já existente, sem aceitar uma nova data
passada; cadastro mantém as regras originais. Testes automatizados passaram; validação no aparelho pendente.

**Local:** `src/domain/productValidation.js:44`, `:49-51`; `src/components/ProductInfoModal/index.js:37-52`, `:96-103`.

A edição reutiliza validação de criação: quantidade precisa ser positiva e validade precisa ser hoje/futura. Saldo zero
e validade passada são estados legítimos de ocorrências existentes.

**Cenários por inspeção:** zerar estoque e tentar alterar nome/categoria; deixar validade passar e tentar corrigir outro
campo. Salvar exige inventar saldo ou remover/alterar a validade real.

**Recomendação:** distinguir validação de criação e edição, preservando estados existentes válidos.

### B07 — Estimativa não converte unidades equivalentes

**Encerramento:** o usuário confirmou no Android a estimativa com compra e lista no mesmo mercado e considera o B07
resolvido.

**Atualização de 01/11/2026:** corrigida a comparação e conversão de g/kg e ml/L, preservando dimensões distintas e
priorizando apresentação equivalente. Testes automatizados passaram; validação no aparelho pendente.

**Local:** `src/services/groceryPriceEstimateService.js:68-71`, `:128-139`.

O cálculo exige igualdade do identificador da unidade. `g`/`kg` e `ml`/`L` caem no fallback sem a conversão física
necessária.

**Reprodução isolada:** histórico de café 500g por R$10; lista de café 1kg. Estimativa retorna R$10, em vez de R$20 para
a mesma referência de preço por massa.

**Recomendação:** normalizar massa e volume dentro da mesma dimensão antes de aplicar proporção; não converter dimensões
distintas.

### B10 — Conclusão da lista destrói a estimativa final

**Encerramento:** o usuário confirmou que considera o B10 resolvido após o teste.

**Atualização de 01/11/2026:** a estimativa é preservada na lista; o total efetivo permanece na compra. Para manter os
campos atuais do histórico, novas finalizações registram um vínculo auxiliar local atomicamente com a compra e a lista.
Não há novo detalhamento do histórico nem alteração no modelo hospedado. A correção posterior do B13 elimina a
associação por suposição para listas sem vínculo.

**Local:** `src/services/groceryCheckoutService.js:110-116`; `src/services/groceryListService.js:62-65`, `:84-91`.

O checkout substitui `grocery_lists.estimated_price` pelo valor efetivamente pago. SDD de integração, linha 36, e
decisões, linha 143, exigem preservar a estimativa de listas concluídas.

**Cenário por inspeção:** estimativa R$12, compra R$20; lista concluída fica com estimativa R$20. A previsão anterior se
perde.

**Recomendação:** preservar estimativa e total real em seus respectivos registros, com associação explícita entre lista
e compra.

### B11 — Preço unitário editado na revisão direta de NFC-e é ignorado

**Encerramento:** o usuário confirmou a correção após teste no Android.

**Correção local:** preço unitário e total são recalculados conforme o último campo editado, inclusive ao mudar a
quantidade; o total fiscal da compra é preservado. Testes automatizados passaram; validação física Android pendente.

**Local:** `src/components/PurchaseProductReviewCard/index.js:122-125`; `src/screens/NfceReviewScreen/index.js:68-96`;
`src/services/nfceImportService.js:76-82`.

Preço unitário e total são editáveis independentemente; o caminho de persistência privilegia o total e posteriormente
deriva o unitário.

**Cenário conferido no serviço:** quantidade 2, total R$20; editar unitário para R$5 mantendo total. Ao recarregar, o
unitário volta a R$10.

**Recomendação:** sincronizar os valores ou bloquear inconsistências com mensagem clara antes de salvar.

### B12 — Item fiscal ambíguo pode ser salvo sem revisão explícita

**Encerramento:** o usuário considera o B12 resolvido após os testes automatizados.

**Correção local:** descrições ambíguas exigem confirmação explícita quando incluídas na importação direta ou vinculadas
à lista. A importação direta também valida essa confirmação no serviço; itens ignorados não exigem revisão. Testes
automatizados passaram; validação física Android pendente.

**Local:** `src/screens/NfceReviewScreen/index.js:29-36`, `:48-89`, `:118`, `:159`;
`src/components/PurchaseProductReviewCard/index.js:117-145`.

O fluxo direto identifica `requiresReview`, mas não o usa para impedir confirmação. O aviso depende de expandir o card.

**Cenário por inspeção:** apresentação ambígua como `PACK 6 X 350ML` permanece selecionada e pode ser importada sem
abrir/corrigir o card.

**Recomendação:** exigir resolução das ambiguidades antes da confirmação, conforme o contrato fiscal.

### B13 — Histórico associa lista à compra errada

**Encerramento:** o usuário informou que não observou problemas no teste do fluxo local.

**Correção local:** o histórico usa exclusivamente o vínculo persistido pelo checkout, verificando a despensa e
rejeitando referências duplicadas. Sem vínculo, exibe data desconhecida e valor não registrado. Testes automatizados
passaram; validação física Android pendente. O contrato hospedado continua a confirmar.

**Local:** `src/services/groceryListService.js:40-49`.

A associação utiliza a primeira compra ainda não utilizada com mesmo título, despensa, mercado e total, sem uma relação
persistida entre lista e compra.

**Reprodução isolada:** criar A e B com mesma assinatura; concluir B em 09/10 e A em 10/10. O histórico atribui 09/10 a
A e 10/10 a B. Outra compra com mesma assinatura também pode ser escolhida.

**Recomendação:** persistir o vínculo de conclusão e usar esse identificador no histórico.

### B14 — Fechar scanner não cancela o resultado pendente

**Encerramento:** o usuário testou e considera o B14 resolvido.

**Correção local:** fechar o scanner invalida a leitura e a preparação assíncrona da revisão, inclusive ao reabrir;
respostas ou erros antigos são ignorados. Testes simulam as corridas; validação física no Android pendente. A consulta
HTTP já iniciada pode terminar em segundo plano, sem abrir a revisão.

**Local:** `src/components/NfceScannerModal/index.js:17-26`.

Depois da leitura, a consulta aguarda e chama `onPurchaseLoaded` incondicionalmente. Fechar o modal não invalida a
solicitação.

**Cenário por inspeção:** ler QR, fechar enquanto consulta carrega; resposta abre revisão após cancelamento. Reabrir
pode permitir que o resultado antigo substitua o novo.

**Recomendação:** invalidar a leitura ao fechar/desmontar e aceitar somente a sessão atual do scanner.

### B16 — Validações da lista desaparecem em inglês/espanhol

**Encerramento:** o usuário testou e considera o B16 resolvido.

**Correção local:** o formulário usa identificadores para associar as validações aos campos e traduz as mensagens na
apresentação, sem depender de palavras em português. Validação física Android pendente.

**Local:** `src/components/GroceryListModal/index.js:136-140`, `:204`, `:214`, `:228`, `:333`.

O código traduz o erro e depois identifica o campo procurando palavras em português: `nome`, `data`, `mercado`. A
mensagem geral fica oculta no formulário de lista.

**Cenário por inspeção:** escolher inglês ou espanhol e enviar nome vazio, data inválida ou mercado não selecionado. O
envio é impedido sem a explicação correspondente.

**Recomendação:** armazenar códigos/erros por campo; texto traduzido não deve controlar lógica de validação.

### B18 — Falha de fontes deixa o aplicativo em carregamento infinito

**Correção local:** erro no carregamento permite iniciar o aplicativo com as fontes do sistema. A preferência de tamanho
continua aplicada; a aparência tipográfica pode mudar nesse estado. Falha física no Android ainda não simulada.

**Local:** `src/App.js:51`, `:60`.

`useFonts` disponibiliza carregamento e erro, mas o app lê apenas o carregamento. Uma falha de fonte mantém o spinner e
bloqueia autenticação e telas.

**Evidência:** inspeção do tratamento de erro e contrato do hook do SDK instalado. Não foi provocada falha de fontes em
aparelho.

**Recomendação:** tratar o erro, permitir fallback ou apresentar recuperação.

### B20 — Modal de notificação reabre após o usuário fechá-lo

**Atualização local:** o usuário confirmou que o B20 está resolvido no Android. A proteção impede reabrir ou substituir
o
modal após fechamento. A mesma notificação reaberta durante a gravação reflete a inclusão concluída, sem permitir uma
nova inclusão por estado antigo. Teste automatizado cobre fechamento, abertura de outra notificação e reabertura da
mesma.

**Local:** `src/screens/NotificationsScreen/index.js:278-323`.

Adicionar à lista aguarda persistência e depois redefine `selectedNotification`. Os controles de fechar/adiar continuam
disponíveis durante a espera.

**Cenário por inspeção:** iniciar adição, fechar modal antes da resposta; conclusão seleciona novamente a notificação e
reabre o modal.

**Recomendação:** separar atualização dos dados da seleção visual e invalidar continuações quando a interação termina.

### B21 — Aberturas concorrentes de notificações misturam listas de despensas

**Atualização local — 1º de novembro de 2026:** a implementação já invalida consultas de uma seleção anterior por
versão da seleção. Um teste de regressão agora abre notificações de duas despensas e cobre respostas bem-sucedidas fora
de ordem, falha atrasada, preservação do indicador de carregamento e inclusão vinculada apenas à despensa/lista atuais.
O teste passou. Falta validar fisicamente a corrida no Android; iOS não testado.

**Local:** `src/screens/NotificationsScreen/index.js:150-179`, `:281-293`.

A consulta de listas não confere qual notificação continua selecionada. A resposta antiga pode sobrescrever as opções da
nova seleção.

**Cenário por inspeção:** abrir A, depois B de outra despensa; A responde por último. B passa a mostrar listas de A, e a
tentativa de adição pode falhar na validação de despensa.

**Recomendação:** vincular resultados à seleção vigente e invalidar requisições anteriores.

### B22 — Pergunta de agrupamento sobrevive à tela da despensa

**Atualização local — 1º de novembro de 2026:** o usuário considera o B22 resolvido; relatou que a validação física é
muito difícil porque o timer é muito rápido. O fluxo vincula a pergunta à sessão de foco da despensa, cancela timers de
criação/edição no blur e interrompe filas e callbacks antigos antes de abrir alertas ou gravar preferências. Falhas
disparadas por timers são tratadas e não exibem alertas após sair. Testes dirigidos e bundle Android passaram; iOS não
testado.

**Local atual:** `src/screens/PantryScreen/index.js:108-227`, `:229-268`, `:335-393`.

Verificações assíncronas e timers de pós-criação/edição não são cancelados ao sair. Podem abrir alerta nativo não
cancelável sobre outra tela. A chamada iniciada no timer também pode rejeitar sem tratamento.

**Impacto:** interrupção de outro fluxo e gravação de preferência de uma despensa que já não está sendo visualizada.

**Recomendação:** condicionar alertas ao foco/vida da tela, limpar timers e tratar rejeições.

### B27 — Permissão concedida nas configurações do sistema não agenda imediatamente

**Atualização local — 1º de novembro de 2026:** ao retornar com a permissão alterada de negada para concedida,
Configurações atualiza o controle e inicia a sincronização dos avisos sem salvar idioma ou fonte. Leituras fora de ordem
são invalidadas; mudanças repetidas para concedido não duplicam a sincronização. Testes automatizados e bundle Android
passaram. O usuário confirmou que o teste físico Android ocorreu normalmente; iOS não testado.

**Local atual:** `src/screens/SettingsScreen/index.js:47-102`.

Ao voltar do sistema, a tela atualiza somente o estado da permissão. A reconciliação está ligada ao salvamento de
preferências, que não fica disponível apenas pela mudança da permissão.

**Cenário por inspeção:** alertas existentes sem permissão; conceder no sistema e voltar a Settings. O controle indica
permissão ativa, mas agendamentos aguardam outro fluxo que execute sincronização, como retornar à Home.

**Recomendação:** reconciliar quando a permissão efetivamente muda para autorizada.

### B28 — Falha de leitura pode apagar histórico de notificações na próxima escrita

**Atualização local — 1º de novembro de 2026:** leitura ausente é tratada como estado novo; falha de AsyncStorage, JSON
inválido ou formato inválido interrompe a operação, impedindo que a próxima escrita substitua o histórico por vazio.
Regressão cobre falha de leitura e JSON inválido. Os 29 scripts automatizados `.cjs` passaram; nenhum teste via ADB foi
executado. Validação física não realizada.

**Local atual:** `src/services/notificationService.js`.

**Comportamento encontrado na auditoria:** `readMetadata()` transformava qualquer erro de leitura/JSON em metadados
vazios; `updateMetadata()` usava esse resultado como base e o gravava. A atualização local acima removeu esse fallback
destrutivo.

**Cenário por inspeção:** já existem IDs lidos, dispensados e tratados; a leitura falha temporariamente, mas a escrita
seguinte funciona. O conjunto anterior é substituído por uma base vazia acrescida da alteração atual.

**Impacto:** alertas tratados/dispensados podem reaparecer e perder seu estado.

**Resolução:** distinguir ausência de dados de falha de leitura e impedir atualização destrutiva quando não foi possível
recuperar o estado anterior.

### B31 — Linhas fiscais repetidas são agrupadas antes do vínculo e da persistência

**Local:** `src/services/nfceImportService.js:33-37`; `src/domain/fiscalItems.js:11-33`.

Linhas com mesma descrição/unidade viram um grupo com quantidade somada. O grupo recebe um vínculo único e produz uma
ocorrência única.

**Reprodução isolada:** duas linhas de leite 1L, uma unidade cada, tornam-se um item de quantidade 2 com dois
`sourceItems`, mas uma única decisão de vínculo/ocorrência.

**Reclassificação — 6 de novembro de 2026:** o usuário esclareceu que linhas com os mesmos dados do produto foram
lançadas separadamente pelo caixa e devem representar um produto com várias unidades. Nesse cenário, somar quantidade
e preço, fazer um vínculo e criar uma ocorrência é o comportamento esperado. A revisão exibe o agrupamento com aviso e
preserva os valores originais em `sourceItems`. Descrições ou unidades diferentes continuam sendo itens distintos.

**Status:** não é defeito no fluxo definido pelo usuário; decisão registrada em `docs/project/decisions.md`.

**Atualização local — 6 de novembro de 2026:** mantido o agrupamento das linhas idênticas. O texto do aviso esclarece
que as quantidades são somadas em um produto. O teste de regressão e os 30 scripts automatizados `.cjs` passaram;
bundle Android exportado. Nenhum teste via ADB foi executado.

**Local atual:** `src/domain/fiscalItems.js`, `src/services/nfceImportService.js` e
`src/components/PurchaseProductReviewCard/index.js`.

## P3 — apresentação, mensagens e navegação

### B15 — Scanner permite consultas duplicadas antes do próximo render

**Correção local:** a trava síncrona implementada no B14 impede uma segunda leitura durante a consulta e a preparação
da revisão. Teste do componente simula eventos antes do próximo render e confirma uma única consulta e entrega; testes
de cancelamento e cache também passaram. Validação física específica pendente.

**Local:** `src/components/NfceScannerModal/index.js:18-21`.

O bloqueio usa estado React. Dois eventos nativos antes do render podem ambos observar `processing === false` e iniciar
consultas. A proteção transacional de QR no repositório reduz o risco de duplicação persistida, mas não evita
chamadas/callbacks duplicados.

**Evidência:** inspeção. **Recomendação:** trava síncrona por referência mais identificação da sessão de leitura.

### B19 — Checkout mostra mensagens técnicas sem tratamento consistente

**Correção local:** erros esperados do checkout têm códigos estáveis e mensagens nos três idiomas; erros inesperados
usam fallback traduzido. Testes cobrem cenários reais do serviço, tradução e fallback; 32 scripts e bundle Android
passaram. Validação física no Android pendente.

**Local:** `src/screens/GroceryListScreen/index.js:441-443`, `:714`.

Somente `DUPLICATE_FISCAL_NOTE` é traduzido/mapeado; outros erros usam `cause.message`. Códigos internos, mensagens do
armazenamento ou português podem aparecer diretamente em outra língua.

**Evidência:** inspeção. **Recomendação:** mapear erros esperados e usar fallback contextual traduzido para erros
inesperados.

### B23 — Despensa marca Perfil como destino ativo

**Encerramento:** o usuário validou no Android e informou que está funcionando.

**Correção local:** a tela informa a aba Despensa como ativa; validação física no Android pendente.

**Local:** `src/screens/PantryScreen/index.js:403`.

A tela usa `Navbar activeItem="profile"`; o destino visual e acessível selecionado não corresponde à despensa.
`PantriesScreen` utiliza `pantry`.

**Evidência:** inspeção. **Recomendação:** corrigir a propriedade na tela; não exige alterar o componente Navbar da área
humana.

### B24 — Home/Despensas mostram estado vazio antes de carregar

**Correção local:** as telas exibem indicador de carregamento e aguardam uma resposta vazia antes de informar ausência
de despensas. Testes cobrem as duas telas, falha e nova tentativa; bundle Android passou. Validação física pendente.

**Local:** `src/screens/HomeScreen/index.js:60`, `:66-84`, `:251-253`; `src/screens/PantriesScreen/index.js:41-70`,
`:160-163`.

Arrays começam vazios e a mensagem de ausência de despensas aparece antes de terminar a leitura. Conta com dados recebe
uma mensagem temporariamente falsa.

**Evidência:** inspeção. **Recomendação:** distinguir carregamento inicial e vazio confirmado.

### B25 — Atalhos de notificações anunciam destinos implementados como futuros

**Encerramento:** o usuário validou no Android e considera o B25 resolvido.

**Correção local:** atalhos abrem suas áreas na Home e Perfil na barra abre a área de perfil. Testes automatizados e
bundle Android passaram; validação física pendente.

**Local:** `src/screens/NotificationsScreen/index.js:135-140`.

Na tela independente de notificações, ações rápidas de Perfil/Configurações ainda abrem aviso de disponibilidade futura,
embora os destinos existam. O handler de Navbar dessa tela também encaminha Perfil à Home.

**Evidência:** inspeção. **Recomendação:** alinhar os handlers às rotas atuais.

### B29 — Contador da despensa não corresponde aos cards exibidos

**Atualização de 01/11/2026:** corrigido na listagem da Home e Despensas: o contador usa os cards agrupados de acordo
com a preferência de marcas, incluindo produtos zerados visíveis. Teste automatizado passou; validação no aparelho
pendente.

**Local:** `src/repositories/pantryRepository.js:9-11`; `src/repositories/productRepository.js:66-103`, `:127-137`.

Home conta ocorrências com saldo; a tela agrupa apresentações equivalentes e também exibe ocorrências zeradas não
excluídas. Duas compras podem significar “2 produtos” em Home e um card na despensa; produto zerado visível pode
coexistir com contador zero.

**Evidência:** inspeção. **Recomendação:** definir o significado do contador e alinhar cálculo e rótulo à apresentação.

### B30 — Etapas já resolvidas permanecem no checkout

**Local:** `src/components/GroceryCheckoutReview/index.js:96-101`, `:437-448`.

Etapas de vínculos automáticos/manuais permanecem enquanto há vínculos, inclusive já resolvidos. Contagem de etapas e
navegação de retorno continuam incluindo esses cards. As decisões atuais pedem etapas apenas enquanto há pendências.

**Evidência:** inspeção. **Recomendação:** construir etapas a partir de pendências, preservando revisão dos resultados
por um mecanismo explícito.

### B32 — Saldo zero de marca separada não gera notificação

**Atualização local — 1º de novembro de 2026:** corrigido o agrupamento para manter cada marca explicitamente separada
como grupo independente mesmo quando o saldo dela chega a zero. O aviso da tela e o aviso do aparelho passam a
identificar a marca. Compras da mesma marca continuam agregadas; no modo agrupado, o estoque de todas as marcas é
somado e o aviso só aparece quando o total chega a zero. Testes de integração de estoque/notificação e bundle Android
passaram. Validação física pendente no Android; iOS não testado.

**Local atual:** `src/repositories/productRepository.js` e `src/services/notificationService.js`.

**Cenário relatado:** duas marcas da mesma apresentação estão separadas; zerar Marca A enquanto Marca B ainda tem saldo
remove A sem criar um aviso próprio.

### B33 — Notificações fora da ordem de recência

**Atualização local — 1º de novembro de 2026:** a tela ordena os avisos do mais recente para o mais antigo, de cima
para baixo. O instante de ativação é persistido localmente; alertas de validade usam a data de vencimento. Validação
automatizada e física pendentes.

**Local atual:** `src/services/notificationService.js`.

### B34 — Grupo zerado volta para a marca errada ao aumentar o saldo

**Atualização local — 1º de novembro de 2026:** desempate por ordem de inserção foi adicionado quando compras têm a
mesma data. A ocorrência mais recente é usada tanto no card agrupado sem saldo quanto ao aumentar o saldo agregado.
Validação automatizada e física pendentes.

**Local atual:** `src/repositories/productRepository.js`.

## Ambiguidade que requer decisão funcional

### A01 — Checkout manual sem itens fecha lista sem criar compra

**Decisão de 01/11/2026:** comportamento confirmado pelo usuário: concluir somente a lista, sem criar compra ou estoque,
com aviso antes da confirmação. A NFC-e permanece registrada mesmo sem produtos selecionados.

**Local:** `src/services/groceryCheckoutService.js:94-99`.

**Reprodução isolada:** desmarcar todos os itens no modo manual e concluir. A lista fica finalizada, mas o número de
compras não aumenta. Data/mercado desse checkout não ficam em uma nova compra.

As fontes mantidas no repositório garantem registro de compra vazia explicitamente para NFC-e
(`docs/project/current-state.md:198`). Não há garantia inequívoca equivalente para modo manual. Portanto este
comportamento **não foi incluído nos 31 bugs**.

É necessário definir se “nenhum item comprado manualmente” deve apenas finalizar a lista ou também gerar compra vazia.
Não atribuir uma exigência ao usuário sem que ela esteja registrada.

## Scripts de teste existentes

| Script                       | Resultado observado                   | Motivo da primeira falha                                                                       |
|------------------------------|---------------------------------------|------------------------------------------------------------------------------------------------|
| `tests/package-measure.cjs`  | Passou                                | Asserções executadas concluíram                                                                |
| `tests/product-addition.cjs` | Falhou                                | Expectativa não inclui `brand: null`, retornado pelo contrato atual                            |
| `tests/nfce-extraction.cjs`  | Falhou                                | Expectativa não inclui `sourceUnitLabel: 'kg'`, retornado pelo contrato atual                  |
| `tests/grocery-list.cjs`     | Falhou antes da verificação funcional | Transformação/eval deixa `require` indisponível para `expo-crypto`                             |
| `tests/grocery-checkout.cjs` | Falhou antes das asserções            | Mock de AsyncStorage não implementa `removeItem`, chamado pela inicialização de fixture antiga |

Essas quatro falhas não equivalem a quatro bugs no aplicativo. Contudo, a suíte atual não fornece cobertura confiável
desses fluxos e precisa ser atualizada antes de servir como critério de regressão. As asserções posteriores à primeira
falha não foram consideradas executadas.

## Risco técnico separado

O simulador de autenticação usa rotina própria de SHA-256 com 4.096 rodadas e hashes no armazenamento local. Se os dados
do app forem extraídos, a resistência a tentativa offline merece revisão. Isso foi tratado como questão de
endurecimento/arquitetura, sem contá-lo como defeito funcional confirmado nem como comprovação de comprometimento.
Backend/autenticação remota futura precisam de avaliação própria.

## Ordem sugerida de correção

1. Proteger o banco contra sobrescrita e esclarecer confirmação de gravações: B01/B02.
2. Separar saldo, quantidade comprada, preço histórico, total fiscal e estimativa: B03/B09/B10/B11.
3. Tornar vínculos conservadores e preservar linhas originais: B08/B12; criar associação lista–compra: B13.
4. Corrigir invalidação de requisições e sessão: B17/B26, depois B14/B20/B21/B22/B28.
5. Recuperação de cadastro/fontes e edição de estados existentes: B05/B06/B18; persistência da marca e unidades:
   B04/B07.
6. Validação por idioma, permissão e demais ajustes de interface: B16/B27 e P3.
7. Atualizar a infraestrutura de testes e cobrir os cenários acima; validar câmera, notificações, permissões e ciclo de
   vida em Android/iOS reais.

## Áreas sem outro defeito confirmado nesta revisão

Os caminhos normais de isolamento por conta/despensa, redução FIFO e aumento na ocorrência mais recente, exclusão em
cascata de despensa, proteção de QR repetido dentro da despensa, normalização de e-mail/data, agrupamento de
apresentação por massa/volume e deduplicação/validação de coordenadas de mercados foram revisados sem novo defeito
confirmado. Isso não elimina os problemas específicos de concorrência, edição e integração descritos acima.
