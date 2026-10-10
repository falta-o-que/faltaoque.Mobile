import AsyncStorage from '@react-native-async-storage/async-storage';

const preferenceKey = (accountId, pantryId) => {
  if (!accountId || !pantryId) throw new Error('Conta e despensa são obrigatórias.');
  return `@faltaoque/grocery-list-view/${encodeURIComponent(accountId)}/${encodeURIComponent(pantryId)}`;
};

export async function getCollapsedGroceryListIds(accountId, pantryId) {
  try {
    const storedValue = await AsyncStorage.getItem(preferenceKey(accountId, pantryId));
    if (!storedValue) return [];
    const parsedValue = JSON.parse(storedValue);
    return Array.isArray(parsedValue) ? parsedValue.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export async function saveCollapsedGroceryListIds(accountId, pantryId, listIds) {
  const safeListIds = [...new Set(listIds.filter((id) => typeof id === 'string'))];
  await AsyncStorage.setItem(preferenceKey(accountId, pantryId), JSON.stringify(safeListIds));
}

export async function clearGroceryListViewPreferences(accountId, pantryId) {
  await AsyncStorage.removeItem(preferenceKey(accountId, pantryId));
}
