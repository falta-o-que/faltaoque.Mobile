import * as Crypto from 'expo-crypto';
import { normalizeCep } from '../domain/locationValidation';

import {
  createPantry as savePantry,
  listPantriesByAccountId,
  updatePantryLocation as savePantryLocation,
} from '../repositories/pantryRepository';

export async function listPantries(accountId) {
  if (!accountId) return [];

  return listPantriesByAccountId(accountId);
}

export async function createPantry({ accountId, color, name, location, locationName }) {
  const normalizedName = name?.trim();

  if (!accountId) {
    throw new Error('UNAUTHENTICATED');
  }

  if (!normalizedName) {
    throw new Error('INVALID_PANTRY_NAME');
  }
  if (normalizedName.length > 150) {
    throw new Error('INVALID_PANTRY_NAME');
  }

  if (!color) {
    throw new Error('INVALID_PANTRY_COLOR');
  }

  let normalizedLocation;
  try {
    normalizedLocation = normalizeCep(location);
  } catch {
    const error = new Error('Escolha um endereço válido da lista do Google Maps.');
    error.fields = { location: error.message };
    throw error;
  }

  const pantry = {
    id: Crypto.randomUUID(),
    accountId,
    name: normalizedName,
    location: normalizedLocation,
    locationName: normalizedLocation ? locationName?.trim() || null : null,
    color,
    createdAt: new Date().toISOString(),
  };

  return savePantry(pantry);
}

export async function updatePantryLocation({ accountId, pantryId, location, locationName }) {
  if (!accountId || !pantryId) throw new Error('INVALID_PANTRY');
  let normalizedLocation;
  try {
    normalizedLocation = normalizeCep(location);
  } catch {
    const error = new Error('Escolha um endereço válido da lista do Google Maps.');
    error.fields = { location: error.message };
    throw error;
  }
  await savePantryLocation({ accountId, pantryId, location: normalizedLocation, locationName });
  return (await listPantriesByAccountId(accountId)).find((pantry) => pantry.id === pantryId);
}
