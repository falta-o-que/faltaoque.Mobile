import { readDatabase, updateDatabase } from '../storage/localDatabase';

const DEMO_PURCHASE_TITLE = 'Compra de demonstração';
const DEMO_MARKET_CEPS = new Set(['99999001', '99999002', '99999003']);

function normalizeCep(value) {
  return String(value ?? '').replace(/\D/g, '');
}

function getDashboardDemoPurchaseIds(database, pantryIds) {
  const marketCeps = new Map(database.markets.map((market) => [market.id, normalizeCep(market.cep)]));
  return new Set(database.purchases
    .filter((purchase) => pantryIds.has(purchase.pantry_id)
      && purchase.title === DEMO_PURCHASE_TITLE
      && DEMO_MARKET_CEPS.has(marketCeps.get(purchase.market_id) || normalizeCep(purchase.location)))
    .map((purchase) => purchase.id));
}

export async function listDashboardRecords(accountId, pantryId) {
  if (!accountId) throw new Error('UNAUTHENTICATED');

  const database = await readDatabase();
  const pantryIds = new Set(database.users_pantries
    .filter((membership) => membership.user_id === accountId)
    .map((membership) => membership.pantry_id));
  if (!pantryId || !pantryIds.has(pantryId)) throw new Error('PANTRY_NOT_FOUND');
  const pantries = new Map(database.pantries
    .filter((pantry) => pantryIds.has(pantry.id))
    .map((pantry) => [pantry.id, pantry.title]));
  const markets = new Map(database.markets.map((market) => [market.id, market.local_name || market.cep]));
  const categories = new Map(database.categories.map((category) => [category.id, category.name]));
  const purchases = database.purchases
    .filter((purchase) => purchase.pantry_id === pantryId)
    .map((purchase) => ({
      id: purchase.id,
      date: purchase.purchase_date,
      total: Number(purchase.total_price) || 0,
      pantryName: pantries.get(purchase.pantry_id),
      marketId: purchase.market_id ?? null,
      marketName: markets.get(purchase.market_id) || purchase.location || null,
      products: database.pantry_products
        .filter((product) => product.purchase_id === purchase.id)
        .map((product) => ({
          id: product.id,
          name: product.name,
          quantity: Number(product.quantity) || 0,
          total: Number(product.price) || 0,
          contentValue: product.content_value == null ? null : Number(product.content_value),
          unitId: product.unit_of_measure,
          category: categories.get(product.category_id) || 'outros',
        })),
    }));

  return { purchases };
}

export async function removeDashboardDemoPurchases(accountId) {
  if (!accountId) throw new Error('UNAUTHENTICATED');

  const snapshot = await readDatabase();
  const snapshotPantryIds = new Set(snapshot.users_pantries
    .filter((membership) => membership.user_id === accountId)
    .map((membership) => membership.pantry_id));
  const snapshotPurchaseIds = getDashboardDemoPurchaseIds(snapshot, snapshotPantryIds);
  const snapshotUsedMarketIds = new Set([
    ...snapshot.purchases.filter((purchase) => !snapshotPurchaseIds.has(purchase.id)).map((purchase) => purchase.market_id),
    ...snapshot.grocery_lists.map((list) => list.market_id),
  ].filter(Boolean));
  const hasUnusedDemoMarket = snapshot.markets.some((market) =>
    DEMO_MARKET_CEPS.has(normalizeCep(market.cep)) && !snapshotUsedMarketIds.has(market.id));
  if (!snapshotPurchaseIds.size && !hasUnusedDemoMarket) return {purchaseCount: 0, marketCount: 0};

  let removedPurchaseCount = 0;
  let removedMarketCount = 0;
  await updateDatabase((database) => {
    const pantryIds = new Set(database.users_pantries
      .filter((membership) => membership.user_id === accountId)
      .map((membership) => membership.pantry_id));
    const removedPurchaseIds = getDashboardDemoPurchaseIds(database, pantryIds);
    const retainedPurchases = database.purchases.filter((purchase) => !removedPurchaseIds.has(purchase.id));
    const usedMarketIds = new Set([
      ...retainedPurchases.map((purchase) => purchase.market_id),
      ...database.grocery_lists.map((list) => list.market_id),
    ].filter(Boolean));
    const removedMarketIds = new Set(database.markets
      .filter((market) => DEMO_MARKET_CEPS.has(normalizeCep(market.cep)) && !usedMarketIds.has(market.id))
      .map((market) => market.id));

    removedPurchaseCount = removedPurchaseIds.size;
    removedMarketCount = removedMarketIds.size;
    if (!removedPurchaseCount && !removedMarketCount) return database;

    return {
      ...database,
      markets: database.markets.filter((market) => !removedMarketIds.has(market.id)),
      purchases: retainedPurchases,
      pantry_products: database.pantry_products.filter((product) => !removedPurchaseIds.has(product.purchase_id)),
    };
  });

  return {purchaseCount: removedPurchaseCount, marketCount: removedMarketCount};
}
