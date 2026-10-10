import * as Crypto from 'expo-crypto';
import { normalizeCep } from '../domain/locationValidation';
import { COLOR_OPTIONS } from '../constants/colorOptions';
import { clearPantryProductViewPreferences } from './pantryProductViewPreferenceService';
import { clearGroceryListViewPreferences } from './groceryListViewPreferenceService';

import {
  createPantry as savePantry,
  listPantriesByAccountId,
  updatePantry as savePantryDetails,
  deletePantryById,
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

export async function updatePantry({ accountId, pantryId, name, color, location, locationName }) {
  const normalizedName = name?.trim();
  if (!accountId || !pantryId) throw new Error('INVALID_PANTRY');
  if (!normalizedName || normalizedName.length > 150) throw new Error('INVALID_PANTRY_NAME');
  if (!COLOR_OPTIONS.some((option) => option.toLowerCase() === String(color).toLowerCase())) {
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

  await savePantryDetails({
    accountId,
    pantryId,
    name: normalizedName,
    color,
    location: normalizedLocation,
    locationName: normalizedLocation ? locationName?.trim() || null : null,
  });
  return (await listPantriesByAccountId(accountId)).find((pantry) => pantry.id === pantryId);
}

export async function deletePantry({ accountId, pantryId }) {
  if (!accountId || !pantryId) throw new Error('INVALID_PANTRY');
  await deletePantryById({ accountId, pantryId });
  await Promise.allSettled([
    clearPantryProductViewPreferences(accountId, pantryId),
    clearGroceryListViewPreferences(accountId, pantryId),
  ]);
}
