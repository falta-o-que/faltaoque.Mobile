# Aditivo de modelagem: mercados

**Data da decisão:** 8 de outubro de 2026  
**Estado:** decisão aprovada e espelhada no armazenamento local do app; integração de busca pelo Places API implementada no mobile. Isso não confirma migração no banco hospedado.

## Modelo aprovado

| Tabela | Campo | Tipo sugerido | Regra |
|---|---|---|---|
| `markets` | `id` | `VARCHAR(36)` | Chave primária interna e estável. |
| `markets` | `cep` | `VARCHAR(8)` | CEP normalizado; não é único. |
| `markets` | `latitude` | `DECIMAL(10,7) NULL` | Coordenada retornada para a unidade selecionada; nula enquanto o fluxo coleta somente CEP. |
| `markets` | `longitude` | `DECIMAL(10,7) NULL` | Coordenada retornada para a unidade selecionada; nula enquanto o fluxo coleta somente CEP. |
| `grocery_lists` | `market_id` | `VARCHAR(36)` | Chave estrangeira opcional para `markets.id`. |
| `purchases` | `market_id` | `VARCHAR(36)` | Chave estrangeira opcional para `markets.id`. |

`market_id` é o identificador de domínio. O `place_id` do Google não será usado como chave primária. O nome local escolhido pelo usuário não será gravado no banco hospedado; o app o associa localmente ao ID interno.

## Transição e limitações

- Preservar temporariamente `grocery_lists.location` e `purchases.location` durante a migração. O backend deve publicar o novo contrato e definir o backfill antes de remover esses campos.
- CEP não pode ser `UNIQUE`: unidades distintas podem compartilhar o mesmo CEP. As coordenadas descrevem a localização de cada unidade.
- Listas e compras sem mercado continuam válidas, portanto `market_id` é anulável.
- Latitude e longitude são anuláveis em conjunto no armazenamento local durante a transição sem Maps; quando preenchidas, devem ser coordenadas válidas. A migração do backend pode manter a mesma regra temporária.
- Registros antigos com apenas CEP não revelam qual unidade foi visitada. Um backfill por CEP cria associações aproximadas e pode agrupar mercados diferentes; não deve ser tratado como identificação confiável de mercado.
- A tabela hospedada proposta não inclui nome de exibição nem `place_id`. No armazenamento local, `local_name` guarda o nome retornado pelo Google Places para o estabelecimento selecionado; registros são reutilizados por CEP e coordenadas iguais. Digitar somente um CEP não identifica uma unidade de mercado, então a origem do nome é a seleção do estabelecimento no Places. O `place_id` só vive durante a consulta e não é persistido.

## Estado no app mobile

O armazenamento local agora tem a tabela `markets` e os vínculos `market_id` opcionais em `purchases` e `grocery_lists`, no esquema local versão 11. A migração da versão 8 preserva os dados e cria um mercado legado por CEP para registros antigos, com coordenadas nulas; migrações posteriores acrescentam nome de mercado e cache de nome da despensa sem remover os registros existentes. Novos mercados selecionados pelo Places guardam CEP, coordenadas e somente o nome principal retornado pela API em `markets.local_name`. A localização da despensa mantém o CEP em `pantries.location` e cacheia somente o nome principal do Places em `pantries.location_name`; esse campo é local-only e não faz parte do modelo hospedado. A busca está disponível na criação/edição/repetição de listas, compra manual, revisão da NFC-e e criação/edição da despensa. A chave é lida de `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` em `.env.local`, arquivo ignorado pelo Git.

Em 8 de outubro, após o usuário atualizar a chave em `.env.local`, a chamada ao Places Autocomplete retornou quatro sugestões e o Place Details retornou CEP e coordenadas. Testes separados ao Routes API e ao Directions API (Legacy) feitos deste ambiente foram rejeitados; isso não invalida o fluxo Places. O teste Places foi uma chamada real ao serviço usando a chave local, mas a busca ainda não foi validada visualmente no app Android. O mobile chama diretamente o Places Web Service; antes de produção, trocar o acesso direto por um proxy autenticado ou pelo SDK nativo de Places, sem colocar uma chave irrestrita no bundle `EXPO_PUBLIC_`.

## Responsabilidade

O repositório atual contém apenas o app mobile. Este aditivo registra o contrato decidido para a equipe do backend; não altera o banco hospedado e não substitui o JSON oficial recebido em 8 de outubro.
