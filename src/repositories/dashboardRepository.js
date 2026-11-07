import * as Crypto from 'expo-crypto';
import { getCategoryId, readDatabase, updateDatabase } from '../storage/localDatabase';

export async function listDashboardRecords(accountId) {
  if (!accountId) throw new Error('UNAUTHENTICATED');

  const database = await readDatabase();
  const pantryIds = new Set(database.users_pantries
    .filter((membership) => membership.user_id === accountId)
    .map((membership) => membership.pantry_id));
  const pantries = new Map(database.pantries
    .filter((pantry) => pantryIds.has(pantry.id))
    .map((pantry) => [pantry.id, pantry.title]));
  const markets = new Map(database.markets.map((market) => [market.id, market.local_name || market.cep]));
  const categories = new Map(database.categories.map((category) => [category.id, category.name]));
  const purchases = database.purchases
    .filter((purchase) => pantryIds.has(purchase.pantry_id))
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

const DEMO_MARKETS = [
  { cep: '99999001', name: 'Atacarejo Central' },
  { cep: '99999002', name: 'Mercado do Bairro' },
  { cep: '99999003', name: 'Supermercado Jardim' },
];

const DEMO_PRODUCTS = [
  { name: 'Café moído tradicional', category: 'bebidas', content: 500, unit: 1, price: 18.4, change: 0.78 },
  { name: 'Leite integral', category: 'bebidas', content: 1, unit: 4, price: 5.1, change: 0.08 },
  { name: 'Arroz tipo 1', category: 'integraisCereais', content: 5, unit: 2, price: 28.9, change: 0.32 },
  { name: 'Feijão carioca', category: 'integraisCereais', content: 1, unit: 2, price: 9.4, change: 0.19 },
  { name: 'Detergente neutro', category: 'limpezaHigiene', content: 500, unit: 3, price: 3.2, change: 0.12 },
  { name: 'Banana prata', category: 'frescos', content: 1, unit: 2, price: 7.2, change: 0.16 },
  { name: 'Peito de frango', category: 'carnes', content: 1, unit: 2, price: 18.6, change: 0.35 },
];

function dateForMonth(monthOffset, day) {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + monthOffset);
  const maxDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, maxDay));
  return date.toISOString().slice(0, 10);
}

export async function replacePurchasesWithDashboardDemo(accountId) {
  if (!accountId) throw new Error('UNAUTHENTICATED');

  const now = new Date();
  const purchaseSpecs = [];
  for (let monthOffset = -5; monthOffset <= 0; monthOffset += 1) {
    const days = monthOffset === 0
      ? [Math.max(1, now.getDate() - 17), Math.max(1, now.getDate() - 11), Math.max(1, now.getDate() - 5), now.getDate()]
      : [5, 12, 19, 26];
    days.forEach((day, index) => purchaseSpecs.push({ monthOffset, date: dateForMonth(monthOffset, day), index }));
  }

  let createdPurchaseCount = 0;
  await updateDatabase((database) => {
    const pantryIds = database.users_pantries
      .filter((membership) => membership.user_id === accountId)
      .map((membership) => membership.pantry_id);
    if (!pantryIds.length) throw new Error('DASHBOARD_DEMO_NO_PANTRY');
    const ownedPantryIds = new Set(pantryIds);
    const removedPurchaseIds = new Set(database.purchases
      .filter((purchase) => ownedPantryIds.has(purchase.pantry_id))
      .map((purchase) => purchase.id));
    const markets = DEMO_MARKETS.map(({ cep, name }) => ({
      id: Crypto.randomUUID(),
      cep,
      latitude: null,
      longitude: null,
      local_name: name,
    }));
    const purchases = purchaseSpecs.map((spec, index) => {
      const market = markets[index % markets.length];
      const pantryId = pantryIds[index % pantryIds.length];
      const productRows = DEMO_PRODUCTS.map((product, productIndex) => {
        const quantity = (index + productIndex) % 5 === 0 ? 2 : 1;
        const marketFactor = [0.96, 1.04, 1][index % markets.length];
        const elapsedMonths = 5 + spec.monthOffset;
        const base = product.price - product.change * (5 - elapsedMonths);
        const unitPrice = Math.max(0.25, (base + ((index % 3) - 1) * product.change * 0.08) * marketFactor);
        return {
          id: Crypto.randomUUID(),
          name: product.name,
          quantity,
          current_quantity: quantity,
          is_in_pantry: true,
          content_value: product.content,
          unit_of_measure: product.unit,
          price: Number((unitPrice * quantity).toFixed(2)),
          brand: null,
          expiration_date: null,
          finish_date: null,
          is_deleted: false,
          purchase_id: null,
          category_id: getCategoryId(database, product.category),
        };
      });
      const totalPrice = Number(productRows.reduce((sum, product) => sum + product.price, 0).toFixed(2));
      const purchaseId = Crypto.randomUUID();
      productRows.forEach((product) => { product.purchase_id = purchaseId; });
      return {
        row: {
          id: purchaseId,
          title: 'Compra de demonstração',
          location: market.cep,
          market_id: market.id,
          purchase_date: spec.date,
          total_price: totalPrice,
          total_products: productRows.length,
          is_finished: true,
          finish_date: spec.date,
          qr_code_id: null,
          pantry_id: pantryId,
        },
        products: productRows,
      };
    });
    createdPurchaseCount = purchases.length;

    const retainedPurchases = database.purchases.filter((purchase) => !removedPurchaseIds.has(purchase.id));
    const retainedPurchaseIds = new Set(retainedPurchases.map((purchase) => purchase.id));
    const retainedLists = database.grocery_lists;
    const demoCeps = new Set(DEMO_MARKETS.map((market) => market.cep));
    const marketsInUse = new Set([
      ...retainedPurchases.map((purchase) => purchase.market_id),
      ...retainedLists.map((list) => list.market_id),
      ...markets.map((market) => market.id),
    ].filter(Boolean));

    return {
      ...database,
      markets: [
        ...database.markets.filter((market) => !demoCeps.has(market.cep) || marketsInUse.has(market.id)),
        ...markets,
      ],
      purchases: [...retainedPurchases, ...purchases.map((purchase) => purchase.row)],
      pantry_products: [
        ...database.pantry_products.filter((product) => retainedPurchaseIds.has(product.purchase_id)),
        ...purchases.flatMap((purchase) => purchase.products),
      ],
    };
  });

  return { purchaseCount: createdPurchaseCount };
}
