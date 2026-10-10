import { Alert } from 'react-native';

const ERROR_CODE_MESSAGES = {
  INVALID_CREDENTIALS: 'E-mail ou senha inválidos.',
  EMAIL_ALREADY_EXISTS: 'Este e-mail já está cadastrado.',
  INVALID_CEP: 'Escolha um endereço válido da lista de sugestões.',
  INVALID_PRODUCT_QUANTITY: 'Informe uma quantidade válida maior que zero.',
  INVALID_PRODUCT: 'Não foi possível localizar este produto. Atualize a tela e tente novamente.',
  INVALID_PANTRY: 'Não foi possível localizar esta despensa. Atualize a tela e tente novamente.',
  INVALID_PANTRY_NAME: 'Informe um nome para a despensa com até 150 caracteres.',
  INVALID_PANTRY_COLOR: 'Escolha uma cor para a despensa.',
  UNAUTHENTICATED: 'Entre na sua conta e tente novamente.',
  DUPLICATE_FISCAL_NOTE: 'Esta nota já foi adicionada a esta despensa.',
  INVALID_FISCAL_QR: 'Este QR Code não corresponde a uma NFC-e pública de São Paulo.',
  UNSUPPORTED_FISCAL_PAGE: 'Não foi possível interpretar os itens desta nota.',
  FISCAL_NETWORK_ERROR: 'Não foi possível consultar a nota. Verifique sua conexão e tente novamente.',
  FISCAL_PAGE_TOO_LARGE: 'Esta nota é muito grande para ser processada. Tente novamente com outra nota.',
  NO_FISCAL_ITEMS: 'Não encontramos produtos para adicionar nesta nota.',
  INVALID_FISCAL_ITEM: 'Revise os dados dos produtos da nota e tente novamente.',
};

// Only curated messages reach the interface; unknown exception details stay out
// of the UI and each screen supplies a fallback that fits the action.
const SAFE_USER_MESSAGES = new Set([
  'Conta e despensa são obrigatórias.',
  'A data planejada deve ser real, hoje ou futura.',
  'Escolha um mercado válido da lista de sugestões.',
  'Esta despensa não está disponível para sua conta.',
  'O produto não está disponível nesta despensa.',
  'Informe um nome de lista com até 100 caracteres.',
  'Lista concluída não pode ser editada.',
  'Lista não encontrada.',
  'Informe nome com até 100 caracteres e quantidade válida.',
  'Escolha uma categoria válida para o produto.',
  'Informe peso ou volume positivo e selecione a unidade.',
  'Item não encontrado.',
  'Um dos produtos selecionados não está nesta lista.',
  'Lista já concluída.',
  'Informe uma nova data para esta compra.',
  'Conclua a lista antes de repeti-la.',
  'O nome da lista deve ter até 100 caracteres.',
  'Listas concluídas permanecem no histórico.',
  'Lista indisponível.',
  'A lista não está ativa.',
  'Marque os itens comprados antes de finalizar.',
  'Selecione os produtos que deseja remover.',
  'Entre na sua conta para adicionar produtos.',
  'O produto não está disponível nesta despensa.',
  'Escolha um endereço válido da lista do Google Maps.',
  'Adicione sua chave do Google Maps em .env.local e reinicie o Expo.',
  'O Google recusou a chave. Confira o projeto, o Places API (New) e as restrições da chave.',
  'Ative o Places API (New) no projeto associado à chave do Google Maps.',
  'Ative o faturamento no projeto do Google Maps para consultar endereços.',
  'Não foi possível consultar endereços agora. Confira a chave e a configuração do Places API.',
  'Não foi possível identificar o endereço desse local. Escolha outro resultado.',
  'O Google não retornou as coordenadas desse local. Escolha outro resultado.',
  'Configure a Geocoding API no projeto Google Maps para calcular a proximidade.',
  'Ative o faturamento no projeto Google Cloud associado à chave do Maps para calcular a proximidade.',
  'Ative a Geocoding API no projeto Google Maps para calcular a proximidade.',
  'O Google Maps não encontrou a localização da despensa.',
  'Não foi possível obter as coordenadas da despensa pelo Maps.',
]);

export function getUserErrorMessage(error, fallback = 'Não foi possível concluir esta ação. Tente novamente.') {
  const message = typeof error === 'string' ? error : error?.message;
  if (!message) return fallback;
  if (ERROR_CODE_MESSAGES[message]) return ERROR_CODE_MESSAGES[message];
  return SAFE_USER_MESSAGES.has(message) ? message : fallback;
}

export function showUserErrorAlert(error, { title = 'Não foi possível concluir esta ação', fallback } = {}) {
  Alert.alert(title, getUserErrorMessage(error, fallback), [{ text: 'Entendi' }]);
}
