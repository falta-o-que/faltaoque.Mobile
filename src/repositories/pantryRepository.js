import { readDatabase, updateDatabase } from '../storage/localDatabase';

export async function listPantriesByAccountId(accountId) {
  const database = await readDatabase();

  return database.pantries.filter((pantry) => pantry.accountId === accountId).map((pantry) => ({
    ...pantry,
    productCount: database.products.filter((product) => product.accountId === accountId && product.pantryId === pantry.id).length,
  }));
}

export async function createPantry(pantry) {
  await updateDatabase((database) => ({
    ...database,
    pantries: [...database.pantries, pantry],
  }));

  return pantry;
}
