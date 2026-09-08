import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'faltaoque.session.accountId';
const OPTIONS = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export function getActiveAccountId() {
  return SecureStore.getItemAsync(SESSION_KEY, OPTIONS);
}

export function saveActiveAccountId(accountId) {
  return SecureStore.setItemAsync(SESSION_KEY, accountId, OPTIONS);
}

export function clearActiveAccountId() {
  return SecureStore.deleteItemAsync(SESSION_KEY, OPTIONS);
}

