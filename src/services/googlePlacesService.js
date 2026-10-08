import * as Crypto from 'expo-crypto';
import { normalizeCep } from '../domain/locationValidation';

const API_ROOT = 'https://places.googleapis.com/v1';

function getApiKey() {
  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (!key) throw new Error('Adicione sua chave do Google Maps em .env.local e reinicie o Expo.');
  return key;
}

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const reason = payload.error?.details?.find((detail) => detail['@type']?.includes('ErrorInfo'))?.reason;
    if (reason === 'API_KEY_INVALID') {
      throw new Error('O Google recusou a chave. Confira o projeto, o Places API (New) e as restrições da chave.');
    }
    if (reason === 'SERVICE_DISABLED' || reason === 'API_KEY_SERVICE_BLOCKED') {
      throw new Error('Ative o Places API (New) no projeto associado à chave do Google Maps.');
    }
    if (reason === 'BILLING_DISABLED') {
      throw new Error('Ative o faturamento no projeto do Google Maps para consultar endereços.');
    }
    throw new Error('Não foi possível consultar endereços agora. Confira a chave e a configuração do Places API.');
  }
  return payload;
}

export async function searchPlaces(input, sessionToken) {
  if (input.trim().length < 3) return [];
  const response = await fetch(`${API_ROOT}/places:autocomplete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': getApiKey() },
    body: JSON.stringify({ input: input.trim(), languageCode: 'pt-BR', regionCode: 'BR', includedRegionCodes: ['BR'], sessionToken }),
  });
  const payload = await parseResponse(response);
  return (payload.suggestions ?? []).flatMap((suggestion) => {
    const place = suggestion.placePrediction;
    if (!place?.placeId) return [];
    return [{ placeId: place.placeId, title: place.structuredFormat?.mainText?.text ?? place.text?.text ?? '', subtitle: place.structuredFormat?.secondaryText?.text ?? '' }];
  });
}

export async function getPlaceDetails(placeId, sessionToken) {
  const response = await fetch(`${API_ROOT}/places/${encodeURIComponent(placeId)}?sessionToken=${encodeURIComponent(sessionToken)}`, {
    headers: { 'X-Goog-Api-Key': getApiKey(), 'X-Goog-FieldMask': 'addressComponents,location,formattedAddress' },
  });
  const place = await parseResponse(response);
  const cepComponent = place.addressComponents?.find((component) => component.types?.includes('postal_code'));
  let cep;
  try { cep = normalizeCep(cepComponent?.longText); } catch { throw new Error('Esse local não tem CEP disponível. Escolha outro resultado.'); }
  if (!Number.isFinite(place.location?.latitude) || !Number.isFinite(place.location?.longitude)) {
    throw new Error('O Google não retornou as coordenadas desse local. Escolha outro resultado.');
  }
  return { cep, latitude: place.location.latitude, longitude: place.location.longitude, formattedAddress: place.formattedAddress ?? '' };
}

export const createPlacesSessionToken = () => Crypto.randomUUID();
