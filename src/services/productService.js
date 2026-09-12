import * as Crypto from 'expo-crypto';
import { normalizeProduct } from '../domain/productValidation';
import { createProductWithPurchase, listProductsByPantry } from '../repositories/productRepository';

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
