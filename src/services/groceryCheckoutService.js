import * as Crypto from 'expo-crypto';
import { normalizeDateOnly } from '../domain/dateValidation';
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from '../domain/productValidation';
import { arePresentationsCompatible } from '../domain/groceryCheckoutReconciliation';
import { isDisposableBagFiscalItem } from '../domain/fiscalItems';
import { findOrCreateLocalMarket } from '../repositories/marketRepository';
import { getCategoryId, updateDatabase } from '../storage/localDatabase';
import { listGroceryLists } from './groceryListService';

const UNIT_ID = { g: 1, kg: 2, ml: 3, L: 4 };
const decimal = (value) => {
  const text = String(value ?? '').trim().replace(',', '.');
  return /^\d+(?:\.\d+)?$/.test(text) ? Number(text) : NaN;
};
const localToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
const parsePurchaseDate = (value) => {
  const date = normalizeDateOnly(String(value ?? '').slice(0, 10));
  if (!date || date > localToday()) throw new Error('A data da compra deve ser real, hoje ou anterior.');
  return date;
};

function normalizeCheckoutItem(item, listItemsById) {
  const name = String(item.name ?? '').trim();
  const brand = String(item.brand ?? '').trim() || null;
  const quantity = decimal(item.quantity);
  const contentText = String(item.contentValue ?? '').trim();
  const contentValue = contentText ? decimal(contentText) : null;
  const unit = contentValue == null ? null : item.unit;
  const enteredPrice = decimal(item.priceInput);
  const totalPrice = item.priceMode === 'unit' ? Math.round(enteredPrice * quantity * 100) / 100 : enteredPrice;
  if (!name || name.length > 120 || (brand && brand.length > 100)) throw new Error('Revise o nome e a marca dos produtos selecionados.');
  if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error(`Informe uma quantidade inteira para ${name}.`);
  if (contentValue != null && (!Number.isFinite(contentValue) || contentValue <= 0 || !PRODUCT_UNITS.includes(unit))) {
    throw new Error(`Revise o tamanho da embalagem de ${name}.`);
  }
  if (!Number.isFinite(totalPrice) || totalPrice <= 0) throw new Error(`Informe o preço de ${name}.`);
  if (!PRODUCT_CATEGORIES.includes(item.category)) throw new Error(`Escolha uma categoria para ${name}.`);
  if (item.listItemId && !listItemsById.has(item.listItemId)) throw new Error(`Revise o vínculo de ${name} com a lista.`);
  if (item.listItemId && !arePresentationsCompatible(listItemsById.get(item.listItemId), { weight: contentValue, unit })) {
    throw new Error(`O tamanho de ${name} não é compatível com o item vinculado na lista.`);
  }
  if (item.needsReview && !item.reviewed) throw new Error(`Revise o vínculo de ${name} antes de finalizar.`);
  if (item.categoryConflict && !item.categoryResolved) throw new Error(`Resolva o conflito de categoria de ${name}.`);
  if (item.categoryConflict && ![item.categoryConflict.listCategory, item.categoryConflict.pantryCategory].includes(item.category)) {
    throw new Error(`Escolha a categoria da lista ou da despensa para ${name}.`);
  }
  return { name, brand, quantity, contentValue, unit, totalPrice, category: item.category };
}

// One local transaction creates a purchase and its separate product occurrences.
export async function finalizeGroceryCheckout({ accountId, pantryId, listId, mode, dateValue, purchase, market, marketQuery, items }) {
  if (!accountId || !pantryId || !listId) throw new Error('Lista indisponível.');
  const lists = await listGroceryLists(accountId, pantryId);
  const list = lists.find((entry) => entry.id === listId);
  if (!list || list.status !== 'active') throw new Error('A lista não está ativa.');
  if (marketQuery?.trim() && !market) throw new Error('Selecione um mercado nas sugestões do Google ou limpe o campo.');
  if (mode === 'nfce' && (!purchase?.qrCodeId || String(purchase.qrCodeId).length > 44 || !purchase?.purchasedAt ||
    !Number.isFinite(decimal(purchase?.totalAmount)) || decimal(purchase.totalAmount) <= 0)) {
    throw new Error('A nota não contém identificação, data ou total de compra válidos.');
  }
  const date = parsePurchaseDate(mode === 'nfce' ? purchase.purchasedAt : dateValue);
  if (mode === 'nfce' && parsePurchaseDate(dateValue) !== date) throw new Error('A data da nota não pode ser alterada.');
  const listItemsById = new Map(list.items.map((item) => [item.id, item]));
  const checkoutItems = (items ?? []).filter((item) =>
    !(mode === 'nfce' && isDisposableBagFiscalItem(item.sourceDescription)));
  if (mode === 'nfce') {
    const linkedListItemIds = checkoutItems.filter((item) => item.sourceDescription && item.listItemId)
      .map((item) => item.listItemId);
    if (new Set(linkedListItemIds).size !== linkedListItemIds.length) {
      throw new Error('Cada produto da lista só pode ser relacionado a uma linha da nota.');
    }
  }
  if (checkoutItems.some((item) => item.needsReview && !item.reviewed)) {
    throw new Error('Revise cada item não vinculado e confirme se será incluído ou ignorado.');
  }
  const products = checkoutItems.filter((item) => item.included).map((item) => normalizeCheckoutItem(item, listItemsById));
  const purchaseId = Crypto.randomUUID();
  await updateDatabase((database) => {
    if (!database.users_pantries.some((row) => row.user_id === accountId && row.pantry_id === pantryId)) {
      throw new Error('Esta despensa não está disponível para sua conta.');
    }
    const storedList = database.grocery_lists.find((row) => row.id === listId && row.pantry_id === pantryId);
    if (!storedList || !storedList.is_active) throw new Error('A lista já foi concluída. Atualize a página.');
    if (mode === 'nfce' && database.purchases.some((row) => row.pantry_id === pantryId &&
      String(row.qr_code_id ?? '').trim() === String(purchase.qrCodeId).trim())) {
      throw new Error('DUPLICATE_FISCAL_NOTE');
    }
    const resolved = findOrCreateLocalMarket(database.markets, market ?? null);
    const includedProductsTotal = Math.round(products.reduce((sum, product) => sum + product.totalPrice, 0) * 100) / 100;
    const actualTotalPrice = mode === 'nfce' ? decimal(purchase.totalAmount) : includedProductsTotal;
    const purchaseRow = products.length || mode === 'nfce' ? {
      id: purchaseId, title: list.name, location: market?.cep ?? null, market_id: resolved.marketId,
      purchase_date: date, total_price: actualTotalPrice,
      total_products: products.length, is_finished: true, finish_date: date,
      qr_code_id: mode === 'nfce' ? purchase.qrCodeId : null, pantry_id: pantryId,
    } : null;
    const rows = products.map((product) => ({
      id: Crypto.randomUUID(), name: product.name, quantity: product.quantity, current_quantity: product.quantity,
      is_in_pantry: true, content_value: product.contentValue, unit_of_measure: UNIT_ID[product.unit] ?? null,
      price: product.totalPrice, brand: product.brand, expiration_date: null, finish_date: null,
      is_deleted: false, purchase_id: purchaseId, category_id: getCategoryId(database, product.category),
    }));
    return {
      ...database, markets: resolved.markets,
      purchases: purchaseRow ? [...database.purchases, purchaseRow] : database.purchases,
      pantry_products: [...database.pantry_products, ...rows],
      grocery_lists: database.grocery_lists.map((row) => row.id === listId ? {
        ...row,
        market_id: resolved.marketId,
        location: market?.cep ?? null,
        estimated_price: actualTotalPrice,
        is_active: false,
      } : row),
    };
  });
}

// Compatibility with the prior price-only checkout contract.
export async function finishListAndStock({ accountId, pantryId, listId, pricesByItemId }) {
  const lists = await listGroceryLists(accountId, pantryId);
  const list = lists.find((entry) => entry.id === listId);
  if (!list) throw new Error('Lista não encontrada.');
  return finalizeGroceryCheckout({ accountId, pantryId, listId, mode: 'manual', dateValue: localToday(),
    market: list.market, marketQuery: '', items: list.items.filter((item) => item.checked).map((item) => ({
      included: true, name: item.name, brand: '', quantity: item.quantity, contentValue: item.weight,
      unit: item.unit, category: item.category, priceInput: pricesByItemId?.[item.id], priceMode: 'unit', listItemId: item.id,
    })) });
}
