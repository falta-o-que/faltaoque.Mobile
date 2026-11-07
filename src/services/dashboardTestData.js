import { readDatabase, updateDatabase } from '../storage/localDatabase';

const SAMPLE_CEPS = new Set(['88888001', '88888002', '88888003']);

export async function removeDashboardTestPantry(accountId) {
  if (!accountId) return;
  const pantryId = `dashboard-test-${accountId}`;
  const snapshot = await readDatabase();
  if (!snapshot.users_pantries.some((row) => row.user_id === accountId && row.pantry_id === pantryId)) return;

  await updateDatabase((database) => {
    if (!database.users_pantries.some((row) => row.user_id === accountId && row.pantry_id === pantryId)) return database;
    const pantry = database.pantries.find((row) => row.id === pantryId);
    const removedPurchaseIds = new Set(database.purchases.filter((row) => row.pantry_id === pantryId).map((row) => row.id));
    const removedListIds = new Set(database.grocery_lists.filter((row) => row.pantry_id === pantryId).map((row) => row.id));
    const purchases = database.purchases.filter((row) => row.pantry_id !== pantryId);
    const groceryLists = database.grocery_lists.filter((row) => row.pantry_id !== pantryId);
    const usedMarketIds = new Set([...purchases.map((row) => row.market_id), ...groceryLists.map((row) => row.market_id)].filter(Boolean));
    return {
      ...database,
      pantries: database.pantries.filter((row) => row.id !== pantryId),
      users_pantries: database.users_pantries.filter((row) => row.pantry_id !== pantryId),
      pantries_invites: database.pantries_invites.filter((row) => row.id !== pantry?.share_invite_id || database.pantries.some((other) => other.id !== pantryId && other.share_invite_id === row.id)),
      purchases,
      pantry_products: database.pantry_products.filter((row) => !removedPurchaseIds.has(row.purchase_id)),
      grocery_lists: groceryLists,
      grocery_list_products: database.grocery_list_products.filter((row) => !removedListIds.has(row.grocery_list_id)),
      markets: database.markets.filter((row) => !SAMPLE_CEPS.has(row.cep) || usedMarketIds.has(row.id)),
    };
  });
}
