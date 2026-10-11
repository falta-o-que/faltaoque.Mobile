import { Alert } from 'react-native';
import { translate } from '../localization';
import { USER_ERROR_KEYS } from '../localization/catalogs/errors';

const portuguese = (key) => translate('pt-BR', key);

// Services return stable message keys rather than storing translated UI text.
export function getUserErrorTranslationKey(error) {
  const message = typeof error === 'string' ? error : error?.message;
  return typeof message === 'string' && Object.hasOwn(USER_ERROR_KEYS, message)
    ? USER_ERROR_KEYS[message]
    : null;
}

// Approved errors retain their meaning in the selected language. Unknown
// exception details remain hidden behind the screen's contextual fallback.
export function getUserErrorMessage(error, fallback, t = portuguese) {
  const key = getUserErrorTranslationKey(error);
  return key ? t(key) : fallback ?? t('errors.generic');
}

export function showUserErrorAlert(error, { title, fallback, dismissText, t = portuguese } = {}) {
  Alert.alert(title ?? t('errors.title'), getUserErrorMessage(error, fallback, t), [
    { text: dismissText ?? t('common.ok') },
  ]);
}
