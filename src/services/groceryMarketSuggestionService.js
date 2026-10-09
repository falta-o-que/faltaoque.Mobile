import { normalizeCep } from '../domain/locationValidation';
import { GROCERY_SUGGESTION_TYPES } from '../domain/grocerySuggestionOptions';
import { readDatabase } from '../storage/localDatabase';
import { getUserErrorMessage } from '../utils/userErrors';
import { estimateGroceryListPrices } from './groceryPriceEstimateService';

const geocodeCache = new Map();

function normalizeName(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').trim();
}

function matchesProduct(plannedName, historicName) {
  const plannedTokens = normalizeName(plannedName).split(' ').filter(Boolean);
  const historicTokens = normalizeName(historicName).split(' ').filter(Boolean);
  if (!plannedTokens.length || !historicTokens.length) return false;
  const plannedSet = new Set(plannedTokens);
  const historicSet = new Set(historicTokens);
  const common = [...plannedSet].filter((token) => historicSet.has(token)).length;
  const similarity = common / new Set([...plannedSet, ...historicSet]).size;
  if (similarity >= 0.6) return true;
  const smaller = plannedTokens.length <= historicTokens.length ? plannedTokens : historicTokens;
  const larger = new Set(plannedTokens.length <= historicTokens.length ? historicTokens : plannedTokens);
  return plannedTokens[0] === historicTokens[0] && smaller.every((token) => larger.has(token));
}

function distanceKm(first, second) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const latitudeDifference = radians(second.latitude - first.latitude);
  const longitudeDifference = radians(second.longitude - first.longitude);
  const latitudeOne = radians(first.latitude);
  const latitudeTwo = radians(second.latitude);
  const haversine = Math.sin(latitudeDifference / 2) ** 2 + Math.cos(latitudeOne) * Math.cos(latitudeTwo)
    * Math.sin(longitudeDifference / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

async function geocodePantryCep(value) {
  let cep;
  try { cep = normalizeCep(value); } catch { return null; }
  if (!cep) return null;
  if (geocodeCache.has(cep)) return geocodeCache.get(cep);
  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (!key) throw new Error('Configure a Geocoding API no projeto Google Maps para calcular a proximidade.');
  const query = new URLSearchParams({ address: `${cep}, Brazil`, components: `postal_code:${cep}|country:BR`, key });
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${query.toString()}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.status !== 'OK' || !payload.results?.[0]?.geometry?.location) {
    if (String(payload.error_message ?? '').toLowerCase().includes('billing')) {
      throw new Error('Ative o faturamento no projeto Google Cloud associado à chave do Maps para calcular a proximidade.');
    }
    if (payload.status === 'REQUEST_DENIED' || payload.status === 'OVER_DAILY_LIMIT') {
      throw new Error('Ative a Geocoding API no projeto Google Maps para calcular a proximidade.');
    }
    if (payload.status === 'ZERO_RESULTS') throw new Error('O Google Maps não encontrou a localização da despensa.');
    throw new Error('Não foi possível obter as coordenadas da despensa pelo Maps.');
  }
  const { lat: latitude, lng: longitude } = payload.results[0].geometry.location;
  const coordinates = { latitude, longitude };
  geocodeCache.set(cep, coordinates);
  return coordinates;
}

function getMarketHistory(database, pantryId) {
  const purchases = database.purchases.filter((purchase) => purchase.pantry_id === pantryId && purchase.market_id);
  const purchaseById = new Map(purchases.map((purchase) => [purchase.id, purchase]));
  return database.pantry_products.flatMap((product) => {
    const purchase = purchaseById.get(product.purchase_id);
    if (!purchase) return [];
    return [{ product, marketId: purchase.market_id, brand: String(product.brand ?? '').trim() }];
  });
}

function getBrandPreferences(items, history) {
  const preferences = new Map();
  items.forEach((item, index) => {
    const counts = new Map();
    history.filter(({ product, brand }) => brand && matchesProduct(item.name, product.name))
      .forEach(({ brand }) => {
        const normalizedBrand = normalizeName(brand);
        counts.set(normalizedBrand, (counts.get(normalizedBrand) ?? 0) + 1);
      });
    if (!counts.size) return;
    const highestCount = Math.max(...counts.values());
    preferences.set(index, new Set([...counts].filter(([, count]) => count === highestCount).map(([brand]) => brand)));
  });
  return preferences;
}

function countPreferredBrands(items, history, preferences) {
  let available = 0;
  items.forEach((item, index) => {
    const preferredBrands = preferences.get(index);
    if (!preferredBrands) return;
    if (history.some(({ product, brand }) => brand && matchesProduct(item.name, product.name)
      && preferredBrands.has(normalizeName(brand)))) available += 1;
  });
  return { available, total: preferences.size };
}

function compareCoverageThenPrice(first, second) {
  if (first.estimate.matchedItems !== second.estimate.matchedItems) {
    return second.estimate.matchedItems - first.estimate.matchedItems;
  }
  return (first.estimate.estimatedPrice ?? Number.POSITIVE_INFINITY)
    - (second.estimate.estimatedPrice ?? Number.POSITIVE_INFINITY);
}

export async function getGroceryMarketSuggestions({ pantryId, pantryCep, list }) {
  const database = await readDatabase();
  const marketHistory = getMarketHistory(database, pantryId);
  const historicalMarketIds = new Set(marketHistory.map((observation) => observation.marketId));
  const markets = database.markets.filter((market) => historicalMarketIds.has(market.id));
  const candidates = markets.map((market) => ({
    market,
    estimate: estimateGroceryListPrices(database, { ...list, marketId: market.id, location: market.cep }),
  }));

  const bestValue = [...candidates].filter((candidate) => candidate.estimate.estimatedPrice != null)
    .sort(compareCoverageThenPrice)[0] ?? null;
  const preferences = getBrandPreferences(list.items ?? [], marketHistory);
  const bestBrands = [...candidates].map((candidate) => ({
    ...candidate,
    brandCoverage: countPreferredBrands(list.items ?? [], marketHistory.filter((row) => row.marketId === candidate.market.id), preferences),
  })).filter((candidate) => candidate.brandCoverage.total > 0)
    .sort((first, second) => second.brandCoverage.available - first.brandCoverage.available || compareCoverageThenPrice(first, second))[0] ?? null;

  let nearest = null;
  let nearestError = null;
  if (!pantryCep) {
    nearestError = 'Cadastre o endereço da despensa para encontrar o mercado mais perto.';
  } else {
    const locatedCandidates = candidates.filter(({ market }) => Number.isFinite(market.latitude) && Number.isFinite(market.longitude));
    if (!locatedCandidates.length) {
      nearestError = 'O histórico ainda não tem coordenadas de mercados para comparar.';
    } else {
      try {
        const pantryCoordinates = await geocodePantryCep(pantryCep);
        nearest = [...locatedCandidates].map((candidate) => ({
          ...candidate,
          distanceKm: distanceKm(pantryCoordinates, candidate.market),
        })).sort((first, second) => first.distanceKm - second.distanceKm)[0] ?? null;
      } catch (error) {
        nearestError = getUserErrorMessage(error, 'Não foi possível calcular a distância agora. Tente novamente mais tarde.');
      }
    }
  }

  const emptyEstimate = {
    estimatedPrice: null,
    matchedItems: 0,
    totalItems: list.items?.length ?? 0,
    missingItems: (list.items ?? []).map((item) => item.name),
  };
  return [
    { type: GROCERY_SUGGESTION_TYPES.NEAREST, candidate: nearest, disabled: !nearest, message: nearestError },
    { type: GROCERY_SUGGESTION_TYPES.BEST_VALUE, candidate: bestValue, disabled: !bestValue, message: bestValue ? null : 'Ainda não há histórico de preços para comparar os mercados.' },
    { type: GROCERY_SUGGESTION_TYPES.MOST_BOUGHT_BRANDS, candidate: bestBrands, disabled: !bestBrands, message: bestBrands ? null : 'Ainda não há histórico de marcas para comparar os mercados.' },
  ].map((option) => ({ ...option, candidate: option.candidate ?? { market: null, estimate: emptyEstimate } }));
}
