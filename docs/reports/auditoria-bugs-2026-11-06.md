# Auditoria consolidada de bugs em aberto — 6 de novembro de 2026

Consolidação das auditorias de 11/10, 18/10 e 06/11, considerando as correções locais e as validações registradas até
esta data. Contém **11 problemas em aberto**: B35–B44 e C03. C01 é o mesmo problema do B36; C06 é o mesmo cenário do
B38, cuja representação funcional ainda precisa ser definida. Os IDs históricos foram preservados para evitar
duplicação.

Os cenários reproduzidos usam mocks ou o armazenamento isolado do harness, sem modificar dados do usuário. Na auditoria
de 06/11 não houve teste no aparelho nem uso de ADB. Todos os 36 scripts automatizados existentes passaram; isso não
cobre necessariamente as situações abaixo.

**Ordem sugerida:** B35 e B36; B37; B38 e B39; B40 e B41; C03; B42; B43; B44. A sequência pode ser alterada pelo
usuário.

## P1 — integridade dos dados

### B35 — Inicializações concorrentes podem sobrescrever dados recém-gravados

**Local:** `src/storage/localDatabase.js:141-148`, `:167`, `:181-191`.

Leituras simultâneas que encontram banco ausente (ou uma versão antiga) podem iniciar gravações de banco vazio fora da
fila de atualizações. Em armazenamento simulado, duas inicializações começaram juntas; após a primeira terminar e uma
conta ser gravada, a segunda foi liberada e sobrescreveu o banco, removendo a conta. A corrida exige temporização
específica durante a inicialização; não foi observada no aparelho. A fila deve serializar a inicialização e reler o
estado antes de criar ou substituir dados.

### B36 — Falha na recarga após gravação pode informar falha e induzir duplicação

**Local:** `src/screens/PantryScreen/index.js:334-338`, `src/screens/GroceryListScreen/index.js:219-224`, `:527-545`.

A gravação e a atualização da tela compartilham o mesmo tratamento de erro. Se a compra já foi salva e a recarga falha,
o checkout continua aberto e oferece uma mensagem para tentar novamente. Esse cenário foi reproduzido com a função da
tela e falha simulada após o commit. Pela mesma estrutura, a criação de produto ou lista pode ser apresentada como
falha após ter sido salva, e uma repetição pode duplicá-la; esses caminhos adicionais foram constatados por inspeção.
Separar o resultado da gravação do resultado da recarga e informar claramente quando a gravação já ocorreu.
Este achado também cobre C01 da auditoria complementar de 18/10; não é um problema independente de C01.

## P2 — funcionamento dos fluxos

### B37 — Toques simultâneos podem duplicar operações

**Local:** `src/screens/NotificationsScreen/index.js:271-277`, `src/components/CreatePantryModal/index.js:134-156`.

O bloqueio depende de estado React atualizado após o próximo render. Dois eventos do mesmo botão antes desse render
podem iniciar duas inclusões de produto pela notificação ou duas criações de despensa. Ambos os casos foram
reproduzidos em componentes reais com gravações suspensas e hooks simulados. Revisar também ações semelhantes de criação
de lista e itens. Uma trava síncrona deve impedir uma segunda submissão enquanto a primeira estiver pendente.

### B38 — Venda por peso com quantidade inteira perde a medida

**Local:** `src/services/nfceImportService.js:115-131`, `src/screens/GroceryListScreen/index.js:399-411`.

O tratamento de unidade fiscal `kg`, `g`, `L` ou `ml` depende da quantidade ser fracionária. Em importação direta
simulada, `BANANA`, quantidade fiscal `2`, unidade `kg`, gerou quantidade 2 sem medida, em vez de preservar que a venda
foi de 2 kg. O checkout pela lista contém a mesma condição, constatada por inspeção. Definir a conversão pela unidade de
venda e testar valores inteiros e fracionários nos dois fluxos, respeitando a representação de estoque acordada. Este é
o
cenário C06 da auditoria de 18/10: a perda da medida foi reproduzida, mas a representação final para venda inteira por
peso ainda requer confirmação funcional.

### B39 — Medidas equivalentes podem gerar cards separados por precisão decimal

**Local:** `src/domain/pantryProductGrouping.js:7-16`, `src/repositories/productRepository.js:17-25`.

As chaves usam multiplicação decimal sem normalização. No harness, duas ocorrências de arroz com `1,001 kg` e `1001 g`
resultaram em dois cards, embora representem a mesma medida: `1.001 * 1000` não resulta exatamente em `1001` no formato
numérico usado. Uma representação decimal normalizada deve ser compartilhada pelas chaves e operações de saldo.

### B40 — Gravações concorrentes perdem escolhas de agrupamento de marcas

**Local:** `src/services/pantryProductViewPreferenceService.js:31-55`.

Duas atualizações para a mesma despensa leem a preferência, modificam e gravam sem serialização. No harness, salvar
simultaneamente escolhas de café e leite preservou apenas uma delas. As compras permanecem intactas, mas a apresentação
das marcas e os avisos podem mudar. Serializar as atualizações por conta e despensa.

### B41 — Falha de leitura pode apagar preferências de marcas

**Local:** `src/services/pantryProductViewPreferenceService.js:13-27`, `:36-44`.

Uma falha de leitura ou JSON inválido é tratado como preferência vazia; uma gravação posterior sobrescreve o registro
anterior. O cenário de JSON inválido foi reproduzido no harness. A perda após falha transitória decorre do mesmo
tratamento. Diferenciar ausência de dados de erro e não sobrescrever o registro quando a leitura falhar.

### B42 — Estimativa pode ignorar compras mais recentes feitas no mesmo dia

**Local:** `src/services/groceryPriceEstimateService.js:104-108`.

O ordenamento considera somente a data, sem desempate por ordem de registro. Com quatro compras no mesmo dia por
R$ 10, R$ 20, R$ 30 e R$ 100, o harness retornou estimativa R$ 20 usando as três primeiras, em vez de R$ 30 pelas três
mais recentes. A regra atual prevê mediana das três últimas. Usar um desempate consistente com a ordem de inserção.

### B43 — Resposta antiga de notificação pode navegar após troca de conta

**Local:** `src/navigation/RootNavigator.js:65-89`.

A consulta assíncrona da última resposta do Android não é invalidada na limpeza do efeito. Em teste controlado com o
componente real, iniciei a consulta na conta A, desmontei o efeito, iniciei a conta B e liberei a resposta de A: a tela
de notificações foi aberta com o identificador antigo. A tela consulta a conta B; o teste não demonstrou exposição de
dados da conta A. Invalidar a resposta pela sessão antes de navegar.

### B44 — Uma leitura atrasada pode ocultar despensa recém-criada

**Local:** `src/screens/HomeScreen/index.js:82-85`, `:178`; `src/screens/PantriesScreen/index.js:60-63`, `:87`.

As telas permitem criar uma despensa enquanto a leitura inicial está pendente. Em testes controlados das duas telas, a
criação apareceu e uma leitura anterior retornando vazia substituiu o estado, fazendo a despensa desaparecer da tela
até a próxima recarga. A despensa permanece salva. Invalidar leituras anteriores à alteração ou reconciliar os
resultados.

### C03 — Falha temporária ao restaurar sessão leva ao login

**Origem:** auditoria complementar de 18/10/2026. **Local:** `src/contexts/AuthContext.js:15-24`,
`src/services/authService.js:92-104`.

Se a leitura da sessão ou da conta falhar, o contexto trata a falha como ausência de conta e abre o login, mesmo que a
sessão continue salva. O dado não é apagado por esse caminho. O fluxo continua presente por inspeção, sem reprodução
física. Diferenciar sessão inexistente de falha de leitura e oferecer recuperação ou nova tentativa.

## Decisão funcional a esclarecer

### R01 — Produtos com “sacola” no nome são descartados

**Local:** `src/domain/fiscalItems.js:7-14`.

O filtro também descarta descrições como `SACOLA PARA LIXO` e `SACOLA ECOLOGICA REUTILIZAVEL` antes da revisão.
O comportamento foi reproduzido, mas a decisão registrada manda descartar linhas com “sacola” para excluir a taxa da
sacola plástica. Confirmar se o usuário quer continuar descartando todas ou apenas as taxas; não classificado como bug
até a regra ser esclarecida.

### C05 — Importação direta de NFC-e sem produtos selecionados

**Origem:** auditoria complementar de 18/10/2026. **Local:** `src/screens/NfceReviewScreen/index.js:89`, `:272`,
`src/services/nfceImportService.js:104-105`.

O fluxo direto não permite registrar uma nota se nenhum produto estiver selecionado. A regra existente de registrar a
nota mesmo sem estoque foi definida para a conclusão de lista; falta confirmar se também se aplica à importação direta.
Manter como decisão funcional, sem contar como bug confirmado.

## Código sem impacto confirmado no fluxo atual

### C04 — Atalho de configurações da versão independente do Perfil

O handler em `src/screens/ProfileScreen/index.js:183-186` ainda apresenta Configurações como futura. Não foi encontrada
rota ativa para a versão independente dessa tela: o Perfil atual é incorporado na Home, com atalhos próprios. O código
merece limpeza ou correção se a tela independente voltar a ser usada, mas não foi confirmado como bug do fluxo atual e
não está incluído na contagem de problemas em aberto.

## Itens anteriores já tratados

- B01–B34 da auditoria de 11/10 têm correção local registrada ou foram reclassificados; B31 foi mantido por decisão do
  usuário. Alguns ainda têm validação física pendente, o que não os torna automaticamente bugs abertos. B33 e B34
  constam como corrigidos, mas seus registros ainda apontam validação automatizada e física pendente.
- C02 da auditoria de 18/10 foi tratado junto ao B26, com controle da sessão e fila global das notificações.
- C01 está incluído no B36 e C06 no B38; não somar esses IDs novamente.
- A01 já foi decidido: lista sem itens não pode ser finalizada; lista com itens, mas nenhum selecionado, pode ser
  concluída manualmente sem criar uma compra, após aviso. O fluxo por NFC-e registra a nota mesmo sem itens no estoque.

## Limites

Os testes acima usam cenários sintéticos, inclusive atrasos e falhas forçados. Não comprovam frequência em produção ou
comportamento físico Android/iOS. A integração hospedada permanece fora da comprovação, pois o contrato efetivo não foi
fornecido. A auditoria é uma revisão pontual, não uma garantia de ausência de outros defeitos.
