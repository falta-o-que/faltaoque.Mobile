const assert = require('node:assert/strict');
const {createHarness, seed} = require('./local-test-harness.cjs');

function market(id, cep, localName) {
    return {id, cep, latitude: null, longitude: null, local_name: localName};
}

function purchase(id, pantryId, marketId, location, date, total) {
    return {
        id,
        title: `Compra ${id}`,
        location,
        market_id: marketId,
        purchase_date: date,
        total_price: total,
        total_products: 1,
        is_finished: true,
        finish_date: date,
        qr_code_id: null,
        pantry_id: pantryId,
    };
}

function pantryProduct(id, purchaseId, categoryId, name, price) {
    return {
        id,
        name,
        quantity: 1,
        current_quantity: 1,
        is_in_pantry: true,
        content_value: null,
        unit_of_measure: null,
        price,
        brand: null,
        expiration_date: null,
        finish_date: null,
        is_deleted: false,
        purchase_id: purchaseId,
        category_id: categoryId,
    };
}

async function addInitialHistory(harness) {
    const {updateDatabase} = harness.load('src/storage/localDatabase.js');
    await updateDatabase((database) => {
        const beverages = database.categories.find((item) => item.name === 'bebidas').id;
        const lists = [{
            id: 'list-a',
            name: 'Lista preservada',
            date: '2026-11-06',
            location: null,
            market_id: null,
            suggestion: null,
            estimated_price: 12,
            pantry_id: 'p',
            is_active: true,
        }];
        const listProducts = [{
            id: 'list-product-a',
            name: 'Café',
            quantity: 1,
            content_value: null,
            unit_of_measure: null,
            is_taken: false,
            grocery_list_id: 'list-a',
            category_id: beverages,
        }];
        return {
            ...database,
            markets: [market('market-old-a', '11111111', 'Mercado antigo'), market('market-b', '22222222', 'Mercado B')],
            purchases: [purchase('purchase-old-a', 'p', 'market-old-a', '11111111', '2026-10-01', 10), purchase('purchase-old-a2', 'p-a2', null, '04000000', '2026-10-02', 20), purchase('purchase-b', 'p-b', 'market-b', '22222222', '2026-10-03', 30),],
            pantry_products: [pantryProduct('product-old-a', 'purchase-old-a', beverages, 'Café antigo', 10), pantryProduct('product-old-a2', 'purchase-old-a2', beverages, 'Leite antigo', 20), pantryProduct('product-b', 'purchase-b', beverages, 'Café B', 30),],
            grocery_lists: lists,
            grocery_list_products: listProducts,
        };
    });
}

async function testDashboardReadAndPersistence() {
    const h = createHarness();
    await seed(h);
    const {createPantry} = h.load('src/repositories/pantryRepository.js');
    await createPantry({id: 'p-a2', accountId: 'a', name: 'Outra casa', color: '#00F0FF'});
    await createPantry({id: 'p-b', accountId: 'b', name: 'Casa B', color: '#00F0FF'});
    await addInitialHistory(h);

    const {listDashboardRecords} = h.load('src/repositories/dashboardRepository.js');
    const service = h.load('src/services/dashboardService.js');
    const accountA = await listDashboardRecords('a', 'p');
    assert.deepEqual(accountA.purchases.map((item) => item.id), ['purchase-old-a']);
    assert.equal(accountA.purchases[0].pantryName, 'Casa');
    assert.equal(accountA.purchases[0].marketName, 'Mercado antigo');
    assert.equal((await listDashboardRecords('a', 'p-a2')).purchases[0].marketName, '04000000');
    await assert.rejects(() => listDashboardRecords('a', 'p-b'), /PANTRY_NOT_FOUND/);
    await assert.rejects(() => listDashboardRecords('a'), /PANTRY_NOT_FOUND/);
    assert.equal(accountA.purchases[0].products[0].category, 'bebidas');
    assert.equal(accountA.purchases[0].products[0].total, 10);

    const loadedA = await service.loadDashboard('a', 'p');
    assert.equal(loadedA.records.length, 1);
    assert.equal(loadedA.filters.markets.length, 1);
    assert.equal(loadedA.filters.products.length, 1);
    const loadedB = await service.loadDashboard('b', 'p-b');
    assert.deepEqual(loadedB.records.map((item) => item.id), ['purchase-b']);
    assert.equal(loadedB.filters.markets[0].name, 'Mercado B');
    await assert.rejects(() => listDashboardRecords(null), /UNAUTHENTICATED/);

    const {updateDatabase} = h.load('src/storage/localDatabase.js');
    await updateDatabase((database) => ({
        ...database, purchases: database.purchases.map((item) => item.id === 'purchase-old-a' ? {
            ...item, total_price: 42, purchase_date: '2026-11-07'
        } : item),
    }));
    const loadedAgain = await service.loadDashboard('a', 'p');
    assert.equal(loadedAgain.records.find((item) => item.id === 'purchase-old-a').total, 42, 'dashboard reads the committed persisted snapshot on each load');
}

async function main() {
    await testDashboardReadAndPersistence();
    console.log('dashboard-repository tests passed');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
