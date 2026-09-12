import AsyncStorage from '@react-native-async-storage/async-storage';

const DATABASE_KEY = '@faltaoque/database';
const CURRENT_SCHEMA_VERSION = 4;

const createEmptyDatabase = () => ({
  version: CURRENT_SCHEMA_VERSION,
  accounts: [],
  pantries: [],
  products: [],
  purchases: [],
  importedQrFingerprints: [],
});

function migrateDatabase(value) {
  if (value.version === 1 && Array.isArray(value.accounts)) {
    return {
      ...value,
      version: CURRENT_SCHEMA_VERSION,
      accounts: value.accounts,
      pantries: [],
      products: [],
      purchases: [],
      importedQrFingerprints: [],
    };
  }

  if (value.version === 2 && Array.isArray(value.accounts) && Array.isArray(value.pantries)) {
    return { ...value, version: CURRENT_SCHEMA_VERSION, products: [], purchases: [], importedQrFingerprints: [] };
  }
  if (value.version === 3 && Array.isArray(value.products) && Array.isArray(value.purchases)) {
    return { ...value, version: CURRENT_SCHEMA_VERSION, importedQrFingerprints: [] };
  }

  return value;
}

function normalizeDatabase(value) {
  if (!value || typeof value !== 'object') {
    throw new Error('Não foi possível ler os dados locais.');
  }

  const migratedDatabase = migrateDatabase(value);

  if (
    migratedDatabase.version !== CURRENT_SCHEMA_VERSION ||
    !Array.isArray(migratedDatabase.accounts) ||
    !Array.isArray(migratedDatabase.pantries) ||
    !Array.isArray(migratedDatabase.products) ||
    !Array.isArray(migratedDatabase.purchases) ||
    !Array.isArray(migratedDatabase.importedQrFingerprints)
  ) {
    throw new Error('A versão dos dados locais não é compatível com o aplicativo.');
  }

  return migratedDatabase;
}

export async function readDatabase() {
  const serializedDatabase = await AsyncStorage.getItem(DATABASE_KEY);

  if (!serializedDatabase) {
    return createEmptyDatabase();
  }

  try {
    return normalizeDatabase(JSON.parse(serializedDatabase));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Não foi possível ler os dados locais.');
    }

    throw error;
  }
}

export async function writeDatabase(database) {
  const normalizedDatabase = normalizeDatabase(database);
  await AsyncStorage.setItem(DATABASE_KEY, JSON.stringify(normalizedDatabase));
}

let pendingUpdate = Promise.resolve();

// Serialize read-modify-write operations so concurrent additions cannot overwrite each other.
export function updateDatabase(update) {
  const operation = pendingUpdate.then(async () => {
    const database = await readDatabase();
    const nextDatabase = await update(database);
    await writeDatabase(nextDatabase);
  });
  pendingUpdate = operation.catch(() => {});
  return operation;
}

