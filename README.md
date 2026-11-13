# FaltaOquê?

<p align="center">
  <img src="src/assets/branding/logo.png" alt="FaltaOquê?" width="220" />
</p>

<p align="center">
  Organize a despensa, acompanhe os produtos da casa e planeje suas compras em um só lugar.
</p>

<p align="center">
  Aplicativo mobile desenvolvido em React Native com Expo.
</p>

---

## Índice

- [Sobre o projeto](#sobre-o-projeto)
- [Recursos](#recursos)
- [Download](#download)
- [Tecnologias](#tecnologias)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Configuração do Google Places](#configuração-do-google-places)
- [Como executar](#como-executar)
- [Testes](#testes)
- [Equipe](#equipe)

## Sobre o projeto

O **FaltaOquê?** ajuda a acompanhar o que há em casa e a organizar o próximo supermercado. O app reúne despensas, produtos, listas de compras e histórico para facilitar o controle de quantidades, validades e gastos.

Este repositório contém o aplicativo mobile do Projeto FaltaOquê?. O Android é a plataforma principal de desenvolvimento e validação. O código também inclui suporte a iOS, mas a versão atual ainda não foi validada em um dispositivo iOS físico.

## Recursos

### Conta e perfil

- Crie uma conta e acesse o aplicativo com suas credenciais.
- Consulte e edite os dados do perfil pelas opções da conta.

### Despensas e produtos

- Crie e configure despensas para organizar os produtos da casa.
- Cadastre produtos com nome, marca, categoria, embalagem, quantidade, preço e validade.
- Atualize o estoque conforme os produtos forem consumidos ou comprados.
- Pesquise, filtre e ordene os produtos para encontrar rapidamente o que procura.
- Receba avisos sobre itens próximos do vencimento ou com saldo zerado, conforme as permissões de notificação do aparelho.

### Listas de compras

- Crie listas vinculadas à despensa escolhida e adicione os produtos que pretende comprar.
- Organize os itens e acompanhe as quantidades planejadas.
- Consulte listas concluídas no histórico e repita uma lista quando precisar.
- Veja sugestões de mercado e estimativas calculadas a partir das compras registradas.

### Registro de compras

- Registre compras manualmente ou leia o QR Code de uma NFC-e compatível de São Paulo.
- Revise os itens identificados na nota, corrija as informações e escolha o que deve entrar na despensa.
- Consulte as compras anteriores e os produtos associados a cada registro.

### Dashboard

- Acompanhe gastos por período e mercado.
- Consulte gráficos de gastos por categoria e variações de preço dos produtos registrados.
- Use os períodos de 30 dias, 3 meses ou 6 meses para explorar o histórico.

As estimativas dependem do histórico disponível e podem variar em relação aos preços praticados no mercado.

### Preferências

- Use o app em português, inglês ou espanhol.
- Ajuste o tamanho do texto e as preferências de notificação nas configurações.

## Download

Para instalar uma versão publicada no Android:

1. Acesse a página de [Releases do GitHub](https://github.com/falta-o-que/faltaoque.Mobile/releases).
2. Na versão desejada, abra **Assets** e baixe o arquivo APK.
3. Abra o arquivo no aparelho e siga as instruções de instalação.
4. Se solicitado, autorize a instalação de aplicativos pela fonte utilizada para abrir o arquivo.

Na primeira utilização, crie sua conta para começar a cadastrar despensas e produtos.

## Tecnologias

- [React Native](https://reactnative.dev/) e [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)
- JavaScript
- [React Navigation](https://reactnavigation.org/) para navegação
- [styled-components](https://styled-components.com/) para estilos nativos
- Expo Camera para leitura de QR Code
- Expo Notifications para notificações no dispositivo
- Google Places API (New) para busca e detalhes de endereços e mercados

A aplicação utiliza serviços para coordenar os fluxos de negócio, repositórios para acesso aos dados e componentes reutilizáveis para a interface. A navegação separa as telas públicas das telas acessadas após a autenticação.

## Estrutura do projeto

```text
src/
├── assets/          Imagens e identidade visual
├── components/      Componentes reutilizáveis
├── contexts/        Sessão e preferências da aplicação
├── domain/          Regras e validações de domínio
├── integrations/    Integrações externas, incluindo NFC-e
├── localization/    Textos e idiomas
├── navigation/      Rotas e navegação
├── repositories/    Acesso e persistência de dados
├── screens/         Telas do aplicativo
├── services/        Casos de uso e coordenação dos fluxos
├── storage/         Camada de armazenamento de dados
└── theme/           Tokens e tema visual

docs/
├── agents/          Orientações para agentes e fluxo de trabalho
├── architecture/    Documentos de arquitetura
├── project/         Contexto, decisões e estado atual
├── reports/         Relatórios e auditorias
└── specs/           Especificações funcionais

tests/               Testes e harnesses Node.js
```

As telas encaminham operações aos serviços e repositórios da aplicação. Essa separação mantém regras de interface, fluxos de negócio e acesso a dados em módulos distintos.

## Configuração do Google Places

A busca de endereços e mercados usa a **Google Places API (New)** e a variável `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`.

1. Crie uma chave no projeto do Google Cloud e habilite a Places API (New) e o faturamento, conforme os requisitos do Google.
2. Copie `.env.example` para `.env.local`.
3. Defina `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` no `.env.local` e reinicie o Expo.

Como a variável começa com `EXPO_PUBLIC_`, seu valor é incorporado ao aplicativo e pode ser extraído do APK. Restrinja a chave aos serviços necessários e configure limites de uso no Google Cloud. Não use essa variável para armazenar credenciais privadas.

O arquivo `.env.local` é ignorado pelo Git. Nunca o adicione ao repositório.

A chave é necessária para pesquisar endereços e mercados. Em builds feitas pelo EAS, configure a variável também no ambiente EAS usado pelo perfil escolhido. Após alterar a variável durante o desenvolvimento, reinicie o servidor do Expo.

## Como executar

### Requisitos

- Node.js em uma versão compatível com o Expo SDK 57.
- npm.
- Para compilar e executar no Android: Android Studio, Android SDK e um emulador ou dispositivo configurado.
- Para compilar e executar no iOS: macOS com Xcode.

### Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/falta-o-que/faltaoque.Mobile.git
cd faltaoque.Mobile
npm ci
```

Crie um arquivo `.env.local` a partir do `.env.example` e configure as variáveis necessárias para os recursos que dependem de serviços externos. Consulte [Configuração do Google Places](#configuração-do-google-places).

### Iniciar o projeto

```bash
npm run start
```

Para iniciar diretamente em uma plataforma:

```bash
npm run android
npm run ios
```

Os comandos de plataforma precisam do ambiente nativo correspondente configurado. O app usa módulos nativos do Expo; para validar recursos como câmera e notificações, execute uma build de desenvolvimento compatível.

### Gerar um APK com EAS Build

O perfil `production` definido em `eas.json` gera um APK Android para distribuição interna. Com acesso ao projeto EAS e uma sessão autenticada:

```bash
npx eas-cli build --platform android --profile production
```

As builds usam os canais `development`, `preview` e `production`, configurados em `eas.json`. Alterações em módulos nativos exigem uma nova build; atualizações compatíveis de JavaScript e assets podem ser distribuídas com EAS Update.

## Testes

Os testes automatizados estão em `tests/` como scripts `.cjs` e são executados individualmente com Node.js. Por exemplo:

```bash
node tests/dashboard-analytics.cjs
node tests/nfce-extraction.cjs
```

O `package.json` ainda não define um comando geral `npm test`.

Os testes cobrem listas de compras, conciliação fiscal, produtos, notificações e cálculos do Dashboard. Para investigar um fluxo específico, escolha o script correspondente na pasta `tests/`. A câmera, as notificações do sistema e a consulta de NFC-e também devem ser conferidas em um dispositivo compatível.

## Equipe

**Projeto FaltaOquê?**

- [Miguel Zacharias da Silva](https://github.com/miguelzack)
- [Sarah Santos de Jesus](https://github.com/sarahsj-dot)
- [Thiago Soares Coelho da Costa](https://github.com/th-cs)
- [Manuela Vitória Barbosa de Andrade](https://github.com/Manuela0894)
- [Nikollas Oliveira Andrade dos Santos](https://github.com/nikidsy)

Conheça também a [organização do projeto no GitHub](https://github.com/falta-o-que).
