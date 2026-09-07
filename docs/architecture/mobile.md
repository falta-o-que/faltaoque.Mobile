# Arquitetura mobile proposta

Status: proposta inicial, sujeita à validação do spike e ao contrato futuro do backend.

## Princípio central

Telas e componentes não conhecem a tecnologia de persistência nem o formato final da API. Casos de uso chamam repositórios; repositórios podem usar armazenamento local agora e backend depois.

```text
screens/components
       |
       v
application services
       |
       v
repository contracts
       |
       +--> local adapters
       |
       +--> API adapters futuros
```

## Camadas

### Interface

- `src/screens`: composição das telas e estados de interface.
- `src/components`: componentes reutilizáveis alinhados ao Figma.
- `src/navigation`: rotas públicas e autenticadas.
- `src/theme`: tokens e tema usados por `styled-components/native`.

### Aplicação

- `src/services`: operações de autenticação, despensas, produtos, importação e sessão.
- Serviços coordenam validação e múltiplos repositórios.
- Serviços não renderizam interface.

### Domínio local

- `src/domain`: validações, normalização, categorias, unidades e comparação de produtos.
- Regras puras devem permanecer independentes de React Native quando possível.

### Dados

- `src/repositories`: contratos e implementações locais ou remotas.
- `src/storage`: mecanismo de persistência, versão do esquema e migrações locais.
- `src/integrations/nfce`: scanner, roteamento por estado, extratores e normalização fiscal.

## Repositórios previstos

- `accountRepository`.
- `sessionRepository`.
- `pantryRepository`.
- `productRepository`.
- `purchaseRepository`.
- `productAliasRepository`.

As assinaturas públicas devem permanecer estáveis durante a troca de armazenamento local por API. Não é necessário reproduzir localmente o futuro esquema do backend.

## Estado e persistência

- Manter estado de formulário e interface próximo às telas.
- Persistir somente entidades e sessão necessárias.
- Incluir versão do esquema local desde o início.
- Executar operações compostas de forma atômica ou com rollback lógico.
- Isolar dados por `accountId`.
- Proteger material de autenticação com mecanismo apropriado para segredo; não salvar senhas em texto simples.

## NFC-e

```text
camera -> QR validator -> state router -> SP extractor
       -> fiscal normalizer -> review model -> import service
```

- O scanner retorna o conteúdo do QR Code.
- O validador aceita apenas endereços fiscais reconhecidos.
- O roteador identifica o estado e seleciona o extrator disponível.
- O extrator de São Paulo converte a resposta externa em dados intermediários.
- O normalizador produz um modelo independente da SEFAZ.
- O serviço de importação aplica revisão, duplicação, aliases, histórico e estoque.

## Styled Components

- Usar `styled-components/native` em componentes e telas.
- Consumir cores e tipografia pelo `ThemeProvider`.
- Evitar valores literais quando existir token equivalente.
- Usar propriedades transitórias, como `$variant`, para impedir encaminhamento indevido ao componente nativo.
- Manter estado e regras de negócio fora dos arquivos de estilo.

## Compatibilidade futura com backend

- A chegada do backend substitui adaptadores, não telas.
- Mapear DTOs da API para o modelo usado pela aplicação.
- Remover persistência local que duplicar responsabilidade do backend.
- Manter somente cache ou sessão local que o contrato oficial justificar.
- Planejar migração ou descarte explícito dos dados locais existentes.

## Dependências técnicas planejadas

- `@react-native-async-storage/async-storage`: entidades locais versionadas, separadas por conta e acessadas apenas pelos adaptadores de armazenamento.
- `expo-secure-store`: somente sessão e segredos pequenos; não será usado como banco de dados.
- `expo-crypto`: hash de senha local com salt e impressão digital técnica do QR Code.
- `expo-camera`: leitura do QR Code dentro da despensa.
- `react-native-webview`: alternativa controlada para páginas fiscais que não entreguem HTML utilizável por `fetch`.

Todas devem ser instaladas com `npx expo install`, preservando as versões compatíveis com o SDK 57. A instalação ocorrerá apenas na etapa de implementação correspondente.

Não será adicionada uma biblioteca global de estado, formulário ou banco relacional antes de existir necessidade demonstrada. Estado React, serviços e os adaptadores locais são suficientes para o marco atual.

## Decisões ainda técnicas

- Formato exato do esquema local e suas migrações.
- Estratégia final do extrator da SEFAZ-SP após teste com uma nota real.
- Biblioteca e configuração de testes compatíveis com a base atual.
