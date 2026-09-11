import AsyncStorage from '@react-native-async-storage/async-storage';

const DATABASE_KEY = '@faltaoque/database';
const CURRENT_SCHEMA_VERSION = 2;

const createEmptyDatabase = () => ({
  version: CURRENT_SCHEMA_VERSION,
  accounts: [],
  pantries: [],
});

function migrateDatabase(value) {
  if (value.version === 1 && Array.isArray(value.accounts)) {
    return {
      version: CURRENT_SCHEMA_VERSION,
      accounts: value.accounts,
      pantries: [],
    };
  }

  return value;
}

function normalizeDatabase(value) {
  if (!value || typeof value !== 'object') {
    return createEmptyDatabase();
  }

  const migratedDatabase = migrateDatabase(value);

  if (
    migratedDatabase.version !== CURRENT_SCHEMA_VERSION ||
    !Array.isArray(migratedDatabase.accounts) ||
    !Array.isArray(migratedDatabase.pantries)
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

