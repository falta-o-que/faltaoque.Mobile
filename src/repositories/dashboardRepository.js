import {readDatabase} from '../storage/localDatabase';

export async function listDashboardRecords(accountId, pantryId) {
    if (!accountId) throw new Error('UNAUTHENTICATED');

    const database = await readDatabase();
    const pantryIds = new Set(database.users_pantries
        .filter((membership) => membership.user_id === accountId)
        .map((membership) => membership.pantry_id));
    if (!pantryId || !pantryIds.has(pantryId)) throw new Error('PANTRY_NOT_FOUND');
    const pantries = new Map(database.pantries
        .filter((pantry) => pantryIds.has(pantry.id))
        .map((pantry) => [pantry.id, pantry.title]));
    const markets = new Map(database.markets.map((market) => [market.id, market.local_name || market.cep]));
    const categories = new Map(database.categories.map((category) => [category.id, category.name]));
    const purchases = database.purchases
        .filter((purchase) => purchase.pantry_id === pantryId)
        .map((purchase) => ({
            id: purchase.id,
            date: purchase.purchase_date,
            total: Number(purchase.total_price) || 0,
            pantryName: pantries.get(purchase.pantry_id),
            marketId: purchase.market_id ?? null,
            marketName: markets.get(purchase.market_id) || purchase.location || null,
            products: database.pantry_products
                .filter((product) => product.purchase_id === purchase.id)
                .map((product) => ({
                    id: product.id,
                    name: product.name,
                    quantity: Number(product.quantity) || 0,
                    total: Number(product.price) || 0,
                    contentValue: product.content_value == null ? null : Number(product.content_value),
                    unitId: product.unit_of_measure,
                    category: categories.get(product.category_id) || 'outros',
                })),
        }));

    return {purchases};
}
