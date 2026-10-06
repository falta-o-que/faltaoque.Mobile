const UNIT_IDS = { g: 1, kg: 2, ml: 3, L: 4 };

const normalizeName = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').trim();

function nameSimilarity(first, second) {
  const firstTokens = new Set(normalizeName(first).split(' ').filter(Boolean));
  const secondTokens = new Set(normalizeName(second).split(' ').filter(Boolean));
  if (firstTokens.size === 0 || secondTokens.size === 0) return 0;
  const common = [...firstTokens].filter((token) => secondTokens.has(token)).length;
  return common / new Set([...firstTokens, ...secondTokens]).size;
}

function matchesName(plannedName, historicalName) {
  const plannedTokens = normalizeName(plannedName).split(' ').filter(Boolean);
  const historicalTokens = normalizeName(historicalName).split(' ').filter(Boolean);
  if (!plannedTokens.length || !historicalTokens.length) return false;
  if (nameSimilarity(plannedName, historicalName) >= 0.6) return true;

  const samePrimaryToken = plannedTokens[0] === historicalTokens[0];
  const smallerTokens = plannedTokens.length <= historicalTokens.length ? plannedTokens : historicalTokens;
  const largerTokens = new Set(plannedTokens.length <= historicalTokens.length ? historicalTokens : plannedTokens);
  const allSpecificTokensMatch = smallerTokens.every((token) => largerTokens.has(token));
  return samePrimaryToken && allSpecificTokensMatch;
}

function median(values) {
  const sorted = [...values].sort((first, second) => first - second);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function getHistory(database, pantryId) {
  const purchases = new Map(database.purchases
    .filter((purchase) => purchase.pantry_id === pantryId)
    .map((purchase) => [purchase.id, purchase]));

  return database.pantry_products.flatMap((product) => {
    const purchase = purchases.get(product.purchase_id);
    const quantity = Number(product.quantity);
    const price = Number(product.price);
    if (!purchase || !(quantity > 0) || !(price > 0) || !Number.isFinite(price)) return [];
    return [{ product, purchasedAt: purchase.purchase_date, unitPrice: price / quantity }];
  });
}

function matchesProduct(plannedItem, observation) {
  return matchesName(plannedItem.name, observation.product.name);
}

function preferSameMeasure(matches, item) {
  if (item.weight == null) return matches;
  const unitId = UNIT_IDS[item.unit];
  const plannedWeight = Number(item.weight);
  const sameMeasure = matches.filter(({ product }) => {
    if (product.unit_of_measure !== unitId) return false;
    const historyWeight = Number(product.content_value);
    return Number.isFinite(historyWeight) && Math.abs(historyWeight - plannedWeight) <= Math.max(0.01, plannedWeight * 0.02);
  });
  return sameMeasure.length ? sameMeasure : matches;
}

function estimateUnitPrice(observations) {
  const recentPrices = observations
    .sort((first, second) => String(second.purchasedAt).localeCompare(String(first.purchasedAt)))
    .slice(0, 3)
    .map((observation) => observation.unitPrice);
  return recentPrices.length ? median(recentPrices) : null;
}

export function estimateGroceryListPrices(database, list) {
  const items = list.items ?? [];
  if (items.length === 0) return { estimatedPrice: null, matchedItems: 0, totalItems: 0 };

  const history = getHistory(database, list.pantryId);
  let matchedItems = 0;
  let total = 0;
  items.forEach((item) => {
    const matches = history.filter((observation) => matchesProduct(item, observation));
    const comparableHistory = preferSameMeasure(matches, item);
    const unitPrice = estimateUnitPrice(comparableHistory);
    if (unitPrice == null) return;
    matchedItems += 1;
    total += unitPrice * Number(item.quantity ?? 1);
  });

  return {
    estimatedPrice: matchedItems > 0 ? Math.round(total * 100) / 100 : null,
    matchedItems,
    totalItems: items.length,
  };
}
