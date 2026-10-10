import * as Crypto from 'expo-crypto';

import { updateDatabase } from '../storage/localDatabase';

const UNIT_ID = { g: 1, kg: 2, ml: 3, L: 4 };
const DEMO_PURCHASE_TITLE = 'Histórico demonstrativo — mercados reais de SP';
const DEMO_LIST_NAME = 'Lista demonstrativa — Indianópolis';
const LEGACY_PURCHASE_TITLES = new Set([
  'Compra demonstrativa',
  'Compra demonstrativa por mercado',
]);
const LEGACY_LIST_NAMES = new Set(['Demonstração de estimativa']);

// Endereços, nomes de unidades, marcas e produtos existem. Os registros de
// compras e os valores são sintéticos, criados apenas para exercitar as sugestões.
const DEMO_MARKETS = [
  {
    key: 'atacadao-indianopolis',
    name: 'Atacadão - Indianópolis',
    cep: '04045004',
    latitude: -23.6293346,
    longitude: -46.6447403,
    purchaseDaysAgo: [35, 18],
    prices: [22.19, 7.79, 5.79, 2.59, 7.49],
    brands: ['Camil', 'Kicaldo', 'Piracanjuba', 'Dona Benta', 'Liza'],
  },
  {
    key: 'carrefour-express-moema',
    name: 'Carrefour Express Moema',
    cep: '04077023',
    latitude: -23.6074878,
    longitude: -46.6547188,
    purchaseDaysAgo: [29, 12],
    prices: [22.99, 8.49, 6.29, 3.39, 7.99],
    brands: ['Prato Fino', 'Tio João', 'Italac', 'Adria', 'Soya'],
  },
  {
    key: 'minuto-pao-indianopolis',
    name: 'Minuto Pão de Açúcar',
    cep: '04089001',
    latitude: -23.608077,
    longitude: -46.6620796,
    purchaseDaysAgo: [25, 16, 5],
    prices: [25.99, 9.29, 6.99, 4.29, 9.49],
    brands: ['Tio João', 'Kicaldo', 'Tirol', 'Renata', 'Liza'],
  },
];

const DEMO_PRODUCTS = [
  { name: 'Arroz tipo 1 5kg', categoryId: 4, contentValue: 5, unit: 'kg', plannedQuantity: 1 },
  { name: 'Feijão carioca tipo 1 1kg', categoryId: 4, contentValue: 1, unit: 'kg', plannedQuantity: 2 },
  { name: 'Leite semidesnatado UHT 1L', categoryId: 1, contentValue: 1, unit: 'L', plannedQuantity: 3 },
  { name: 'Macarrão espaguete com ovos 500g', categoryId: 4, contentValue: 500, unit: 'g', plannedQuantity: 2 },
  { name: 'Óleo de soja 900ml', categoryId: 4, contentValue: 900, unit: 'ml', plannedQuantity: 1 },
];

function dateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function addHistoricalPurchase({ pantryId, market, marketId, daysAgo }) {
  const purchaseId = Crypto.randomUUID();
  const products = DEMO_PRODUCTS.map((product, index) => ({
    id: Crypto.randomUUID(),
    name: product.name,
    quantity: 1,
    current_quantity: 0,
    is_in_pantry: false,
    content_value: product.contentValue,
    unit_of_measure: UNIT_ID[product.unit],
    price: market.prices[index],
    brand: market.brands[index],
    expiration_date: null,
    finish_date: null,
    is_deleted: true,
    purchase_id: purchaseId,
    category_id: product.categoryId,
  }));
  const purchaseDate = dateDaysAgo(daysAgo);
  return {
    purchase: {
      id: purchaseId,
      title: DEMO_PURCHASE_TITLE,
      location: market.cep,
      market_id: marketId,
      purchase_date: purchaseDate,
      total_price: Math.round(products.reduce((sum, product) => sum + product.price, 0) * 100) / 100,
      total_products: products.length,
      is_finished: true,
      finish_date: purchaseDate,
      qr_code_id: null,
      pantry_id: pantryId,
    },
    products,
  };
}

function removeOldDemoData(database, pantryId) {
  const legacyPurchaseIds = new Set(database.purchases
    .filter((purchase) => purchase.pantry_id === pantryId && LEGACY_PURCHASE_TITLES.has(purchase.title))
    .map((purchase) => purchase.id));
  const fixturePurchaseIds = new Set(database.purchases
    .filter((purchase) => purchase.pantry_id === pantryId && purchase.title === DEMO_PURCHASE_TITLE)
    .map((purchase) => purchase.id));
  const allDemoPurchaseIds = new Set([...legacyPurchaseIds, ...fixturePurchaseIds]);
  const demoMarketIds = new Set(database.purchases
    .filter((purchase) => allDemoPurchaseIds.has(purchase.id) && purchase.market_id)
    .map((purchase) => purchase.market_id));
  const demoListIds = new Set(database.grocery_lists
    .filter((list) => list.pantry_id === pantryId && LEGACY_LIST_NAMES.has(list.name))
    .map((list) => list.id));
  const currentDemoLists = database.grocery_lists
    .filter((list) => list.pantry_id === pantryId && list.name === DEMO_LIST_NAME);
  currentDemoLists.forEach((list) => demoListIds.add(list.id));

  const purchases = database.purchases.filter((purchase) => !allDemoPurchaseIds.has(purchase.id));
  const groceryLists = database.grocery_lists.filter((list) => !demoListIds.has(list.id));
  const stillUsedMarketIds = new Set([
    ...purchases.map((purchase) => purchase.market_id),
    ...groceryLists.map((list) => list.market_id),
  ].filter(Boolean));

  return {
    ...database,
    markets: database.markets.filter((market) => !demoMarketIds.has(market.id) || stillUsedMarketIds.has(market.id)),
    purchases,
    pantry_products: database.pantry_products.filter((product) => !allDemoPurchaseIds.has(product.purchase_id)),
    grocery_lists: groceryLists,
    grocery_list_products: database.grocery_list_products.filter((product) => !demoListIds.has(product.grocery_list_id)),
  };
}

export async function seedGroceryEstimateDemoData(pantryId) {
  if (!__DEV__ || !pantryId) return;

  await updateDatabase((originalDatabase) => {
    const currentPurchases = originalDatabase.purchases
      .filter((purchase) => purchase.pantry_id === pantryId && purchase.title === DEMO_PURCHASE_TITLE);
    const currentListExists = originalDatabase.grocery_lists
      .some((list) => list.pantry_id === pantryId && list.name === DEMO_LIST_NAME);
    const expectedPurchaseCount = DEMO_MARKETS.reduce((total, market) => total + market.purchaseDaysAgo.length, 0);
    if (currentPurchases.length === expectedPurchaseCount && currentListExists) return originalDatabase;

    const database = removeOldDemoData(originalDatabase, pantryId);
    let markets = [...database.markets];
    const marketIds = new Map();
    DEMO_MARKETS.forEach((market) => {
      const existing = markets.find((entry) => entry.cep === market.cep &&
        entry.latitude === market.latitude && entry.longitude === market.longitude);
      if (existing) {
        marketIds.set(market.key, existing.id);
        markets = markets.map((entry) => entry.id === existing.id ? { ...entry, local_name: market.name } : entry);
        return;
      }
      const id = Crypto.randomUUID();
      marketIds.set(market.key, id);
      markets.push({
        id,
        cep: market.cep,
        latitude: market.latitude,
        longitude: market.longitude,
        local_name: market.name,
      });
    });

    const historicalPurchases = DEMO_MARKETS.flatMap((market) => market.purchaseDaysAgo.map((daysAgo) =>
      addHistoricalPurchase({
        pantryId,
        market,
        marketId: marketIds.get(market.key),
        daysAgo,
      })));
    const groceryListId = Crypto.randomUUID();
    const list = {
      id: groceryListId,
      name: DEMO_LIST_NAME,
      date: dateDaysAgo(0),
      location: null,
      market_id: null,
      suggestion: null,
      estimated_price: null,
      pantry_id: pantryId,
      is_active: true,
    };
    const plannedItems = DEMO_PRODUCTS.map((product) => ({
      id: Crypto.randomUUID(),
      name: product.name,
      quantity: product.plannedQuantity,
      content_value: product.contentValue,
      unit_of_measure: UNIT_ID[product.unit],
      is_taken: false,
      grocery_list_id: groceryListId,
      category_id: product.categoryId,
    }));

    return {
      ...database,
      markets,
      purchases: [...database.purchases, ...historicalPurchases.map(({ purchase }) => purchase)],
      pantry_products: [...database.pantry_products, ...historicalPurchases.flatMap(({ products }) => products)],
      grocery_lists: [...database.grocery_lists, list],
      grocery_list_products: [...database.grocery_list_products, ...plannedItems],
    };
  });
}
