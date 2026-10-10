import * as Crypto from 'expo-crypto';
import { normalizeProduct } from '../domain/productValidation';
import { normalizeCep } from '../domain/locationValidation';
import {
  assertFiscalNoteUnused as assertFiscalNoteUnusedInPantry,
  createProductWithPurchase,
  deleteProduct as removeProduct,
  listProductOccurrences as listRawProductOccurrences,
  listProductsByPantry,
  updateProduct as saveProduct,
  updateProductQuantity as saveProductQuantity,
} from '../repositories/productRepository';
import {
  PANTRY_BRAND_GROUPING,
  getPantryProductViewPreferences,
  savePantryProductBrandGrouping,
  savePromptedDuplicateCount,
} from './pantryProductViewPreferenceService';

export { PANTRY_BRAND_GROUPING };

export async function listProducts(accountId, pantryId, options = {}) {
  const preferences = options.brandGroupingByPresentation ??
    (await getPantryProductViewPreferences(accountId, pantryId)).brandGroupingByPresentation;
  return listProductsByPantry(accountId, pantryId, { brandGroupingByPresentation: preferences });
}

export function listProductOccurrences(accountId, pantryId) {
  return listRawProductOccurrences(accountId, pantryId);
}

export function assertFiscalNoteUnused({ accountId, pantryId, qrCodeId }) {
  return assertFiscalNoteUnusedInPantry({ accountId, pantryId, qrCodeId });
}

export function getProductViewPreferences(accountId, pantryId) {
  return getPantryProductViewPreferences(accountId, pantryId);
}

export function setProductBrandGrouping(accountId, pantryId, presentationKey, value) {
  return savePantryProductBrandGrouping(accountId, pantryId, presentationKey, value);
}

export function saveProductDuplicatePromptCount(accountId, pantryId, duplicateKey, count) {
  return savePromptedDuplicateCount(accountId, pantryId, duplicateKey, count);
}

export async function addProduct({ accountId, pantryId, location, market, ...draft }) {
  if (!accountId) throw new Error('Entre na sua conta para adicionar produtos.');
  const values = normalizeProduct(draft);
  let normalizedLocation;
  try {
    normalizedLocation = normalizeCep(location);
  } catch {
    const error = new Error('Escolha um mercado válido da lista de sugestões.');
    error.fields = { location: error.message };
    throw error;
  }
  const createdAt = new Date().toISOString();
  const product = { ...values, id: Crypto.randomUUID(), accountId, pantryId, createdAt };
  const purchase = {
    id: Crypto.randomUUID(), accountId, pantryId, source: 'manual', market,
    purchasedAt: createdAt, location: normalizedLocation, totalPrice: values.totalPrice,
    items: [{ ...values, productId: product.id }],
  };
  return createProductWithPurchase(product, purchase);
}

export async function updateProductQuantity({ accountId, pantryId, productId, productIds, quantity }) {
  const requestedIds = Array.isArray(productIds) && productIds.length ? productIds : [productId];
  if (!accountId || !pantryId || requestedIds.some((id) => !id) || !Number.isSafeInteger(quantity) || quantity < 0) {
    throw new Error('INVALID_PRODUCT_QUANTITY');
  }
  return saveProductQuantity({ accountId, pantryId, productId, productIds: requestedIds, quantity });
}

export async function updateProduct({ accountId, pantryId, productId, ...draft }) {
  if (!accountId || !pantryId || !productId) throw new Error('INVALID_PRODUCT');
  const values = normalizeProduct(draft);
  return saveProduct({ accountId, pantryId, productId, values });
}

export async function deleteProduct({ accountId, pantryId, productId }) {
  if (!accountId || !pantryId || !productId) throw new Error('INVALID_PRODUCT');
  return removeProduct({ accountId, pantryId, productId });
}
