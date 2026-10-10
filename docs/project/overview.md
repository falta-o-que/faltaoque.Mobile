# Visão do projeto

Última revisão: 10 de outubro de 2026. Este arquivo resume o produto e aponta para as fontes mantidas no repositório; a implementação está em `current-state.md`, decisões confirmadas em `decisions.md` e requisitos detalhados nos SDDs de `../specs/`.

## Produto

FaltaOquê? é um aplicativo mobile para gerenciar despensas, produtos e listas de compras. O sistema pretende facilitar o controle de quantidade, validade, histórico de compras e gastos de uma residência compartilhada.

O nome público, package Android, ativos de marca e créditos da equipe estão mantidos em [`app-identity.md`](app-identity.md), fonte de referência para os builds e materiais do projeto.

## Responsabilidade deste repositório

Este repositório contém exclusivamente o aplicativo mobile desenvolvido com React Native e Expo. Backend, banco de dados e versão web são responsabilidades externas. O mobile deve consumir os contratos do backend quando eles estiverem disponíveis.

## Plataformas

- Android: plataforma principal de desenvolvimento e validação física.
- iOS: plataforma suportada pelo código, mas sem dispositivo disponível no grupo para validação física antes da entrega atual.
- Web: fora do escopo.

## Fontes de verdade

Para decisões de interface, usar esta ordem:

1. Página `Alta FIdelidade` do Figma.
2. Páginas `Page Flow` e `Components` do Figma.
3. Página `StyleGuide` e biblioteca `Icons` do Figma.
4. Documentação funcional em PDF.
5. Wireframes e páginas de brainstorm como referências históricas.

Figma: https://www.figma.com/design/clwpIe4TC12SEAwf26SGo9/FaltaOqu%C3%AA----Design?node-id=500-6300

Documentação funcional de referência: `C:\Users\Miguel\Downloads\FaltaOquê_ - Documentação.pdf`.

Para desenvolvimento e retomada, use também esta ordem documental:

1. `decisions.md` para decisões posteriores confirmadas pelo usuário.
2. `../specs/integracao-e-fluxos-2026-10-05.md` para fluxos e contratos mobile definidos após o MVP, com atualizações até 10 de outubro de 2026.
3. `current-state.md` para distinguir o que foi implementado, validado e ainda precisa de verificação.
4. `../specs/milestone-2026-09-14.md` como registro do escopo original do MVP local, não como descrição completa do comportamento atual.
5. Documentos em `../architecture/`; os retratos JSON recebidos descrevem modelos, não comprovam esquema implantado nem API disponível.

## Escopo funcional geral do mobile

- Cadastro e autenticação de usuários.
- Criação e configuração local de despensas; o compartilhamento permanece desativado até a integração com o backend.
- Cadastro, edição e acompanhamento de produtos.
- Listas de compras.
- Importação de produtos por QR Code de nota fiscal.
- Histórico e dashboards.
- Integração futura com o backend da equipe.

O escopo está sendo desenvolvido primeiro com adaptadores locais substituíveis. A página de listas e as sugestões de mercado foram validadas no Android em 9 de outubro; a validação física do fluxo atual de finalização e revisão de compra está registrada em `current-state.md`. A API hospedada e o esquema de mercados ainda dependem de confirmação da equipe responsável.

## Escopo acadêmico

O ambiente poderá apoiar posteriormente a monografia, referências, diagramas, documentação técnica e apresentação do TCC. Essa frente deve permanecer separada da memória operacional de desenvolvimento enquanto não for prioridade.
