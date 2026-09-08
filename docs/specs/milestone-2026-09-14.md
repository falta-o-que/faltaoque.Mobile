# Especificação da entrega de 14 de setembro de 2026

Status: rascunho executável.

## Objetivo

Entregar no Android um fluxo mobile funcional, persistido localmente e alinhado ao Figma para cadastro, login, despensas, produtos e importação real de uma NFC-e de São Paulo. O código deve permanecer compatível com iOS, embora o grupo não possua dispositivo iOS para validação física.

## Fora do escopo

- Versão web.
- Compartilhamento de despensas.
- Recuperação real de senha.
- Tela de histórico.
- Dashboards funcionais.
- Integração com o backend ainda indisponível.
- Suporte validado a portais fiscais de outros estados.

## Regras transversais

- JavaScript.
- Expo SDK 57.
- `styled-components/native` e tema compartilhado.
- Figma atualizado como fonte de verdade visual.
- Persistência acessada somente por serviços ou repositórios substituíveis.
- Dados de contas diferentes não podem se misturar.
- Erros devem aparecer em linguagem clara e não podem apagar dados existentes.

## Fluxo 1 - Inicialização e sessão

### Comportamento

- Ao abrir o aplicativo, restaurar a sessão local válida, se existir.
- Com sessão válida, abrir a área autenticada.
- Sem sessão válida, abrir o fluxo de autenticação.
- Logout encerra apenas a sessão; contas e dados persistidos permanecem no aparelho.

### Critérios de aceite

- Fechar e abrir o aplicativo mantém a conta autenticada.
- Fazer logout e entrar com outra conta exibe somente os dados da segunda conta.
- Reiniciar o aplicativo não remove contas, despensas, produtos, aliases ou histórico.

## Fluxo 2 - Cadastro

### Campos

- Nome: obrigatório.
- E-mail: obrigatório, válido e único entre contas locais.
- Cor do avatar: obrigatória, escolhida entre 12 opções fixas do Figma.
- Senha: obrigatória, entre 8 e 20 caracteres.
- Confirmar senha: obrigatória e igual à senha; não deve ser persistida.
- Aceite dos Termos de Uso e da Política de Privacidade: obrigatório.

### Resultado

- Criar a conta local.
- Autenticar a nova conta automaticamente.
- Exibir pop-up de sucesso com o botão `Continuar`.
- Abrir a tela inicial quando o usuário acionar o botão.

### Critérios de aceite

- Rejeitar e-mail duplicado sem substituir a conta existente.
- Rejeitar senha fora dos limites.
- Rejeitar confirmação de senha diferente.
- Rejeitar cadastro sem aceite dos termos.
- Não persistir senha em texto simples nem persistir a confirmação.

## Fluxo 3 - Login

### Comportamento

- Autenticar uma conta local por e-mail e senha.
- Informar credenciais inválidas sem revelar qual campo está cadastrado.
- Manter `Esqueci minha senha` visível.
- Ao acionar recuperação de senha, informar que o recurso está indisponível no momento.

### Critérios de aceite

- Contas diferentes podem entrar no mesmo aparelho.
- Login válido restaura somente os dados vinculados à conta autenticada.
- Login inválido não altera a sessão existente nem os dados armazenados.

## Fluxo 4 - Despensas

### Dados

- Nome: obrigatório.
- Cor: obrigatória e escolhida entre as opções definidas no design.

### Operações

- Criar, listar, visualizar, editar e excluir.
- Compartilhamento permanece desativado.
- A despensa pertence à conta que a criou.

### Exclusão

- Pedir confirmação explícita.
- Informar que todos os produtos vinculados serão removidos.
- Após confirmação, remover a despensa e seus produtos em uma única operação lógica.

### Critérios de aceite

- Uma conta não enxerga despensas de outra conta.
- Cancelar a confirmação mantém todos os dados.
- Falha durante a exclusão não pode deixar produtos órfãos.

## Fluxo 5 - Produtos

### Dados

- Nome: obrigatório.
- Quantidade: inteiro positivo obrigatório.
- Preço unitário: valor monetário positivo obrigatório.
- Preço total: valor monetário positivo obrigatório ou calculado quando houver dados suficientes.
- Peso ou volume: valor decimal positivo opcional.
- Unidade: `g`, `kg`, `ml` ou `L`, obrigatória quando houver peso ou volume.
- Categoria: opcional e limitada às categorias fixas.

### Categorias fixas

- Bebidas.
- Orgânicos.
- Integrais/Cereais.
- Frescos.
- Limpeza/Higiene.
- Carnes.

### Operações

- Criar, listar, visualizar, editar e excluir.
- Excluir somente após confirmação explícita.
- Adição manual gera histórico com origem `manual`, data e hora atuais e local vazio.
- O produto exibe o preço mais recente; compras anteriores permanecem no histórico.

### Busca e filtro

- Buscar somente por nome.
- Ignorar caixa e acentos.
- Filtrar por uma categoria fixa.
- Permitir combinação de busca e categoria.

### Critérios de aceite

- Valores inválidos não são persistidos.
- Cancelar exclusão mantém o produto.
- Busca por `cafe` encontra `Café`.
- Trocar de conta não mistura produtos.

## Fluxo 6 - Importação de NFC-e por QR Code

### Escopo imediato

- Iniciar o scanner dentro de uma despensa.
- Ler o QR Code com a câmera do Android.
- Aceitar uma URL válida de consulta pública de NFC-e de São Paulo.
- Consultar e processar a nota diretamente no aplicativo.
- Extrair data, local da compra, valor total e itens.
- Normalizar os itens para o modelo local.
- Abrir uma revisão antes de persistir qualquer alteração.

### Revisão

- Exibir todos os itens inicialmente selecionados.
- Permitir desmarcar itens.
- Permitir editar nome, quantidade, preços, peso ou volume, unidade e categoria.
- Sugerir categoria por dicionário local de palavras-chave.
- Deixar sem categoria quando não houver correspondência confiável.

### Reconciliação

- Procurar produtos equivalentes na despensa mesmo com nomes diferentes.
- Considerar descrição normalizada, marca, peso ou volume, unidade e apresentação.
- Apresentar correspondências prováveis para confirmação.
- Sem confirmação, não mesclar automaticamente uma correspondência nova.
- Após confirmação, salvar um alias local para importações futuras.
- Permitir corrigir vínculos e remover aliases.
- Ao mesclar, somar quantidade e usar o preço unitário mais recente na despensa.

### Histórico e duplicação

- Histórico visível da compra: data, local, valor total e itens.
- Origem do registro: `nota_fiscal`.
- Guardar impressão digital técnica do QR Code sem exibi-la.
- Bloquear uma nota já importada antes de alterar a despensa.
- Não exigir uma tela de histórico nesta entrega.

### Critérios de aceite

- Permissão de câmera negada produz orientação e opção de tentar novamente.
- QR inválido não abre a revisão.
- Falha de rede ou de interpretação não cria histórico nem produtos parciais.
- Nota repetida não altera quantidades.
- Desmarcar um item impede sua importação.
- Editar um item na revisão persiste o valor revisado.
- Confirmar a revisão grava compra, itens, aliases confirmados e estoque como uma única operação lógica.

## Ordem de implementação

1. Estrutura de navegação e inicialização.
2. Persistência e isolamento por conta.
3. Cadastro, login, sessão e logout.
4. CRUD de despensas.
5. CRUD, busca e filtros de produtos.
6. Histórico interno e aliases.
7. Spike real da SEFAZ-SP.
8. Scanner, extração, normalização e revisão.
9. Teste integrado no Android e correções.

O spike da SEFAZ-SP deve começar em paralelo aos itens 1 a 5, pois representa o maior risco técnico.

## Definição de pronto

Uma funcionalidade está pronta somente quando:

- Atende aos critérios de aceite relevantes.
- Está visualmente coerente com o nó correspondente do Figma.
- Não altera áreas humanas protegidas sem atribuição explícita.
- Preserva dados de outras contas e fluxos.
- Tem estados de carregamento, vazio e erro quando aplicáveis.
- Foi validada no Android físico para fluxos que dependem de câmera ou ciclo de vida.
- Possui uma nota explícita quando a compatibilidade iOS não pôde ser testada fisicamente.
