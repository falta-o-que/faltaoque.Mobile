import * as Crypto from 'expo-crypto';
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from '../domain/productValidation';
import { extractPackageMeasure } from '../domain/packageMeasure';
import { groupFiscalItems } from '../domain/fiscalItems';
import { importFiscalPurchase } from '../repositories/productRepository';
import { extractSaoPauloNfce, isSaoPauloFiscalUrl } from '../integrations/nfce/spExtractor';

const rules = { bebidas: ['agua', 'suco', 'refrigerante', 'cerveja', 'leite', 'cafe'], organicos: ['arroz', 'feijao', 'aveia'], limpezaHigiene: ['sabao', 'detergente', 'shampoo', 'papel'], frescos: ['banana', 'tomate', 'alface', 'ovo', 'queijo'], carnes: ['carne', 'frango', 'peixe'], integraisCereais: ['integral', 'cereal', 'granola'] };
const normal = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function suggestCategory(name) { const text = normal(name); return Object.entries(rules).find(([, words]) => words.some((word) => text.includes(word)))?.[0] ?? 'outros'; }

export async function loadFiscalPurchase(qrUrl) {
  if (!isSaoPauloFiscalUrl(qrUrl)) throw new Error('INVALID_FISCAL_QR');
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(qrUrl, { signal: controller.signal, redirect: 'follow' });
    if (!response.ok) throw new Error('FISCAL_NETWORK_ERROR');
    const html = await response.text();
    if (html.length > 2_000_000) throw new Error('FISCAL_PAGE_TOO_LARGE');
    const purchase = extractSaoPauloNfce(html);
    return { ...purchase, qrFingerprint: await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, qrUrl), items: groupFiscalItems(purchase.items).map((item) => ({ ...item, ...extractPackageMeasure(item.sourceDescription), category: suggestCategory(item.sourceDescription), selected: true })) };
  } catch (error) {
    if (['INVALID_FISCAL_QR', 'UNSUPPORTED_FISCAL_PAGE', 'FISCAL_PAGE_TOO_LARGE'].includes(error.message)) throw error;
    throw new Error('FISCAL_NETWORK_ERROR');
  } finally { clearTimeout(timeout); }
}

export async function confirmFiscalPurchase({ accountId, pantryId, purchase, items }) {
  const selected = items.filter((item) => item.selected);
  if (!selected.length) throw new Error('NO_FISCAL_ITEMS');
  if (selected.some((item) => item.weight != null && String(item.weight).trim() !== '' &&
    (!Number.isFinite(Number(item.weight)) || Number(item.weight) <= 0 || !PRODUCT_UNITS.includes(item.unit)))) throw new Error('INVALID_FISCAL_ITEM');
  if (selected.some((item) => !PRODUCT_CATEGORIES.includes(item.category) || !(Number(item.quantity) > 0) || !(Number(item.totalPrice) > 0))) throw new Error('INVALID_FISCAL_ITEM');
  const products = selected.map((item) => ({ id: Crypto.randomUUID(), accountId, pantryId, name: item.sourceDescription.trim(), quantity: Number(item.quantity), unitPrice: Number(item.unitPrice) || Number(item.totalPrice) / Number(item.quantity), totalPrice: Number(item.totalPrice), priceType: 'unit', weight: item.weight ? Number(item.weight) : null, unit: item.weight ? item.unit : null, category: item.category, expirationDate: null, createdAt: new Date().toISOString() }));
  const storedPurchase = { id: Crypto.randomUUID(), accountId, pantryId, source: 'nota_fiscal', purchasedAt: purchase.purchasedAt || new Date().toISOString(), location: purchase.merchantName, totalPrice: purchase.totalAmount, items: selected.map((item, index) => ({ ...item, productId: products[index].id })) };
  await importFiscalPurchase({ accountId, pantryId, products, purchase: storedPurchase, qrFingerprint: purchase.qrFingerprint });
  return products;
}
