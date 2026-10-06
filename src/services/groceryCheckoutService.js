import * as Crypto from 'expo-crypto';

import { normalizeProduct } from '../domain/productValidation';
import { updateDatabase } from '../storage/localDatabase';
import { finishGroceryList, listGroceryLists } from './groceryListService';

export async function finishListAndStock({ accountId, pantryId, listId, pricesByItemId }) {
  if (!accountId || !pantryId || !listId) throw new Error('Lista indisponível.');
  const lists = await listGroceryLists(accountId, pantryId);
  const list = lists.find((entry) => entry.id === listId);
  if (!list || list.status !== 'active') throw new Error('A lista não está ativa.');
  const selectedItems = list.items.filter((item) => item.checked);
  if (selectedItems.length === 0) throw new Error('Marque os itens comprados antes de finalizar.');

  // Validate every draft before touching local purchase history.
  const products = selectedItems.map((item) => normalizeProduct({
    name: item.name,
    quantity: String(item.quantity),
    price: pricesByItemId?.[item.id],
    priceType: 'unit',
    weight: item.weight == null ? '' : String(item.weight),
    unit: item.unit || '',
    category: item.category || 'outros',
    expirationDate: '',
  }));

  const purchasedAt = new Date().toISOString();
  await updateDatabase((database) => {
    if (!database.pantries.some((pantry) => pantry.id === pantryId && pantry.accountId === accountId)) {
      throw new Error('Esta despensa não está disponível para sua conta.');
    }
    if (database.purchases.some((purchase) => purchase.accountId === accountId && purchase.pantryId === pantryId && purchase.groceryListId === listId)) {
      return database;
    }

    const entries = products.map((values) => {
      const product = { ...values, id: Crypto.randomUUID(), accountId, pantryId, createdAt: purchasedAt };
      const purchase = {
        id: Crypto.randomUUID(), accountId, pantryId, source: 'manual', groceryListId: listId,
        purchasedAt, location: '', totalPrice: values.totalPrice,
        items: [{ ...values, productId: product.id }],
      };
      return { product, purchase };
    });
    return {
      ...database,
      products: [...database.products, ...entries.map((entry) => entry.product)],
      purchases: [...database.purchases, ...entries.map((entry) => entry.purchase)],
    };
  });

  await finishGroceryList({ accountId, pantryId, listId });
}
