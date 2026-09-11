import { readDatabase, writeDatabase } from '../storage/localDatabase';

export async function listPantriesByAccountId(accountId) {
  const database = await readDatabase();

  return database.pantries.filter((pantry) => pantry.accountId === accountId);
}

export async function createPantry(pantry) {
  const database = await readDatabase();

  await writeDatabase({
    ...database,
    pantries: [...database.pantries, pantry],
  });

  return pantry;
}
