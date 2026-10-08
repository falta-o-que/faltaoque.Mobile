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

function getHistory(database, pantryId, location, marketId) {
  const purchases = new Map(database.purchases
    .filter((purchase) => purchase.pantry_id === pantryId && (marketId
      ? purchase.market_id === marketId
      : !location || purchase.location === location))
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

function comparableCategory(matches, item) {
  if (!item.category || item.category === 'outros') return matches;
  const sameCategory = matches.filter(({ product }) => product.category_name === item.category);
  return sameCategory.length ? sameCategory : matches;
}

function baseMeasure(value, unitId) {
  const amount = Number(value);
  if (!(amount > 0) || !Number.isFinite(amount)) return null;
  if (unitId === UNIT_IDS.kg) return amount * 1000;
  if (unitId === UNIT_IDS.L) return amount * 1000;
  if (unitId === UNIT_IDS.g || unitId === UNIT_IDS.ml) return amount;
  return null;
}

function sameUnit(matches, unit) {
  const unitId = UNIT_IDS[unit];
  return unitId ? matches.filter(({ product }) => product.unit_of_measure === unitId) : [];
}

function samePresentation(matches, item) {
  const plannedWeight = Number(item.weight);
  const plannedUnit = UNIT_IDS[item.unit];
  return matches.filter(({ product }) => {
    if (product.unit_of_measure !== plannedUnit) return false;
    const historyWeight = Number(product.content_value);
    return Number.isFinite(historyWeight) && Math.abs(historyWeight - plannedWeight) <= Math.max(0.01, plannedWeight * 0.02);
  });
}

function presentationKey({ product }) {
  return `${product.category_id ?? 'category-unknown'}:${product.unit_of_measure ?? 'unit-unknown'}:${product.content_value ?? 'size-unknown'}`;
}

function selectRepresentativePresentation(matches) {
  const groups = new Map();
  matches.forEach((observation) => {
    const key = presentationKey(observation);
    const group = groups.get(key) ?? [];
    group.push(observation);
    groups.set(key, group);
  });
  return [...groups.values()].sort((first, second) => {
    if (first.length !== second.length) return second.length - first.length;
    const firstDates = first.map((row) => String(row.purchasedAt ?? '')).sort();
    const secondDates = second.map((row) => String(row.purchasedAt ?? '')).sort();
    const firstRecent = firstDates[firstDates.length - 1] ?? '';
    const secondRecent = secondDates[secondDates.length - 1] ?? '';
    return secondRecent.localeCompare(firstRecent);
  })[0] ?? [];
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
  if (items.length === 0) return { estimatedPrice: null, matchedItems: 0, totalItems: 0, missingItems: [] };

  const categories = new Map((database.categories ?? []).map((category) => [category.id, category.name]));
  const history = getHistory(database, list.pantryId, list.location, list.marketId)
    .map((observation) => ({ ...observation, product: { ...observation.product,
      category_name: categories.get(observation.product.category_id) ?? null } }));
  let matchedItems = 0;
  let total = 0;
  const missingItems = [];
  items.forEach((item) => {
    const matches = comparableCategory(history.filter((observation) => matchesProduct(item, observation)), item);
    let unitPrice = null;
    if (item.weight != null && Number(item.weight) > 0 && UNIT_IDS[item.unit]) {
      const sameUnitHistory = sameUnit(matches, item.unit);
      const exactPresentation = samePresentation(sameUnitHistory, item);
      if (exactPresentation.length) {
        unitPrice = estimateUnitPrice(exactPresentation);
      } else {
        const measuredHistory = sameUnitHistory.filter(({ product }) => baseMeasure(product.content_value, product.unit_of_measure) != null);
        const perBaseMeasure = estimateUnitPrice(measuredHistory.map((observation) => ({
          ...observation,
          unitPrice: observation.unitPrice / baseMeasure(observation.product.content_value, observation.product.unit_of_measure),
        })));
        if (perBaseMeasure != null) unitPrice = perBaseMeasure * baseMeasure(item.weight, UNIT_IDS[item.unit]);
        else unitPrice = estimateUnitPrice(selectRepresentativePresentation(sameUnitHistory.length ? sameUnitHistory : matches));
      }
    } else {
      unitPrice = estimateUnitPrice(selectRepresentativePresentation(matches));
    }
    if (unitPrice == null) {
      missingItems.push(item.name);
      return;
    }
    matchedItems += 1;
    total += unitPrice * Number(item.quantity ?? 1);
  });

  return {
    estimatedPrice: matchedItems > 0 ? Math.round(total * 100) / 100 : null,
    matchedItems,
    totalItems: items.length,
    missingItems,
  };
}
