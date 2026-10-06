import * as Crypto from 'expo-crypto';

import { normalizeProduct } from '../domain/productValidation';
import { getCategoryId, updateDatabase } from '../storage/localDatabase';
import { listGroceryLists } from './groceryListService';

const UNIT_ID = { g: 1, kg: 2, ml: 3, L: 4 };

export async function finishListAndStock({ accountId, pantryId, listId, pricesByItemId }) {
  if (!accountId || !pantryId || !listId) throw new Error('Lista indisponível.');
  const lists = await listGroceryLists(accountId, pantryId);
  const list = lists.find((entry) => entry.id === listId);
  if (!list || list.status !== 'active') throw new Error('A lista não está ativa.');
  const selectedItems = list.items.filter((item) => item.checked);
  if (selectedItems.length === 0) throw new Error('Marque os itens comprados antes de finalizar.');

  const products = selectedItems.map((item) => normalizeProduct({
    name: item.name, quantity: String(item.quantity), price: pricesByItemId?.[item.id], priceType: 'unit',
    weight: item.weight == null ? '' : String(item.weight), unit: item.unit || '',
    category: item.category || 'outros', expirationDate: '',
  }));
  const purchasedAt = new Date().toISOString();
  const purchaseId = Crypto.randomUUID();
  await updateDatabase((database) => {
    if (!database.users_pantries.some((row) => row.user_id === accountId && row.pantry_id === pantryId)) {
      throw new Error('Esta despensa não está disponível para sua conta.');
    }
    const storedList = database.grocery_lists.find((entry) => entry.id === listId && entry.pantry_id === pantryId);
    if (!storedList) throw new Error('Lista não encontrada.');
    if (storedList.is_finished) return database;
    const purchase = {
      id: purchaseId, title: list.name,
      location: list.location && list.location.length <= 8 ? list.location : null,
      purchase_date: purchasedAt.slice(0, 10),
      total_price: products.reduce((total, product) => total + product.totalPrice, 0),
      total_products: products.length,
      is_finished: true, finish_date: purchasedAt.slice(0, 10), qr_code_id: null, pantry_id: pantryId,
    };
    const pantry_products = products.map((values) => ({
      id: Crypto.randomUUID(), name: values.name, quantity: values.quantity, current_quantity: values.quantity,
      is_in_pantry: true, content_value: values.weight, unit_of_measure: UNIT_ID[values.unit] ?? null,
      price: values.totalPrice, brand: null, expiration_date: values.expirationDate, finish_date: null,
      is_deleted: false, purchase_id: purchaseId, category_id: getCategoryId(database, values.category),
    }));
    return {
      ...database,
      purchases: [...database.purchases, purchase],
      pantry_products: [...database.pantry_products, ...pantry_products],
      grocery_lists: database.grocery_lists.map((entry) => entry.id === listId
        ? { ...entry, is_finished: true } : entry),
    };
  });
}
