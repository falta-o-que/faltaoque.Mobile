import AsyncStorage from '@react-native-async-storage/async-storage';
import {saveActiveAccountId} from '../repositories/sessionRepository';
import {readDatabase, updateDatabase} from '../storage/localDatabase';
import {createDemoData, DEMO_ACCOUNT_ID} from './demoData';

const DATABASE_KEY = '@faltaoque/database';
const INITIALIZING_KEY = '@faltaoque/demo-initializing';
let initialization;

async function initialize() {
    const pending = await AsyncStorage.getItem(INITIALIZING_KEY);
    if (!pending) {
        if (await AsyncStorage.getItem(DATABASE_KEY) !== null) return;
        await AsyncStorage.setItem(INITIALIZING_KEY, '1');
    } else if (pending !== '1') {
        throw new Error('Invalid demo initialization state');
    }
    const database = await readDatabase();
    if (!database.users.some((user) => user.id === DEMO_ACCOUNT_ID)) {
        if (database.users.length || database.pantries.length || database.purchases.length || database.grocery_lists.length) {
            throw new Error('Existing database cannot be initialized as demo');
        }
        await updateDatabase((current, metadata) => {
            if (current.users.length || current.pantries.length || current.purchases.length || current.grocery_lists.length) {
                throw new Error('Existing database cannot be initialized as demo');
            }
            return createDemoData(current, metadata);
        });
    }
    await saveActiveAccountId(DEMO_ACCOUNT_ID);
    await AsyncStorage.removeItem(INITIALIZING_KEY);
}

export function initializeDemo() {
    if (!initialization) initialization = initialize().finally(() => { initialization = null; });
    return initialization;
}
