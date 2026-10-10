import { readDatabase, updateDatabase, getColorId, resolveColor } from '../storage/localDatabase';

export async function listPantriesByAccountId(accountId) {
  const database = await readDatabase();
  const pantryIds = new Set(database.users_pantries.filter((row) => row.user_id === accountId).map((row) => row.pantry_id));
  return database.pantries.filter((row) => pantryIds.has(row.id)).map((pantry) => ({
    id: pantry.id, accountId, name: pantry.title, location: pantry.location, locationName: pantry.location_name,
    color: resolveColor(database, pantry.color_id)?.hex_code,
    productCount: database.pantry_products.filter((product) => !product.is_deleted && product.is_in_pantry &&
      database.purchases.some((purchase) => purchase.id === product.purchase_id && purchase.pantry_id === pantry.id)).length,
    shoppingListCount: database.grocery_lists.filter((list) => list.pantry_id === pantry.id && list.is_active).length,
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

export async function updatePantry({ accountId, pantryId, name, color, location, locationName }) {
  let updatedPantry;
  await updateDatabase((database) => {
    const isMember = database.users_pantries.some((row) => row.user_id === accountId && row.pantry_id === pantryId);
    if (!isMember) throw new Error('Esta despensa não está disponível para sua conta.');
    const pantries = database.pantries.map((pantry) => {
      if (pantry.id !== pantryId) return pantry;
      updatedPantry = {
        ...pantry,
        title: name,
        color_id: getColorId(database, color),
        location: location ?? null,
        location_name: location ? locationName?.trim() || null : null,
      };
      return updatedPantry;
    });
    return { ...database, pantries };
  });
  return updatedPantry;
}

export async function deletePantryById({ accountId, pantryId }) {
  await updateDatabase((database) => {
    const isMember = database.users_pantries.some((row) => row.user_id === accountId && row.pantry_id === pantryId);
    if (!isMember) throw new Error('Esta despensa não está disponível para sua conta.');

    const removedPurchaseIds = new Set(database.purchases.filter((row) => row.pantry_id === pantryId).map((row) => row.id));
    const removedListIds = new Set(database.grocery_lists.filter((row) => row.pantry_id === pantryId).map((row) => row.id));
    const pantry = database.pantries.find((row) => row.id === pantryId);
    const removedInviteId = pantry?.share_invite_id;
    const purchases = database.purchases.filter((row) => !removedPurchaseIds.has(row.id));
    const groceryLists = database.grocery_lists.filter((row) => !removedListIds.has(row.id));
    const markets = database.markets.filter((market) =>
      purchases.some((purchase) => purchase.market_id === market.id) ||
      groceryLists.some((list) => list.market_id === market.id));

    return {
      ...database,
      pantries: database.pantries.filter((row) => row.id !== pantryId),
      users_pantries: database.users_pantries.filter((row) => row.pantry_id !== pantryId),
      pantries_invites: removedInviteId != null && !database.pantries.some((row) => row.id !== pantryId && row.share_invite_id === removedInviteId)
        ? database.pantries_invites.filter((row) => row.id !== removedInviteId)
        : database.pantries_invites,
      purchases,
      pantry_products: database.pantry_products.filter((row) => !removedPurchaseIds.has(row.purchase_id)),
      grocery_lists: groceryLists,
      grocery_list_products: database.grocery_list_products.filter((row) => !removedListIds.has(row.grocery_list_id)),
      markets,
    };
  });
}
