# Auditoria complementar de bugs — FaltaOquê Mobile

Data: 18/10/2026. Revisão complementar à `auditoria-bugs-2026-10-11.md`. Commit de código revisado: `10611ca7d89f56e2e774eaaa248ccaf959fdd7d8`.

## Escopo e limites

Esta segunda passada revisou estaticamente fluxos de interface e navegação, autenticação e sessão, notificações, listas de compras, importação fiscal, checkout, estoque e preferências. O código do aplicativo não mudou desde o commit usado pela auditoria anterior; a diferença até o commit atual era a inclusão do relatório anterior.

Nenhum código foi alterado e nenhum teste ou validação em aparelho foi executado. Os cenários abaixo descrevem comportamentos inferidos diretamente dos caminhos atuais do código; falhas dependentes de latência ou indisponibilidade não foram reproduzidas em runtime. O relatório complementar não substitui nem recalcula a contagem da auditoria anterior.

## Achados adicionais

### C01 — P2 — Falha ao atualizar a tela pode reportar erro depois de incluir um item na lista

**Local:** `src/screens/GroceryListScreen/index.js:183-197`; inclusão manual ligada em `:695`.

`perform()` executa a mutação e, em seguida, `refresh()` dentro do mesmo `try`. Se `addGroceryItem()` concluir a gravação e uma leitura de `refresh()` falhar, o fluxo cai no `catch`: o modal não fecha, aparece um alerta de falha e o usuário pode confirmar novamente. A nova tentativa cria outra ocorrência do item.

**Impacto:** a interface pode aparentar que o produto não foi adicionado, embora ele já esteja persistido; repetir a ação pode duplicá-lo. Este cenário pode explicar o relato de inclusão manual que falhou, mas não há evidência do incidente específico do colega.

**Relação com o relatório anterior:** é relacionado ao B02 pelo efeito visível (erro após gravação), porém tem um gatilho distinto. O B02 descreve falha na segunda escrita da persistência; C01 descreve falha na leitura de atualização da interface depois que a operação já terminou.

**Confiança:** alta para a possibilidade do fluxo; não reproduzido em runtime.

### C02 — P2 — Limpeza de notificações do logout pode apagar notificações agendadas pela conta seguinte

**Local:** `src/navigation/RootNavigator.js:63-67`.

Quando a autenticação termina, o efeito dispara `cancelAllScheduledNotificationsAsync()` e `dismissAllNotificationsAsync()` sem aguardar nem invalidar essas chamadas. Se outra conta entrar e sincronizar seus avisos antes de a limpeza antiga terminar, a limpeza global pode remover notificações da sessão nova.

**Impacto:** a conta seguinte pode ficar sem notificações até uma sincronização posterior.

**Relação com o relatório anterior:** complementar ao B26, que descreve sincronizações antigas recriando notificações após logout. C02 descreve a corrida inversa: a limpeza antiga remove notificações novas.

**Confiança:** alta na análise estática; depende da ordem de conclusão das chamadas nativas.

### C03 — P2 — Erro transitório ao restaurar a sessão pode levar à tela de login sem encerrar a sessão salva

**Local:** `src/contexts/AuthContext.js:10-22`; `src/services/authService.js:99-111`.

`restoreSession()` lê o ID no SecureStore e consulta a conta no banco local. `AuthContext` trata qualquer rejeição dessa sequência como conta nula e encerra o carregamento. Uma falha transitória de leitura pode, portanto, direcionar ao login mesmo com um ID de sessão válido ainda salvo no SecureStore. Não há recuperação automática nessa inicialização.

**Impacto:** o usuário pode ver um logout inesperado e precisar entrar novamente; os dados e o identificador salvo não são apagados por esse caminho.

**Confiança:** média-alta; a propagação do erro está confirmada, mas a frequência depende da falha de armazenamento.

### C04 — P3 — Atalho de Configurações no Perfil apresenta o destino implementado como “em breve”

**Local:** `src/screens/ProfileScreen/index.js:183-186`.

A ação rápida `settings` mostra o alerta de disponibilidade futura, em vez de abrir Configurações, embora o recurso esteja implementado.

**Impacto:** o atalho do Perfil não leva a uma área existente.

**Relação com o relatório anterior:** semelhante ao B25, que identifica atalhos desatualizados na tela de Notificações; C04 aponta um handler adicional no Perfil.

**Confiança:** alta por inspeção estática.

## Pontos candidatos, não contados como bugs confirmados

### C05 — NFC-e direta sem produtos selecionados não pode ser registrada

**Local:** `src/screens/NfceReviewScreen/index.js:48-60, 154-159`; `src/services/nfceImportService.js:56-57`.

A tela desativa Salvar quando nenhum item está selecionado, e o serviço rejeita a operação com `NO_FISCAL_ITEMS`. Isso impede registrar a nota e seu identificador quando a importação direta à despensa não adiciona produtos. O estado atual documenta explicitamente o registro vazio no contexto de finalização de lista, mas não define com clareza o equivalente para importação direta. Confirmar a regra antes de classificar como bug.

### C06 — Unidade fiscal inteira pode não chegar à apresentação do estoque

**Local:** `src/services/nfceImportService.js:64-78`.

A unidade `kg`/`L` é inferida de `unitLabel` somente quando a quantidade fiscal é fracionada. Uma linha com quantidade inteira e `unitLabel` de massa/volume, sem medida na descrição, pode ser armazenada sem tamanho/unidade. Confirmar a representação esperada para produtos fiscais vendidos em unidades inteiras de massa/volume antes de classificar como bug.

## Cobertura sem achado novo confirmado

A passada revisou autenticação e sessão, cadastros e perfil, Configurações, isolamento normal por conta/despensa, notificações, CRUD de listas e itens, scanner, reconciliação fiscal, associação de compra/histórico, estoque e preferências. Achados já descritos em `auditoria-bugs-2026-10-11.md` não foram repetidos aqui, salvo para explicar a relação de C01, C02 e C04 com itens anteriores.
