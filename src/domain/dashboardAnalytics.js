import { PRODUCT_CATEGORIES } from './productValidation';

const UNIT_BY_ID = { 1: 'g', 2: 'kg', 3: 'ml', 4: 'L' };
const DAY = 24 * 60 * 60 * 1000;

export const DASHBOARD_PERIODS = ['30d', '3m', '6m'];

function dateValue(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  const date = new Date(`${value.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function periodBounds(period, now) {
  const end = startOfDay(now);
  const start = new Date(end);
  if (period === '3m') start.setMonth(start.getMonth() - 2, 1);
  else if (period === '6m') start.setMonth(start.getMonth() - 5, 1);
  else start.setDate(start.getDate() - 29);
  return { start, end };
}

function within(date, start, end) {
  const value = date?.getTime();
  return Number.isFinite(value) && value >= start.getTime() && value < end.getTime() + DAY;
}

function productKey(product) {
  const name = String(product.name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
  return `${name}|${product.contentValue ?? ''}|${product.unitId ?? ''}`;
}

function bucketKey(date, period) {
  if (period !== '30d') return `${date.getFullYear()}-${date.getMonth()}`;
  if (period === '30d') {
    const week = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    week.setDate(week.getDate() - ((week.getDay() + 6) % 7));
    return `${week.getFullYear()}-${week.getMonth()}-${week.getDate()}`;
  }
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function bucketLabel(date, period, locale) {
  if (period !== '30d') return new Intl.DateTimeFormat(locale, { month: 'short' }).format(date).replace('.', '');
  if (period === '30d') return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(date);
  return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date).replace('.', '');
}

export function getDashboardFilters(records) {
  const markets = new Map();
  const products = new Map();
  records.forEach((purchase) => {
    if (purchase.marketId && purchase.marketName) markets.set(purchase.marketId, { id: purchase.marketId, name: purchase.marketName });
    purchase.products.forEach((product) => {
      if (product.quantity > 0) {
        const key = productKey(product);
        if (!products.has(key)) products.set(key, { key, name: product.name, contentValue: product.contentValue, unit: UNIT_BY_ID[product.unitId] || null });
      }
    });
  });
  return { markets: [...markets.values()].sort((a, b) => a.name.localeCompare(b.name)), products: [...products.values()].sort((a, b) => a.name.localeCompare(b.name)) };
}

export function buildDashboard(records, { period = '30d', marketId = null, productId = null, now = new Date(), locale = 'pt-BR' } = {}) {
  const { start, end } = periodBounds(period, now);
  const marketPurchases = records.filter((purchase) => !marketId || purchase.marketId === marketId);
  const selected = marketPurchases.filter((purchase) => within(dateValue(purchase.date), start, end));
  const total = (items) => items.reduce((sum, purchase) => sum + purchase.total, 0);
  const purchaseTotal = total(selected);
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const currentMonthPurchases = marketPurchases.filter((purchase) => within(dateValue(purchase.date), currentMonthStart, startOfDay(now)));
  const previousMonthPurchases = marketPurchases.filter((purchase) => {
    const date = dateValue(purchase.date);
    return date && date >= previousMonthStart && date < currentMonthStart;
  });
  const monthTotal = total(currentMonthPurchases);
  const previousMonthTotal = total(previousMonthPurchases);
  const monthChangePercent = previousMonthTotal > 0 ? ((monthTotal - previousMonthTotal) / previousMonthTotal) * 100 : null;
  const latest = marketPurchases
    .filter((purchase) => dateValue(purchase.date))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] || null;

  const buckets = new Map();
  selected.forEach((purchase) => {
    const date = dateValue(purchase.date);
    if (!date) return;
    const key = bucketKey(date, period);
    const current = buckets.get(key) || { key, date, total: 0 };
    current.total += purchase.total;
    if (date > current.date) current.date = date;
    buckets.set(key, current);
  });
  const expenses = [...buckets.values()].sort((a, b) => a.date - b.date).map((item) => ({ ...item, label: bucketLabel(item.date, period, locale) }));

  const categories = new Map();
  selected.forEach((purchase) => purchase.products.forEach((product) => {
    if (product.total > 0) categories.set(product.category, (categories.get(product.category) || 0) + product.total);
  }));
  const categoryTotals = PRODUCT_CATEGORIES
    .map((name) => ({ name, value: categories.get(name) || 0 }))
    .sort((a, b) => b.value - a.value);
  const categoryTotal = categoryTotals.reduce((sum, item) => sum + item.value, 0);

  const pricePoints = [];
  if (productId) marketPurchases.forEach((purchase) => {
    const date = dateValue(purchase.date);
    if (!within(date, start, end)) return;
    purchase.products.filter((product) => productKey(product) === productId && product.quantity > 0 && product.total > 0).forEach((product) => {
      pricePoints.push({ date, price: product.total / product.quantity, marketName: purchase.marketName });
    });
  });
  const byDate = new Map();
  pricePoints.forEach((point) => {
    const key = point.date.toISOString().slice(0, 10);
    const group = byDate.get(key) || { date: point.date, prices: [], marketNames: new Set() };
    group.prices.push(point.price);
    if (point.marketName) group.marketNames.add(point.marketName);
    byDate.set(key, group);
  });
  const prices = [...byDate.values()].sort((a, b) => a.date - b.date).map((group) => ({
    date: group.date,
    label: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(group.date).replace('.', ''),
    price: group.prices.reduce((sum, value) => sum + value, 0) / group.prices.length,
    marketNames: [...group.marketNames],
  }));
  const priceChangePercent = prices.length > 1 && prices[0].price > 0
    ? ((prices[prices.length - 1].price - prices[0].price) / prices[0].price) * 100
    : null;

  const priceHistory = new Map();
  marketPurchases.forEach((purchase) => {
    const date = dateValue(purchase.date);
    if (!within(date, start, end)) return;
    purchase.products.forEach((product) => {
      if (product.quantity <= 0 || product.total <= 0) return;
      const key = productKey(product);
      const history = priceHistory.get(key) || { key, name: product.name, contentValue: product.contentValue, unit: UNIT_BY_ID[product.unitId] || null, points: [] };
      history.points.push({ date, price: product.total / product.quantity });
      priceHistory.set(key, history);
    });
  });
  const priceHighlights = [...priceHistory.values()].map((item) => {
    const byDay = new Map();
    item.points.forEach((point) => {
      const key = point.date.toISOString().slice(0, 10);
      const values = byDay.get(key) || [];
      values.push(point.price);
      byDay.set(key, values);
    });
    const sorted = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, values]) => values.reduce((sum, value) => sum + value, 0) / values.length);
    const first = sorted[0];
    const latestPrice = sorted[sorted.length - 1];
    const changePercent = sorted.length > 1 && first > 0 ? ((latestPrice - first) / first) * 100 : null;
    return { key: item.key, name: item.name, contentValue: item.contentValue, unit: item.unit, latestPrice, changePercent };
  }).filter((item) => item.changePercent != null && Math.abs(item.changePercent) >= 5)
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 3);

  return {
    total: purchaseTotal,
    monthTotal,
    previousMonthTotal,
    monthChangePercent,
    purchaseCount: selected.length,
    latest: latest ? { date: dateValue(latest.date), total: latest.total, marketName: latest.marketName } : null,
    expenses,
    categories: categoryTotals.map((item) => ({ ...item, percent: categoryTotal ? item.value / categoryTotal : 0 })),
    categoryTotal,
    prices,
    priceChangePercent,
    priceHighlights,
  };
}
