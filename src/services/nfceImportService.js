import * as Crypto from 'expo-crypto';
import { normalizeCep } from '../domain/locationValidation';
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from '../domain/productValidation';
import { extractPackageMeasure } from '../domain/packageMeasure';
import { groupFiscalItems } from '../domain/fiscalItems';
import { importFiscalPurchase } from '../repositories/productRepository';
import { extractSaoPauloNfce, isSaoPauloFiscalUrl } from '../integrations/nfce/spExtractor';

const rules = { bebidas: ['agua', 'suco', 'refrigerante', 'cerveja', 'leite', 'cafe'], organicos: ['arroz', 'feijao', 'aveia'], limpezaHigiene: ['sabao', 'detergente', 'shampoo', 'papel'], frescos: ['banana', 'tomate', 'alface', 'ovo', 'queijo'], carnes: ['carne', 'frango', 'peixe'], integraisCereais: ['integral', 'cereal', 'granola'] };
const normal = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function suggestCategory(name) { const text = normal(name); return Object.entries(rules).find(([, words]) => words.some((word) => text.includes(word)))?.[0] ?? 'outros'; }

export function extractNfceCode(qrUrl) {
  try {
    const value = new URL(qrUrl).searchParams.get('p');
    return value?.split('|', 1)[0]?.trim() || null;
  } catch {
    return null;
  }
}

export async function loadFiscalPurchase(qrUrl) {
  if (!isSaoPauloFiscalUrl(qrUrl)) throw new Error('INVALID_FISCAL_QR');
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(qrUrl, { signal: controller.signal, redirect: 'follow' });
    if (!response.ok) throw new Error('FISCAL_NETWORK_ERROR');
    const html = await response.text();
    if (html.length > 2_000_000) throw new Error('FISCAL_PAGE_TOO_LARGE');
    const purchase = extractSaoPauloNfce(html);
    return { ...purchase, qrCodeId: extractNfceCode(qrUrl), items: groupFiscalItems(purchase.items).map((item) => ({ ...item, ...extractPackageMeasure(item.sourceDescription), category: suggestCategory(item.sourceDescription), selected: true })) };
  } catch (error) {
    if (['INVALID_FISCAL_QR', 'UNSUPPORTED_FISCAL_PAGE', 'FISCAL_PAGE_TOO_LARGE'].includes(error.message)) throw error;
    throw new Error('FISCAL_NETWORK_ERROR');
  } finally { clearTimeout(timeout); }
}

export async function confirmFiscalPurchase({ accountId, pantryId, purchase, items, location, market }) {
  if (!purchase?.qrCodeId || purchase.qrCodeId.length > 44) throw new Error('INVALID_FISCAL_QR');
  let normalizedLocation;
  try {
    normalizedLocation = normalizeCep(location);
  } catch {
    throw new Error('INVALID_CEP');
  }
  const selected = items.filter((item) => item.selected);
  if (!selected.length) throw new Error('NO_FISCAL_ITEMS');
  if (selected.some((item) => item.weight != null && String(item.weight).trim() !== '' &&
    (!Number.isFinite(Number(item.weight)) || Number(item.weight) <= 0 || !PRODUCT_UNITS.includes(item.unit)))) throw new Error('INVALID_FISCAL_ITEM');
  if (selected.some((item) => !PRODUCT_CATEGORIES.includes(item.category) || !(Number(item.quantity) > 0) || !(Number(item.totalPrice) > 0))) throw new Error('INVALID_FISCAL_ITEM');
  if (selected.some((item) => !Number.isInteger(Number(item.quantity)) && !item.weight &&
    !({ g: true, kg: true, ml: true, l: true })[String(item.unitLabel ?? '').toLowerCase()])) throw new Error('INVALID_FISCAL_ITEM');
  const products = selected.map((item) => {
    const fiscalQuantity = Number(item.quantity);
    const fractionalSalesUnit = !Number.isInteger(fiscalQuantity);
    const unitLabel = String(item.unitLabel ?? '').toLowerCase();
    const mappedUnit = item.unit || (fractionalSalesUnit
      ? ({ g: 'g', kg: 'kg', ml: 'ml', l: 'L' })[unitLabel]
      : null);
    const contentValue = item.weight ? Number(item.weight) : fractionalSalesUnit ? fiscalQuantity : null;
    return {
      id: Crypto.randomUUID(), accountId, pantryId, name: item.sourceDescription.trim(),
      quantity: fractionalSalesUnit ? 1 : fiscalQuantity,
      unitPrice: Number(item.unitPrice) || Number(item.totalPrice) / fiscalQuantity,
      totalPrice: Number(item.totalPrice), priceType: 'unit', weight: contentValue,
      unit: contentValue == null ? null : mappedUnit, category: item.category,
      expirationDate: null, createdAt: new Date().toISOString(),
    };
  });
  const storedPurchase = { id: Crypto.randomUUID(), accountId, pantryId, source: 'nota_fiscal', market, purchasedAt: purchase.purchasedAt || new Date().toISOString(), location: normalizedLocation, totalPrice: purchase.totalAmount, qrCodeId: purchase.qrCodeId, items: selected.map((item, index) => ({ ...item, productId: products[index].id })) };
  await importFiscalPurchase({ accountId, pantryId, products, purchase: storedPurchase, qrCodeId: purchase.qrCodeId });
  return products;
}
