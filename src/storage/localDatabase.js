import AsyncStorage from '@react-native-async-storage/async-storage';

const DATABASE_KEY = '@faltaoque/database';
const CURRENT_SCHEMA_VERSION = 1;

const createEmptyDatabase = () => ({
  version: CURRENT_SCHEMA_VERSION,
  accounts: [],
});

function normalizeDatabase(value) {
  if (!value || typeof value !== 'object') {
    return createEmptyDatabase();
  }

  if (value.version !== CURRENT_SCHEMA_VERSION || !Array.isArray(value.accounts)) {
    throw new Error('A versão dos dados locais não é compatível com o aplicativo.');
  }

  return value;
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

