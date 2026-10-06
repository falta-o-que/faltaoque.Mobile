import * as Crypto from 'expo-crypto';

import { updateDatabase } from '../storage/localDatabase';

const UNIT_ID = { g: 1, kg: 2, ml: 3, L: 4 };

const DEMO_PRODUCTS = [
  { name: 'Leite integral 1L', categoryId: 1, contentValue: 1, unit: 'L', plannedQuantity: 2, prices: [5.49, 5.79, 5.35] },
  { name: 'Arroz tipo 1 5kg', categoryId: 4, contentValue: 5, unit: 'kg', plannedQuantity: 1, prices: [31.90, 29.50, 30.90] },
  { name: 'Ovos 12 unidades', categoryId: 5, contentValue: null, unit: null, plannedQuantity: 1, prices: [13.50, 12.90, 13.90] },
];

function dateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export async function seedGroceryEstimateDemoData(pantryId) {
  if (!__DEV__ || !pantryId) return;

  await updateDatabase((database) => {
    const pantryPurchases = database.purchases.filter((purchase) => purchase.pantry_id === pantryId);
    const pantryLists = database.grocery_lists.filter((list) => list.pantry_id === pantryId);
    const hasDemoHistory = pantryPurchases.some((purchase) => purchase.title === 'Compra demonstrativa');
    const shouldAddHistory = !hasDemoHistory;
    const shouldAddDemoList = pantryLists.length === 0;
    if (!shouldAddHistory && !shouldAddDemoList) return database;

    const historicalPurchases = shouldAddHistory ? DEMO_PRODUCTS[0].prices.map((_, index) => {
      const purchaseId = Crypto.randomUUID();
      const purchaseDate = dateDaysAgo([28, 14, 3][index]);
      const products = DEMO_PRODUCTS.map((product) => ({
        id: Crypto.randomUUID(),
        name: product.name,
        quantity: 1,
        current_quantity: 0,
        is_in_pantry: false,
        content_value: product.contentValue,
        unit_of_measure: product.unit ? UNIT_ID[product.unit] : null,
        price: product.prices[index],
        brand: null,
        expiration_date: null,
        finish_date: null,
        is_deleted: true,
        purchase_id: purchaseId,
        category_id: product.categoryId,
      }));
      return {
        purchase: {
          id: purchaseId,
          title: 'Compra demonstrativa',
          location: null,
          purchase_date: purchaseDate,
          total_price: products.reduce((sum, product) => sum + product.price, 0),
          total_products: products.length,
          is_finished: true,
          finish_date: purchaseDate,
          qr_code_id: null,
          pantry_id: pantryId,
        },
        products,
      };
    }) : [];

    const groceryListId = shouldAddDemoList ? Crypto.randomUUID() : null;
    const plannedItems = shouldAddDemoList ? DEMO_PRODUCTS.map((product) => ({
      id: Crypto.randomUUID(), name: product.name, quantity: product.plannedQuantity,
      content_value: product.contentValue, unit_of_measure: product.unit ? UNIT_ID[product.unit] : null,
      is_taken: false, grocery_list_id: groceryListId, category_id: product.categoryId,
    })) : [];

    return {
      ...database,
      purchases: [...database.purchases, ...historicalPurchases.map(({ purchase }) => purchase)],
      pantry_products: [...database.pantry_products, ...historicalPurchases.flatMap(({ products }) => products)],
      grocery_lists: shouldAddDemoList ? [...database.grocery_lists, {
        id: groceryListId,
        name: 'Demonstração de estimativa',
        date: dateDaysAgo(0),
        location: null,
        suggestion: null,
        estimated_price: null,
        pantry_id: pantryId,
        is_finished: false,
      }] : database.grocery_lists,
      grocery_list_products: [...database.grocery_list_products, ...plannedItems],
    };
  });
}
