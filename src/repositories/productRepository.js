import { readDatabase, updateDatabase } from '../storage/localDatabase';

function assertPantry(database, accountId, pantryId) {
  if (!accountId || !database.pantries.some((item) => item.id === pantryId && item.accountId === accountId)) {
    throw new Error('Esta despensa não está disponível para sua conta.');
  }
}

export async function listProductsByPantry(accountId, pantryId) {
  const database = await readDatabase();
  assertPantry(database, accountId, pantryId);
  return database.products.filter((item) => item.accountId === accountId && item.pantryId === pantryId);
}

export async function createProductWithPurchase(product, purchase) {
  await updateDatabase((database) => {
    assertPantry(database, product.accountId, product.pantryId);
    return {
      ...database,
      products: [...database.products, product],
      purchases: [...database.purchases, purchase],
    };
  });
  return product;
}

export async function updateProductQuantity({ accountId, pantryId, productId, quantity }) {
  let updatedProduct;
  await updateDatabase((database) => {
    assertPantry(database, accountId, pantryId);
    let found = false;
    const products = database.products.map((product) => {
      if (product.id !== productId || product.accountId !== accountId || product.pantryId !== pantryId) return product;
      found = true;
      updatedProduct = { ...product, quantity };
      return updatedProduct;
    });
    if (!found) throw new Error('O produto não está disponível nesta despensa.');
    return { ...database, products };
  });
  return updatedProduct;
}

export async function updateProduct({ accountId, pantryId, productId, values }) {
  let updatedProduct;
  await updateDatabase((database) => {
    assertPantry(database, accountId, pantryId);
    let found = false;
    const products = database.products.map((product) => {
      if (product.id !== productId || product.accountId !== accountId || product.pantryId !== pantryId) return product;
      found = true;
      updatedProduct = { ...product, ...values };
      return updatedProduct;
    });
    if (!found) throw new Error('O produto não está disponível nesta despensa.');
    return { ...database, products };
  });
  return updatedProduct;
}

export async function deleteProduct({ accountId, pantryId, productId }) {
  await updateDatabase((database) => {
    assertPantry(database, accountId, pantryId);
    const product = database.products.find((item) =>
      item.id === productId && item.accountId === accountId && item.pantryId === pantryId);
    if (!product) throw new Error('O produto não está disponível nesta despensa.');
    return {
      ...database,
      products: database.products.filter((item) => item.id !== productId),
    };
  });
}

export async function importFiscalPurchase({ accountId, pantryId, products, purchase, qrFingerprint }) {
  await updateDatabase((database) => {
    assertPantry(database, accountId, pantryId);
    if (database.importedQrFingerprints.some((item) => item.accountId === accountId && item.qrFingerprint === qrFingerprint)) {
      throw new Error('DUPLICATE_FISCAL_NOTE');
    }
    return {
      ...database,
      products: [...database.products, ...products],
      purchases: [...database.purchases, purchase],
      importedQrFingerprints: [...database.importedQrFingerprints, { accountId, qrFingerprint, importedAt: new Date().toISOString() }],
    };
  });
}
