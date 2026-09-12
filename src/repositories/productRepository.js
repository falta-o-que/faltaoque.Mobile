import { readDatabase, updateDatabase } from '../storage/localDatabase';

function assertPantry(database, accountId, pantryId) {
  if (!accountId || !database.pantries.some((item) => item.id === pantryId && item.accountId === accountId)) {
    throw new Error('Esta despensa não está disponível para sua conta.');
  }
}

export async function listProductsByPantry(accountId, pantryId) {
  const database = await readDatabase();
  assertPantry(database, accountId, pantryId);
  return database.products.filter((item) => item.accountId === accountId && item.pantryId === pantryId);
}

export async function createProductWithPurchase(product, purchase) {
  await updateDatabase((database) => {
    assertPantry(database, product.accountId, product.pantryId);
    return {
      ...database,
      products: [...database.products, product],
      purchases: [...database.purchases, purchase],
    };
  });
  return product;
}
