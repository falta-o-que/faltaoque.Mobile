import { readDatabase, updateDatabase, getCategoryId, resolveCategory } from '../storage/localDatabase';

const UNIT_BY_ID = { 1: 'g', 2: 'kg', 3: 'ml', 4: 'L' };
const UNIT_ID = { g: 1, kg: 2, ml: 3, L: 4 };

function assertPantry(database, accountId, pantryId) {
  if (!accountId || !database.users_pantries.some((item) => item.user_id === accountId && item.pantry_id === pantryId)) {
    throw new Error('Esta despensa não está disponível para sua conta.');
  }
}

function toProductView(database, row, accountId) {
  const purchase = database.purchases.find((entry) => entry.id === row.purchase_id);
  return {
    id: row.id, name: row.name, quantity: row.current_quantity, purchasedQuantity: row.quantity,
    unitPrice: row.quantity ? Number(row.price ?? 0) / row.quantity : 0, totalPrice: Number(row.price ?? 0),
    priceType: 'total', weight: row.content_value, unit: UNIT_BY_ID[row.unit_of_measure] ?? null,
    category: resolveCategory(database, row.category_id)?.name ?? 'outros', expirationDate: row.expiration_date,
    accountId, pantryId: purchase?.pantry_id, createdAt: purchase?.purchase_date,
  };
}

function toPurchaseRow(purchase) {
  return {
    id: purchase.id, title: purchase.title ?? (purchase.source === 'nota_fiscal' ? 'Nota fiscal' : 'Compra manual'),
    location: purchase.location && purchase.location.length <= 8 ? purchase.location : null,
    purchase_date: String(purchase.purchasedAt ?? new Date().toISOString()).slice(0, 10),
    total_price: Number(purchase.totalPrice ?? 0), total_products: purchase.items?.length ?? 1,
    is_finished: true, finish_date: String(purchase.purchasedAt ?? new Date().toISOString()).slice(0, 10),
    qr_code_id: purchase.qrCodeId ?? null, pantry_id: purchase.pantryId,
  };
}

function toProductRow(database, product, purchaseId) {
  return {
    id: product.id, name: product.name, quantity: Number(product.quantity), current_quantity: Number(product.quantity),
    is_in_pantry: Number(product.quantity) > 0, content_value: product.weight ?? null,
    unit_of_measure: UNIT_ID[product.unit] ?? null, price: Number(product.totalPrice ?? 0), brand: product.brand ?? null,
    expiration_date: product.expirationDate ?? null, finish_date: null, is_deleted: false,
    purchase_id: purchaseId, category_id: getCategoryId(database, product.category),
  };
}

export async function listProductsByPantry(accountId, pantryId) {
  const database = await readDatabase();
  assertPantry(database, accountId, pantryId);
  return database.pantry_products
    .filter((row) => !row.is_deleted && database.purchases.some((purchase) => purchase.id === row.purchase_id && purchase.pantry_id === pantryId))
    .map((row) => toProductView(database, row, accountId));
}

export async function createProductWithPurchase(product, purchase) {
  await updateDatabase((database) => {
    assertPantry(database, product.accountId, product.pantryId);
    const purchaseRow = toPurchaseRow(purchase);
    return {
      ...database, purchases: [...database.purchases, purchaseRow],
      pantry_products: [...database.pantry_products, toProductRow(database, product, purchase.id)],
    };
  });
  return product;
}

export async function updateProductQuantity({ accountId, pantryId, productId, quantity }) {
  let updatedProduct;
  await updateDatabase((database) => {
    assertPantry(database, accountId, pantryId);
    let found = false;
    const pantry_products = database.pantry_products.map((row) => {
      const purchase = database.purchases.find((entry) => entry.id === row.purchase_id);
      if (row.id !== productId || row.is_deleted || purchase?.pantry_id !== pantryId) return row;
      found = true;
      const updated = { ...row, current_quantity: quantity, is_in_pantry: quantity > 0 };
      updatedProduct = toProductView(database, updated, accountId);
      return updated;
    });
    if (!found) throw new Error('O produto não está disponível nesta despensa.');
    return { ...database, pantry_products };
  });
  return updatedProduct;
}

export async function updateProduct({ accountId, pantryId, productId, values }) {
  let updatedProduct;
  await updateDatabase((database) => {
    assertPantry(database, accountId, pantryId);
    let found = false;
    const pantry_products = database.pantry_products.map((row) => {
      const purchase = database.purchases.find((entry) => entry.id === row.purchase_id);
      if (row.id !== productId || row.is_deleted || purchase?.pantry_id !== pantryId) return row;
      found = true;
      const updated = {
        ...row, name: values.name, current_quantity: values.quantity,
        is_in_pantry: Number(values.quantity) > 0, content_value: values.weight ?? null,
        unit_of_measure: UNIT_ID[values.unit] ?? null, price: values.totalPrice,
        expiration_date: values.expirationDate ?? null, category_id: getCategoryId(database, values.category),
      };
      updatedProduct = toProductView(database, updated, accountId);
      return updated;
    });
    if (!found) throw new Error('O produto não está disponível nesta despensa.');
    return { ...database, pantry_products };
  });
  return updatedProduct;
}

export async function deleteProduct({ accountId, pantryId, productId }) {
  await updateDatabase((database) => {
    assertPantry(database, accountId, pantryId);
    const product = database.pantry_products.find((row) => {
      const purchase = database.purchases.find((entry) => entry.id === row.purchase_id);
      return row.id === productId && !row.is_deleted && purchase?.pantry_id === pantryId;
    });
    if (!product) throw new Error('O produto não está disponível nesta despensa.');
    return { ...database, pantry_products: database.pantry_products.map((row) => row.id === productId
      ? { ...row, is_deleted: true, is_in_pantry: false } : row) };
  });
}

export async function importFiscalPurchase({ accountId, pantryId, products, purchase, qrCodeId }) {
  await updateDatabase((database) => {
    assertPantry(database, accountId, pantryId);
    if (qrCodeId && database.purchases.some((row) => row.pantry_id === pantryId && row.qr_code_id === qrCodeId)) {
      throw new Error('DUPLICATE_FISCAL_NOTE');
    }
    const purchaseRow = toPurchaseRow({ ...purchase, qrCodeId });
    return {
      ...database, purchases: [...database.purchases, purchaseRow],
      pantry_products: [...database.pantry_products, ...products.map((product) => toProductRow(database, product, purchase.id))],
    };
  });
}
