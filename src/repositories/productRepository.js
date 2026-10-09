import { readDatabase, updateDatabase, getCategoryId, resolveCategory } from '../storage/localDatabase';
import { normalizeCep } from '../domain/locationValidation';
import { getProductPresentationKey, normalizeProductIdentity as normalizeBrandIdentity } from '../domain/pantryProductGrouping';
import { findOrCreateLocalMarket } from './marketRepository';

const UNIT_BY_ID = { 1: 'g', 2: 'kg', 3: 'ml', 4: 'L' };
const UNIT_ID = { g: 1, kg: 2, ml: 3, L: 4 };

function normalizeIdentity(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ').trim().toLowerCase();
}

function packageKey(product = {}) {
  const amountValue = product.weight ?? product.contentValue ?? product.content_value;
  if (amountValue == null || amountValue === '') return 'none';
  const amount = Number(amountValue);
  if (!Number.isFinite(amount) || amount <= 0) return 'invalid';
  const unit = product.unit ?? product.unitOfMeasure ?? product.unit_of_measure;
  if (unit === 'kg' || unit === 'g') return `mass:${amount * (unit === 'kg' ? 1000 : 1)}`;
  if (unit === 'L' || unit === 'ml') return `volume:${amount * (unit === 'L' ? 1000 : 1)}`;
  return `invalid:${unit ?? 'none'}`;
}

function assertPantry(database, accountId, pantryId) {
  if (!accountId || !database.users_pantries.some((item) => item.user_id === accountId && item.pantry_id === pantryId)) {
    throw new Error('Esta despensa não está disponível para sua conta.');
  }
}

export async function assertFiscalNoteUnused({ accountId, pantryId, qrCodeId }) {
  const database = await readDatabase();
  assertPantry(database, accountId, pantryId);
  const normalizedQrCodeId = String(qrCodeId ?? '').trim();
  if (!normalizedQrCodeId) throw new Error('INVALID_FISCAL_QR');
  if (database.purchases.some((row) => row.pantry_id === pantryId &&
    String(row.qr_code_id ?? '').trim() === normalizedQrCodeId)) {
    throw new Error('DUPLICATE_FISCAL_NOTE');
  }
}

function toProductView(database, row, accountId) {
  const purchase = database.purchases.find((entry) => entry.id === row.purchase_id);
  return {
    id: row.id, name: row.name, quantity: row.current_quantity, purchasedQuantity: row.quantity,
    unitPrice: row.quantity ? Number(row.price ?? 0) / row.quantity : 0, totalPrice: Number(row.price ?? 0),
    priceType: 'total', weight: row.content_value, unit: UNIT_BY_ID[row.unit_of_measure] ?? null,
    brand: String(row.brand ?? '').trim() || null,
    category: resolveCategory(database, row.category_id)?.name ?? 'outros', expirationDate: row.expiration_date,
    accountId, pantryId: purchase?.pantry_id, createdAt: purchase?.purchase_date,
    purchaseId: purchase?.id ?? null,
    marketId: purchase?.market_id ?? null,
    location: database.markets.find((market) => market.id === purchase?.market_id)?.cep ?? purchase?.location ?? null,
  };
}

function productGroupKey(product, groupBrands) {
  const brand = groupBrands ? '' : `:${normalizeBrandIdentity(product.brand) || 'sem-marca'}`;
  return `${getProductPresentationKey(product)}${brand}`;
}

function compareOccurrenceAge(first, second) {
  return String(first.createdAt ?? '').localeCompare(String(second.createdAt ?? ''));
}

function groupProductOccurrences(occurrences, brandGroupingByPresentation = {}) {
  const groups = new Map();
  occurrences.forEach((product) => {
    const groupBrands = brandGroupingByPresentation[getProductPresentationKey(product)] === 'grouped';
    const key = productGroupKey(product, groupBrands);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(product);
  });

  return [...groups.entries()].map(([key, entries]) => {
    const groupBrands = brandGroupingByPresentation[getProductPresentationKey(entries[0])] === 'grouped';
    const ordered = [...entries].sort(compareOccurrenceAge);
    const latest = ordered[ordered.length - 1];
    const brands = [...new Set(ordered.map((entry) => entry.brand || null))];
    const purchasedQuantity = ordered.reduce((total, entry) => total + Number(entry.purchasedQuantity ?? 0), 0);
    const totalPrice = ordered.reduce((total, entry) => total + Number(entry.totalPrice ?? 0), 0);
    const expirationDates = ordered.map((entry) => entry.expirationDate).filter(Boolean).sort();
    const name = groupBrands
      ? latest.name
      : `${latest.name} · ${latest.brand || 'Sem marca'}`;
    return {
      ...latest,
      id: `product-group:${key}`,
      name,
      baseName: latest.name,
      brand: brands.length === 1 ? brands[0] : null,
      brands,
      quantity: ordered.reduce((total, entry) => total + Number(entry.quantity ?? 0), 0),
      purchasedQuantity,
      unitPrice: latest.unitPrice,
      totalPrice,
      expirationDate: expirationDates[0] ?? null,
      occurrenceIds: ordered.map((entry) => entry.id),
      occurrenceCount: ordered.length,
      primaryOccurrence: latest,
      groupedBrands: groupBrands,
    };
  });
}

function toPurchaseRow(purchase, marketId) {
  return {
    id: purchase.id, title: purchase.title ?? (purchase.source === 'nota_fiscal' ? 'Nota fiscal' : 'Compra manual'),
    location: normalizeCep(purchase.location), market_id: marketId,
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

export async function listProductOccurrences(accountId, pantryId) {
  const database = await readDatabase();
  assertPantry(database, accountId, pantryId);
  return database.pantry_products
    .filter((row) => !row.is_deleted && database.purchases.some((purchase) => purchase.id === row.purchase_id && purchase.pantry_id === pantryId))
    .map((row) => toProductView(database, row, accountId));
}

export async function listProductsByPantry(accountId, pantryId, { brandGroupingByPresentation = {} } = {}) {
  const occurrences = await listProductOccurrences(accountId, pantryId);
  return groupProductOccurrences(occurrences, brandGroupingByPresentation);
}

export async function createProductWithPurchase(product, purchase) {
  await updateDatabase((database) => {
    assertPantry(database, product.accountId, product.pantryId);
    const resolvedMarket = findOrCreateLocalMarket(database.markets,
      purchase.market ?? (purchase.location ? { cep: purchase.location } : null));
    const purchaseRow = toPurchaseRow(purchase, resolvedMarket.marketId);
    return {
      ...database, markets: resolvedMarket.markets, purchases: [...database.purchases, purchaseRow],
      pantry_products: [...database.pantry_products, toProductRow(database, product, purchase.id)],
    };
  });
  return product;
}

export async function updateProductQuantity({ accountId, pantryId, productId, productIds, quantity }) {
  await updateDatabase((database) => {
    assertPantry(database, accountId, pantryId);
    const requestedIds = [...new Set((Array.isArray(productIds) && productIds.length ? productIds : [productId]).filter(Boolean))];
    const candidates = database.pantry_products.filter((row) => {
      const purchase = database.purchases.find((entry) => entry.id === row.purchase_id);
      return requestedIds.includes(row.id) && !row.is_deleted && purchase?.pantry_id === pantryId;
    });
    if (candidates.length !== requestedIds.length) throw new Error('O produto não está disponível nesta despensa.');

    const identityKeys = new Set(candidates.map((row) => `${normalizeIdentity(row.name)}:${packageKey({
      weight: row.content_value, unit: UNIT_BY_ID[row.unit_of_measure] ?? null,
    })}`));
    if (identityKeys.size !== 1) throw new Error('Produtos de nomes ou tamanhos diferentes não podem compartilhar o mesmo saldo.');

    const currentTotal = candidates.reduce((total, row) => total + Number(row.current_quantity ?? 0), 0);
    const changes = new Map(candidates.map((row) => [row.id, Number(row.current_quantity ?? 0)]));
    if (quantity < currentTotal) {
      let remaining = currentTotal - quantity;
      [...candidates].sort((first, second) => {
        const firstPurchase = database.purchases.find((entry) => entry.id === first.purchase_id);
        const secondPurchase = database.purchases.find((entry) => entry.id === second.purchase_id);
        return String(firstPurchase?.purchase_date ?? '').localeCompare(String(secondPurchase?.purchase_date ?? ''));
      }).forEach((row) => {
        if (remaining <= 0) return;
        const available = changes.get(row.id);
        const consumed = Math.min(available, remaining);
        changes.set(row.id, available - consumed);
        remaining -= consumed;
      });
    } else if (quantity > currentTotal) {
      const latest = [...candidates].sort((first, second) => {
        const firstPurchase = database.purchases.find((entry) => entry.id === first.purchase_id);
        const secondPurchase = database.purchases.find((entry) => entry.id === second.purchase_id);
        return String(secondPurchase?.purchase_date ?? '').localeCompare(String(firstPurchase?.purchase_date ?? ''));
      })[0];
      changes.set(latest.id, changes.get(latest.id) + quantity - currentTotal);
    }

    const pantry_products = database.pantry_products.map((row) => changes.has(row.id)
      ? { ...row, current_quantity: changes.get(row.id), is_in_pantry: changes.get(row.id) > 0 }
      : row);
    return { ...database, pantry_products };
  });
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
    if (qrCodeId && database.purchases.some((row) => row.pantry_id === pantryId &&
      String(row.qr_code_id ?? '').trim() === String(qrCodeId).trim())) {
      throw new Error('DUPLICATE_FISCAL_NOTE');
    }
    const resolvedMarket = findOrCreateLocalMarket(database.markets,
      purchase.market ?? (purchase.location ? { cep: purchase.location } : null));
    const purchaseRow = toPurchaseRow({ ...purchase, qrCodeId }, resolvedMarket.marketId);
    return {
      ...database, markets: resolvedMarket.markets, purchases: [...database.purchases, purchaseRow],
      pantry_products: [...database.pantry_products, ...products.map((product) => toProductRow(database, product, purchase.id))],
    };
  });
}
