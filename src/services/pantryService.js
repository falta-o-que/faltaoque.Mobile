import * as Crypto from 'expo-crypto';

import {
  createPantry as savePantry,
  listPantriesByAccountId,
} from '../repositories/pantryRepository';

export async function listPantries(accountId) {
  if (!accountId) return [];

  return listPantriesByAccountId(accountId);
}

export async function createPantry({ accountId, color, name }) {
  const normalizedName = name?.trim();

  if (!accountId) {
    throw new Error('UNAUTHENTICATED');
  }

  if (!normalizedName) {
    throw new Error('INVALID_PANTRY_NAME');
  }

  if (!color) {
    throw new Error('INVALID_PANTRY_COLOR');
  }

  const pantry = {
    id: Crypto.randomUUID(),
    accountId,
    name: normalizedName,
    color,
    createdAt: new Date().toISOString(),
  };

  return savePantry(pantry);
}
