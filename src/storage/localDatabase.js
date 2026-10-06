import AsyncStorage from '@react-native-async-storage/async-storage';

const DATABASE_KEY = '@faltaoque/database';
const VERSION_KEY = '@faltaoque/database-schema-version';
const LEGACY_METADATA_KEY = '@faltaoque/database-ui-metadata';
const CURRENT_SCHEMA_VERSION = 7;

export const CATEGORY_NAMES = ['bebidas', 'organicos', 'limpezaHigiene', 'integraisCereais', 'frescos', 'carnes', 'outros'];
const colorRows = [
  { id: 1, name: 'Ciano', hex_code: '#00F0FF' }, { id: 2, name: 'Azul claro', hex_code: '#75C1E0' },
  { id: 3, name: 'Azul escuro', hex_code: '#1E2B5E' }, { id: 4, name: 'Azul', hex_code: '#0031F5' },
  { id: 5, name: 'Vinho', hex_code: '#470419' }, { id: 6, name: 'Roxo', hex_code: '#7115C2' },
  { id: 7, name: 'Lilás', hex_code: '#B666B2' }, { id: 8, name: 'Verde', hex_code: '#36B83F' },
  { id: 9, name: 'Verde claro', hex_code: '#97F7CD' }, { id: 10, name: 'Vermelho', hex_code: '#FF0505' },
  { id: 11, name: 'Laranja', hex_code: '#FFB405' }, { id: 12, name: 'Verde limão', hex_code: '#00DD00' },
];

const emptyTables = () => ({
  users: [], colors: colorRows.map((row) => ({ ...row })), pantries: [], users_pantries: [], pantries_invites: [],
  purchases: [], pantry_products: [], categories: CATEGORY_NAMES.map((name, index) => ({ id: index + 1, name })),
  grocery_lists: [], grocery_list_products: [],
});

const TABLE_FIELDS = {
  users: ['id', 'name', 'email', 'password', 'avatar_id', 'role', 'is_active'],
  colors: ['id', 'name', 'hex_code'],
  pantries: ['id', 'title', 'location', 'color_id', 'share_invite_id'],
  users_pantries: ['user_id', 'pantry_id'],
  pantries_invites: ['id', 'share_invite', 'created_at', 'expires_at'],
  purchases: ['id', 'title', 'location', 'purchase_date', 'total_price', 'total_products', 'is_finished', 'finish_date', 'qr_code_id', 'pantry_id'],
  pantry_products: ['id', 'name', 'quantity', 'current_quantity', 'is_in_pantry', 'content_value', 'unit_of_measure', 'price', 'brand', 'expiration_date', 'finish_date', 'is_deleted', 'purchase_id', 'category_id'],
  categories: ['id', 'name'],
  grocery_lists: ['id', 'name', 'date', 'location', 'suggestion', 'estimated_price', 'pantry_id', 'is_finished'],
  grocery_list_products: ['id', 'name', 'quantity', 'content_value', 'unit_of_measure', 'is_taken', 'grocery_list_id', 'category_id'],
};

const byId = (rows, id) => rows.find((row) => row.id === id);
const categoryId = (name, categories) => categories.find((row) => row.name === name)?.id ?? categories[categories.length - 1]?.id ?? 1;
const colorId = (value, colors) => colors.find((row) => row.hex_code.toLowerCase() === String(value).toLowerCase())?.id ?? colors[0]?.id ?? 1;

function normalizeDatabase(value) {
  const tableNames = Object.keys(TABLE_FIELDS);
  if (!value || typeof value !== 'object' || Object.keys(value).sort().join('|') !== [...tableNames].sort().join('|') ||
    tableNames.some((name) => !Array.isArray(value[name]))) {
    throw new Error('O banco local não corresponde às tabelas do modelo recebido.');
  }
  for (const tableName of tableNames) {
    const expected = [...TABLE_FIELDS[tableName]].sort().join('|');
    if (value[tableName].some((row) => !row || Object.keys(row).sort().join('|') !== expected)) {
      throw new Error(`Os campos locais da tabela ${tableName} não correspondem ao modelo recebido.`);
    }
  }
  const ids = (tableName) => new Set(value[tableName].map((row) => row.id));
  const userIds = ids('users'); const colorIds = ids('colors'); const pantryIds = ids('pantries');
  const inviteIds = ids('pantries_invites'); const purchaseIds = ids('purchases'); const categoryIds = ids('categories');
  const groceryListIds = ids('grocery_lists');
  const emails = value.users.map((row) => row.email);
  const duplicatePrimaryKey = tableNames.some((tableName) => {
    if (tableName === 'users_pantries') return false;
    const keys = value[tableName].map((row) => row.id);
    return new Set(keys).size !== keys.length;
  });
  const memberships = value.users_pantries.map((row) => `${row.user_id}:${row.pantry_id}`);
  if (duplicatePrimaryKey || new Set(memberships).size !== memberships.length || new Set(emails).size !== emails.length ||
    value.users.some((row) => !colorIds.has(row.avatar_id)) ||
    value.pantries.some((row) => !colorIds.has(row.color_id) || (row.share_invite_id != null && !inviteIds.has(row.share_invite_id))) ||
    value.users_pantries.some((row) => !userIds.has(row.user_id) || !pantryIds.has(row.pantry_id)) ||
    value.purchases.some((row) => !pantryIds.has(row.pantry_id)) ||
    value.pantry_products.some((row) => !purchaseIds.has(row.purchase_id) || !categoryIds.has(row.category_id)) ||
    value.grocery_lists.some((row) => !pantryIds.has(row.pantry_id)) ||
    value.grocery_list_products.some((row) => !groceryListIds.has(row.grocery_list_id) || !categoryIds.has(row.category_id))) {
    throw new Error('Os vínculos locais não correspondem às relações do modelo recebido.');
  }
  return value;
}

function isLegacyEnvelope(value) {
  return !value || typeof value !== 'object' || Object.keys(value).sort().join('|') !== Object.keys(TABLE_FIELDS).sort().join('|');
}

async function initializeDatabase() {
  const database = emptyTables();
  await AsyncStorage.setItem(DATABASE_KEY, JSON.stringify(database));
  await AsyncStorage.setItem(VERSION_KEY, String(CURRENT_SCHEMA_VERSION));
  await AsyncStorage.removeItem(LEGACY_METADATA_KEY);
  return database;
}

export async function readDatabase() {
  const serializedDatabase = await AsyncStorage.getItem(DATABASE_KEY);
  const storedVersion = Number(await AsyncStorage.getItem(VERSION_KEY));
  if (!serializedDatabase) return initializeDatabase();
  try {
    const parsed = JSON.parse(serializedDatabase);
    // All earlier local data was explicitly cleared by the user for this model change.
    if (storedVersion < CURRENT_SCHEMA_VERSION || isLegacyEnvelope(parsed)) return initializeDatabase();
    return normalizeDatabase(parsed);
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error('Não foi possível ler os dados locais.');
    throw error;
  }
}

export async function writeDatabase(database) {
  const normalized = normalizeDatabase(database);
  await AsyncStorage.setItem(DATABASE_KEY, JSON.stringify(normalized));
  await AsyncStorage.setItem(VERSION_KEY, String(CURRENT_SCHEMA_VERSION));
}

let pendingUpdate = Promise.resolve();
function enqueueUpdate(operation) {
  const queued = pendingUpdate.then(operation);
  pendingUpdate = queued.catch(() => {});
  return queued;
}

export function updateDatabase(update) {
  return enqueueUpdate(async () => {
    const database = await readDatabase();
    const nextDatabase = await update(database);
    await writeDatabase(nextDatabase);
  });
}

export function resolveColor(database, id) { return byId(database.colors, id); }
export function resolveCategory(database, id) { return byId(database.categories, id); }
export function getColorId(database, hex) { return colorId(hex, database.colors); }
export function getCategoryId(database, name) { return categoryId(name, database.categories); }
