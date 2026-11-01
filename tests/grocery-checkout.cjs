const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {transformSync} = require('@babel/core');

let items = [];
let storedItems = [];
let writes = 0;
let result;
const database = () => ({
    users_pantries: [{user_id: 'a', pantry_id: 'p'}],
    grocery_lists: [{id: 'l', pantry_id: 'p', is_active: true}],
    grocery_list_products: storedItems,
    markets: [],
    purchases: [],
    pantry_products: [],
});
const modules = {
    'expo-crypto': {randomUUID: () => 'id'},
    '../domain/dateValidation': {normalizeDateOnly: (value) => value},
    '../domain/productValidation': {PRODUCT_CATEGORIES: ['bebidas'], PRODUCT_UNITS: []},
    '../domain/groceryCheckoutReconciliation': {arePresentationsCompatible: () => true},
    '../domain/fiscalItems': {isDisposableBagFiscalItem: () => false},
    '../repositories/marketRepository': {findOrCreateLocalMarket: (markets) => ({markets, marketId: null})},
    '../storage/localDatabase': {
        updateDatabase: async (update) => {
            result = update(database(), {listCheckout: {}});
            writes += 1;
        }, getCategoryId: () => 1
    },
    './groceryListService': {listGroceryLists: async () => [{id: 'l', status: 'active', items}]},
};
const filename = path.resolve(__dirname, '../src/services/groceryCheckoutService.js');
const {code} = transformSync(fs.readFileSync(filename, 'utf8'), {
    babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
});
const service = {exports: {}};
new Function('require', 'module', 'exports', code)((name) => {
    if (!(name in modules)) throw new Error(`Unexpected import: ${name}`);
    return modules[name];
}, service, service.exports);

async function main() {
    const input = {accountId: 'a', pantryId: 'p', listId: 'l', mode: 'manual', dateValue: '2020-01-01', items: []};
    items = [{id: 'item'}];
    storedItems = [{grocery_list_id: 'l'}];
    await service.exports.finalizeGroceryCheckout(input);
    assert.equal(result.purchases.length, 0);
    assert.equal(result.pantry_products.length, 0);
    assert.equal(result.grocery_lists[0].is_active, false);
    const product = {
        included: true,
        name: 'Leite',
        quantity: '2',
        priceInput: '5',
        priceMode: 'unit',
        category: 'bebidas',
        listItemId: 'item'
    };
    await service.exports.finalizeGroceryCheckout({...input, items: [product]});
    assert.equal(result.purchases[0].total_price, 10);
    assert.equal(result.pantry_products[0].price, 10);
    assert.equal(result.pantry_products[0].quantity, 2);
    await assert.rejects(service.exports.finalizeGroceryCheckout({
        ...input, items: [{...product, needsReview: true, requiresReview: true, reviewed: false}]
    }), /Revise/);
    await service.exports.finalizeGroceryCheckout({
        ...input, items: [{...product, needsReview: true, requiresReview: true, reviewed: true}]
    });
    await service.exports.finalizeGroceryCheckout({
        ...input, mode: 'nfce', purchase: {qrCodeId: '123', purchasedAt: '2020-01-01', totalAmount: 25}
    });
    assert.equal(result.purchases[0].total_price, 25);
    assert.equal(result.purchases[0].qr_code_id, '123');
    assert.equal(result.pantry_products.length, 0);
    assert.equal(writes, 4);
    console.log('grocery-checkout tests passed');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
