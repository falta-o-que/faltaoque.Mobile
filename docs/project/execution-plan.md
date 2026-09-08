# Plano de execução

## Forma de trabalho

O desenvolvimento seguirá fatias verticais pequenas e verificáveis. Antes de cada fatia, o orquestrador lê a memória do projeto e somente a especificação pertinente. Depois, distribui no máximo três tarefas independentes, revisa o resultado, integra sem commit e atualiza o estado do projeto.

As instruções técnicas dadas aos agentes ficam em inglês. Decisões, especificações e entregas destinadas à equipe ficam em português.

O Astra opera no leve por padrão e escolhe diretamente o executor adequado: Luna/médio para escopos fechados, Sol/médio ou alto para trabalhos de maior complexidade. Não há passagem obrigatória pelo Sol. O limite de três subagentes inclui toda a árvore. Quando necessário, o orquestrador recomenda ao usuário elevar seu raciocínio para médio, com justificativa concreta. A política completa está em `docs/agents/workflow.md` e `docs/project/decisions.md`.

## Trilhas

### Trilha A — Fundação e autenticação

1. Estrutura de navegação pública e autenticada.
2. Esquema local versionado e adaptadores de armazenamento.
3. Cadastro, login, sessão, logout e isolamento entre contas.
4. Estados visuais e validações conforme Figma.

### Trilha B — Despensas e produtos

1. CRUD de despensas e exclusão em cascata.
2. CRUD de produtos e histórico manual.
3. Busca sem acentos e filtro por categoria.
4. Aliases e comparação de produtos equivalentes.

### Trilha C — NFC-e

1. Spike com nota real de São Paulo.
2. Scanner dentro da despensa.
3. Extrator, normalizador e bloqueio de duplicação.
4. Tela de revisão e importação atômica.

### Trilha D — Qualidade

1. Testes de regras puras e repositórios.
2. Testes dos fluxos críticos no Android físico.
3. Revisão visual contra Alta Fidelidade, Page Flow e Components.
4. Registro explícito do que não foi validado no iOS.

## Divisão segura entre pessoas e agentes

- Trabalho humano atual: `src/components/Navbar/` e `src/assets/icons/`.
- Agentes não alteram essas áreas sem atribuição explícita.
- Cada subagente recebe arquivos ou diretórios exclusivos.
- Integração transversal, mudanças de esquema e decisões de segurança ficam com o orquestrador.
- Resultados de investigação são revisados antes de orientar implementação.

## Controle de tokens

- A memória curta fica em `overview.md`, `decisions.md` e `current-state.md`.
- Especificações detalhadas são carregadas somente quando a tarefa as exige.
- Agentes recebem objetivo, limites, arquivos permitidos, critérios de aceite e comandos de validação; não recebem toda a conversa.
- Relatórios de subagentes devem destacar achados, riscos, arquivos alterados e validações, evitando narrativas extensas.
- Decisões duráveis são escritas nos documentos; detalhes transitórios permanecem no relatório da tarefa.

## Ordem imediata recomendada

1. Fundação de navegação e tema.
2. Persistência local versionada e autenticação.
3. Despensas.
4. Produtos.
5. Integração do fluxo fiscal validado pelo spike.

O spike fiscal começa paralelamente à fundação assim que uma amostra real estiver disponível.
