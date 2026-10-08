import * as Crypto from 'expo-crypto';
import { normalizeCep } from '../domain/locationValidation';

function normalizeCoordinates(latitude, longitude) {
  if (latitude == null && longitude == null) return { latitude: null, longitude: null };
  const normalizedLatitude = Number(latitude);
  const normalizedLongitude = Number(longitude);
  if (!Number.isFinite(normalizedLatitude) || normalizedLatitude < -90 || normalizedLatitude > 90 ||
    !Number.isFinite(normalizedLongitude) || normalizedLongitude < -180 || normalizedLongitude > 180) {
    throw new Error('As coordenadas do mercado são inválidas.');
  }
  return { latitude: normalizedLatitude, longitude: normalizedLongitude };
}

export function findOrCreateLocalMarket(markets, marketInput) {
  if (!marketInput) return { markets, marketId: null };
  if (marketInput.id && markets.some((market) => market.id === marketInput.id)) {
    const nextMarkets = marketInput.localName ? markets.map((market) => market.id === marketInput.id
      ? { ...market, local_name: marketInput.localName } : market) : markets;
    return { markets: nextMarkets, marketId: marketInput.id };
  }

  const cep = normalizeCep(marketInput.cep ?? marketInput.location);
  if (!cep) throw new Error('Informe um CEP válido para o mercado.');
  const { latitude, longitude } = normalizeCoordinates(marketInput.latitude, marketInput.longitude);
  const existing = markets.find((market) => market.cep === cep &&
    market.latitude === latitude && market.longitude === longitude);
  if (existing) {
    const nextMarkets = marketInput.localName && existing.local_name !== marketInput.localName
      ? markets.map((market) => market.id === existing.id ? { ...market, local_name: marketInput.localName } : market)
      : markets;
    return { markets: nextMarkets, marketId: existing.id };
  }

  const market = { id: Crypto.randomUUID(), cep, latitude, longitude, local_name: marketInput.localName ?? null };
  return { markets: [...markets, market], marketId: market.id };
}
