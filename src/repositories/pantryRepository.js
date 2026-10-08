import { readDatabase, updateDatabase, getColorId, resolveColor } from '../storage/localDatabase';

export async function listPantriesByAccountId(accountId) {
  const database = await readDatabase();
  const pantryIds = new Set(database.users_pantries.filter((row) => row.user_id === accountId).map((row) => row.pantry_id));
  return database.pantries.filter((row) => pantryIds.has(row.id)).map((pantry) => ({
    id: pantry.id, accountId, name: pantry.title, location: pantry.location, locationName: pantry.location_name,
    color: resolveColor(database, pantry.color_id)?.hex_code,
    productCount: database.pantry_products.filter((product) => !product.is_deleted && product.is_in_pantry &&
      database.purchases.some((purchase) => purchase.id === product.purchase_id && purchase.pantry_id === pantry.id)).length,
  }));
}

export async function createPantry(pantry) {
  await updateDatabase((database) => ({
    ...database,
    pantries: [...database.pantries, {
      id: pantry.id, title: pantry.name, location: pantry.location ?? null, location_name: pantry.locationName ?? null,
      color_id: getColorId(database, pantry.color), share_invite_id: null,
    }],
    users_pantries: [...database.users_pantries, { user_id: pantry.accountId, pantry_id: pantry.id }],
  }));
  return pantry;
}

export async function updatePantryLocation({ accountId, pantryId, location, locationName }) {
  let updatedPantry;
  await updateDatabase((database) => {
    const isMember = database.users_pantries.some((row) => row.user_id === accountId && row.pantry_id === pantryId);
    if (!isMember) throw new Error('Esta despensa não está disponível para sua conta.');
    const pantries = database.pantries.map((pantry) => {
      if (pantry.id !== pantryId) return pantry;
      updatedPantry = { ...pantry, location: location ?? null, location_name: location ? locationName?.trim() || null : null };
      return updatedPantry;
    });
    return { ...database, pantries };
  });
  return updatedPantry;
}
