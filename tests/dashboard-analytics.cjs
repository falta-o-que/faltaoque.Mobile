const assert = require('node:assert/strict');
const {createHarness} = require('./local-test-harness.cjs');

const h = createHarness();
const {buildDashboard, getDashboardFilters} = h.load('src/domain/dashboardAnalytics.js');
const now = new Date(2026, 10, 7, 12);

function product(id, name, quantity, total, category, contentValue = null, unitId = null) {
  return {id, name, quantity, total, category, contentValue, unitId};
}

function purchase(id, date, total, marketId, marketName, products) {
  return {id, date, total, marketId, marketName, products};
}

const records = [
  purchase('nov-a', '2026-11-07', 120, 'market-a', 'Atacarejo', [
    product('coffee-a', 'Café', 2, 30, 'bebidas', 500, 1),
    product('rice-a', 'Arroz', 1, 50, 'integraisCereais', 5, 2),
  ]),
  purchase('nov-b', '2026-11-07', 40, 'market-b', 'Mercado do Bairro', [
    product('coffee-b', 'Café', 1, 17, 'bebidas', 500, 1),
    product('other-b', 'Produto sem categoria', 1, 7, 'outros'),
  ]),
  purchase('oct-start', '2026-10-09', 25, 'market-a', 'Atacarejo', [
    product('coffee-start', 'Café', 1, 11, 'bebidas', 500, 1),
    product('meat-start', 'Frango', 1, 14, 'carnes'),
  ]),
  purchase('oct-outside-30d', '2026-10-08', 90, 'market-a', 'Atacarejo', [
    product('coffee-old', 'Café', 1, 10, 'bebidas', 500, 1),
  ]),
  purchase('sep-boundary', '2026-09-01', 20, 'market-b', 'Mercado do Bairro', [
    product('organic-sep', 'Banana orgânica', 1, 20, 'organicos'),
  ]),
  purchase('six-month-boundary', '2026-06-01', 7, null, null, [
    product('fresh-jun', 'Tomate', 1, 7, 'frescos'),
  ]),
  purchase('outside-six-months', '2026-05-31', 500, null, null, [
    product('old-jun', 'Item antigo', 1, 500, 'outros'),
  ]),
];

function closeTo(actual, expected, message) {
  assert.ok(Math.abs(actual - expected) < 0.000001, `${message}: expected ${expected}, received ${actual}`);
}

async function main() {
  const thirtyDays = buildDashboard(records, {
    period: '30d', marketId: null, productId: 'cafe|500|1', now, locale: 'pt-BR',
  });
  assert.equal(thirtyDays.purchaseCount, 3, '30-day period includes its start day and excludes the prior day');
  assert.equal(thirtyDays.total, 185);
  assert.equal(thirtyDays.monthTotal, 160, 'monthly KPI is independent from the selected chart period');
  assert.equal(thirtyDays.previousMonthTotal, 115);
  closeTo(thirtyDays.monthChangePercent, ((160 - 115) / 115) * 100, 'month-over-month change');
  assert.equal(thirtyDays.latest.date.toISOString().slice(0, 10), '2026-11-07');
  assert.equal(thirtyDays.expenses.length, 2, '30-day expenses are grouped into Monday-starting weeks');
  assert.equal(thirtyDays.expenses.reduce((sum, item) => sum + item.total, 0), 185);

  const categoryValues = Object.fromEntries(thirtyDays.categories.map((item) => [item.name, item.value]));
  assert.equal(categoryValues.bebidas, 58);
  assert.equal(categoryValues.integraisCereais, 50);
  assert.equal(categoryValues.outros, 7);
  assert.equal(categoryValues.organicos, 0, 'categories without spend remain available to the chart legend');
  assert.equal(thirtyDays.categories.length, 7);
  closeTo(thirtyDays.categories.reduce((sum, item) => sum + item.percent, 0), 1, 'category percentages sum to 100%');
  assert.equal(thirtyDays.categoryTotal, 129, 'category totals are based on purchased product rows');

  assert.equal(thirtyDays.prices.length, 2, 'same-day price observations collapse into one chart point');
  assert.deepEqual(thirtyDays.prices.map((item) => item.price), [11, 16]);
  assert.deepEqual(thirtyDays.prices[1].marketNames, ['Atacarejo', 'Mercado do Bairro']);
  closeTo(thirtyDays.priceChangePercent, (5 / 11) * 100, 'product price change uses first and last averaged observations');
  assert.ok(thirtyDays.priceHighlights.some((item) => item.name === 'Café' && item.changePercent > 0));

  const threeMonths = buildDashboard(records, {period: '3m', now, locale: 'pt-BR'});
  assert.equal(threeMonths.purchaseCount, 5, 'three-month period starts on the first day two months earlier');
  assert.equal(threeMonths.total, 295);
  assert.equal(threeMonths.expenses.length, 3, 'three-month expenses are grouped by calendar month');

  const sixMonths = buildDashboard(records, {period: '6m', now, locale: 'pt-BR'});
  assert.equal(sixMonths.purchaseCount, 6, 'six-month period includes the first day of its starting month');
  assert.equal(sixMonths.total, 302);
  assert.equal(sixMonths.expenses.length, 4);

  const market = buildDashboard(records, {period: '30d', marketId: 'market-a', now});
  assert.equal(market.purchaseCount, 2);
  assert.equal(market.total, 145);
  assert.equal(market.latest.marketName, 'Atacarejo');
  assert.equal(market.monthTotal, 120);

  const noResults = buildDashboard(records, {period: '30d', marketId: 'missing', productId: 'missing', now});
  assert.equal(noResults.purchaseCount, 0);
  assert.equal(noResults.total, 0);
  assert.equal(noResults.latest, null);
  assert.deepEqual(noResults.expenses, []);
  assert.deepEqual(noResults.prices, []);
  assert.equal(noResults.categories.length, 7);
  assert.ok(noResults.categories.every((item) => item.value === 0 && item.percent === 0));
  assert.equal(noResults.monthChangePercent, null);

  const filters = getDashboardFilters(records);
  assert.deepEqual(filters.markets.map((item) => item.name), ['Atacarejo', 'Mercado do Bairro']);
  assert.equal(filters.products.filter((item) => item.key === 'cafe|500|1').length, 1, 'filters deduplicate product names regardless of accents/case normalization');
  assert.ok(filters.products.some((item) => item.name === 'Item antigo'), 'product filters are sourced from all history, not only the selected period');

  console.log('dashboard-analytics tests passed');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
