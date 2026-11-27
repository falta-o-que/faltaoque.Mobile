import AsyncStorage from '@react-native-async-storage/async-storage';

export const PANTRY_BRAND_GROUPING = {
    GROUPED: 'grouped', SEPARATE: 'separate',
};

const preferenceKey = (accountId, pantryId) => {
    if (!accountId || !pantryId) throw new Error('Conta e despensa são obrigatórias.');
    return `@faltaoque/pantry-brand-view/${encodeURIComponent(accountId)}/${encodeURIComponent(pantryId)}`;
};

const emptyPreferences = () => ({brandGroupingByPresentation: {}, promptedDuplicateCounts: {}});

const isRecord = (value) => value != null && typeof value === 'object' && !Array.isArray(value);

const isValidBrandGrouping = (value) => Object.values(PANTRY_BRAND_GROUPING).includes(value);

function parsePreferences(storedValue) {
    if (storedValue === null) return emptyPreferences();

    const parsed = JSON.parse(storedValue);
    if (!isRecord(parsed)) throw new Error('INVALID_PANTRY_PRODUCT_VIEW_PREFERENCES');

    const brandGroupingByPresentation = Object.prototype.hasOwnProperty.call(parsed, 'brandGroupingByPresentation')
        ? parsed.brandGroupingByPresentation : {};
    const promptedDuplicateCounts = Object.prototype.hasOwnProperty.call(parsed, 'promptedDuplicateCounts')
        ? parsed.promptedDuplicateCounts : {};
    const hasValidBrandGroupings = isRecord(brandGroupingByPresentation)
        && Object.values(brandGroupingByPresentation).every(isValidBrandGrouping);
    const hasValidDuplicateCounts = isRecord(promptedDuplicateCounts)
        && Object.values(promptedDuplicateCounts).every((count) => Number.isSafeInteger(count) && count >= 0);
    if (!hasValidBrandGroupings || !hasValidDuplicateCounts) {
        throw new Error('INVALID_PANTRY_PRODUCT_VIEW_PREFERENCES');
    }

    return {brandGroupingByPresentation, promptedDuplicateCounts};
}

export async function getPantryProductViewPreferences(accountId, pantryId) {
    const storedValue = await AsyncStorage.getItem(preferenceKey(accountId, pantryId));
    return parsePreferences(storedValue);
}

export async function savePantryProductBrandGrouping(accountId, pantryId, presentationKey, value) {
    if (!Object.values(PANTRY_BRAND_GROUPING).includes(value)) {
        throw new Error('Escolha como as marcas devem aparecer na despensa.');
    }
    if (!presentationKey) throw new Error('Escolha um produto para definir a exibição das marcas.');
    const current = await getPantryProductViewPreferences(accountId, pantryId);
    const next = {
        ...current, brandGroupingByPresentation: {
            ...current.brandGroupingByPresentation, [presentationKey]: value,
        },
    };
    await AsyncStorage.setItem(preferenceKey(accountId, pantryId), JSON.stringify(next));
    return value;
}

export async function savePromptedDuplicateCount(accountId, pantryId, duplicateKey, count) {
    if (!duplicateKey || !Number.isSafeInteger(count) || count < 0) return;
    const current = await getPantryProductViewPreferences(accountId, pantryId);
    const next = {
        ...current, promptedDuplicateCounts: {...current.promptedDuplicateCounts, [duplicateKey]: count},
    };
    await AsyncStorage.setItem(preferenceKey(accountId, pantryId), JSON.stringify(next));
}

export async function clearPantryProductViewPreferences(accountId, pantryId) {
    await AsyncStorage.removeItem(preferenceKey(accountId, pantryId));
}
