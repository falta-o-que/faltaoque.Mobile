import AsyncStorage from '@react-native-async-storage/async-storage';

export const PANTRY_BRAND_GROUPING = {
  GROUPED: 'grouped',
  SEPARATE: 'separate',
};

const preferenceKey = (accountId, pantryId) => {
  if (!accountId || !pantryId) throw new Error('Conta e despensa são obrigatórias.');
  return `@faltaoque/pantry-brand-view/${encodeURIComponent(accountId)}/${encodeURIComponent(pantryId)}`;
};

export async function getPantryProductViewPreferences(accountId, pantryId) {
  try {
    const storedValue = await AsyncStorage.getItem(preferenceKey(accountId, pantryId));
    const parsed = storedValue ? JSON.parse(storedValue) : null;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { brandGroupingByPresentation: {}, promptedDuplicateCounts: {} };
    }
    return {
      brandGroupingByPresentation: parsed.brandGroupingByPresentation && typeof parsed.brandGroupingByPresentation === 'object'
        ? parsed.brandGroupingByPresentation : {},
      promptedDuplicateCounts: parsed.promptedDuplicateCounts && typeof parsed.promptedDuplicateCounts === 'object'
        ? parsed.promptedDuplicateCounts : {},
    };
  } catch {
    return { brandGroupingByPresentation: {}, promptedDuplicateCounts: {} };
  }
}

export async function savePantryProductBrandGrouping(accountId, pantryId, presentationKey, value) {
  if (!Object.values(PANTRY_BRAND_GROUPING).includes(value)) {
    throw new Error('Escolha como as marcas devem aparecer na despensa.');
  }
  if (!presentationKey) throw new Error('Escolha um produto para definir a exibição das marcas.');
  const current = await getPantryProductViewPreferences(accountId, pantryId);
  const next = {
    ...current,
    brandGroupingByPresentation: {
      ...current.brandGroupingByPresentation,
      [presentationKey]: value,
    },
  };
  await AsyncStorage.setItem(preferenceKey(accountId, pantryId), JSON.stringify(next));
  return value;
}

export async function savePromptedDuplicateCount(accountId, pantryId, duplicateKey, count) {
  if (!duplicateKey || !Number.isSafeInteger(count) || count < 0) return;
  const current = await getPantryProductViewPreferences(accountId, pantryId);
  const next = {
    ...current,
    promptedDuplicateCounts: { ...current.promptedDuplicateCounts, [duplicateKey]: count },
  };
  await AsyncStorage.setItem(preferenceKey(accountId, pantryId), JSON.stringify(next));
}
