import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'faltaoque.session.api.v1';
const LEGACY_SESSION_KEY = 'faltaoque.session.accountId';
const OPTIONS = {keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY};

function parseSession(value) {
    const session = JSON.parse(value);
    if (!session || typeof session.token !== 'string' || !session.token ||
        typeof session.account?.id !== 'string' || !session.account.id ||
        typeof session.expiration !== 'string' || !Number.isFinite(Date.parse(session.expiration))) {
        throw new Error('INVALID_SESSION');
    }
    return session;
}

export async function getSession() {
    const secured = await SecureStore.getItemAsync(SESSION_KEY, OPTIONS);
    const legacy = await AsyncStorage.getItem(SESSION_KEY);
    if (secured) {
        const session = parseSession(secured);
        if (legacy !== null) await AsyncStorage.removeItem(SESSION_KEY);
        return session;
    }
    if (!legacy) return null;
    const session = parseSession(legacy);
    await SecureStore.setItemAsync(SESSION_KEY, legacy, OPTIONS);
    await AsyncStorage.removeItem(SESSION_KEY);
    return session;
}

export async function saveSession(session) {
    // Remove the old unencrypted copy before committing the new secure session.
    await AsyncStorage.removeItem(SESSION_KEY);
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session), OPTIONS);
}

export async function clearSession() {
    await AsyncStorage.removeItem(SESSION_KEY);
    await SecureStore.deleteItemAsync(SESSION_KEY, OPTIONS);
    await SecureStore.deleteItemAsync(LEGACY_SESSION_KEY, OPTIONS);
}
