import * as Crypto from 'expo-crypto';
import { normalizeProduct } from '../domain/productValidation';
import {
  createProductWithPurchase,
  deleteProduct as removeProduct,
  listProductsByPantry,
  updateProduct as saveProduct,
  updateProductQuantity as saveProductQuantity,
} from '../repositories/productRepository';

export function listProducts(accountId, pantryId) {
  return listProductsByPantry(accountId, pantryId);
}

export async function addProduct({ accountId, pantryId, ...draft }) {
  if (!accountId) throw new Error('Entre na sua conta para adicionar produtos.');
  const values = normalizeProduct(draft);
  const createdAt = new Date().toISOString();
  const product = { ...values, id: Crypto.randomUUID(), accountId, pantryId, createdAt };
  const purchase = {
    id: Crypto.randomUUID(), accountId, pantryId, source: 'manual',
    purchasedAt: createdAt, location: '', totalPrice: values.totalPrice,
    items: [{ ...values, productId: product.id }],
  };
  return createProductWithPurchase(product, purchase);
}

export async function updateProductQuantity({ accountId, pantryId, productId, quantity }) {
  if (!accountId || !productId || !Number.isSafeInteger(quantity) || quantity < 1) {
    throw new Error('INVALID_PRODUCT_QUANTITY');
  }
  return saveProductQuantity({ accountId, pantryId, productId, quantity });
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
