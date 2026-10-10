# Identidade do aplicativo e créditos

Este documento é a referência para os metadados dos builds Android e para materiais do projeto. Ele não substitui os textos específicos de uma futura publicação em loja.

## Identificação

- Nome público do aplicativo: **FaltaOquê?**
- Nome do projeto: **Projeto FaltaOquê?**
- Descrição curta configurada no Expo: “Organize a despensa, acompanhe produtos e planeje as compras da casa.”
- Identificador Android (`applicationId`): `com.faltaoque.app`.
- Perfil EAS `production`: APK para instalação direta, com distribuição interna.
- Ambiente EAS do perfil `production`: `production` (definido explicitamente em `eas.json`, pois distribuição interna sem esse campo selecionaria `preview`).
- Versão atual declarada: `1.0.0`.
- Slug Expo mantido: `FaltaOQueFront`, associado ao projeto EAS já configurado. Não é o nome exibido ao usuário.
- Repositório do projeto: [`falta-o-que/faltaoque.Mobile`](https://github.com/falta-o-que/faltaoque.Mobile); o proprietário/organização GitHub é `falta-o-que`.
- Campo `owner` do Expo: `miguelzack`; identifica a conta que administra o projeto Expo e é independente do proprietário GitHub. Não representa uma empresa ou editora legal.

Alterar `com.faltaoque.app` no futuro criaria outra identidade de aplicativo Android: instalações e dados locais associados a um package diferente não são atualizados como a mesma instalação. Antes de uma publicação externa, a equipe deve confirmar a disponibilidade do identificador no canal escolhido.

## Marca e ativos

- Ícone de aplicativo configurado em `app.json`: `src/assets/branding/app-icon.png`.
- Ícone adaptável Android usa `src/assets/branding/adaptive-icon-foreground.png`, com a marca centralizada e área transparente ao redor, sobre fundo branco. A máscara arredondada é aplicada pelo launcher Android.
- Logo usado pela interface: `src/assets/branding/logo.png`.
- Cor principal configurada: `#00DD00`.
- A identidade atual usa a mesma marca gráfica nos arquivos. O ajuste do ícone adaptável reutiliza o ativo com margem transparente; não altera a logo usada dentro da interface nem o ícone geral do app. O APK de produção com esse ajuste já foi gerado; conferir a aparência final no launcher após instalar no aparelho.

## Créditos

Nome de apresentação do grupo nos créditos: **Projeto FaltaOquê?**

- Miguel Zacharias da Silva
- Sarah Santos de Jesus
- Thiago Soares Coelho da Costa
- Manuela Vitória Barbosa de Andrade
- Nikollas Oliveira Andrade dos Santos

Os créditos devem ser usados nos materiais do projeto e na futura tela Sobre/Créditos solicitada pela equipe. Nenhuma razão social ou entidade empresarial foi informada; não atribuir propriedade, vínculo institucional ou empresa publicadora sem uma decisão posterior da equipe.

## Limite dos metadados do APK

O APK usa metadados técnicos do aplicativo, como nome de exibição, package, versão, ícone e permissões. O arquivo de build não oferece campos padrão para declarar empresa e lista de desenvolvedores como créditos visíveis ao usuário. Essas informações pertencem aos materiais do projeto e, futuramente, à tela Sobre/Créditos. Caso o app seja distribuído por uma loja, a entidade publicadora e os dados de contato devem ser configurados na conta e na página da loja.

O serviço de endereços/mercados lê `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`. Para builds EAS na nuvem, a variável precisa existir no ambiente EAS escolhido; `.env.local` é local e ignorado pelo Git. Como a variável tem prefixo `EXPO_PUBLIC_`, seu valor é compilado no JavaScript do app e pode ser extraído do APK; não é um segredo após o empacotamento.
