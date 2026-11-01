const assert = require('node:assert/strict');
const {createHarness} = require('./local-test-harness.cjs');
const {estimateGroceryListPrices} = createHarness().load('src/services/groceryPriceEstimateService.js');

function estimate(history, item) {
    const db = {
        categories: [{id: 1, name: 'bebidas'}],
        purchases: history.map((_, index) => ({id: `purchase-${index}`, pantry_id: 'p', purchase_date: '2026-01-01'})),
        pantry_products: history.map((entry, index) => ({
            purchase_id: `purchase-${index}`,
            name: 'Café',
            quantity: 1,
            category_id: 1,
            content_value: entry.size,
            unit_of_measure: entry.unit,
            price: entry.price
        })),
    };
    return estimateGroceryListPrices(db, {
        pantryId: 'p', items: [{name: 'Café', category: 'bebidas', quantity: 1, ...item}]
    });
}

assert.equal(estimate([{size: 500, unit: 1, price: 10}], {weight: 1, unit: 'kg'}).estimatedPrice, 20);
assert.equal(estimate([{size: 1, unit: 2, price: 20}], {weight: 500, unit: 'g'}).estimatedPrice, 10);
assert.equal(estimate([{size: 500, unit: 3, price: 4}], {weight: 1, unit: 'L'}).estimatedPrice, 8);
assert.equal(estimate([{size: 1, unit: 4, price: 8}], {weight: 500, unit: 'ml'}).estimatedPrice, 4);
assert.equal(estimate([{size: 1000, unit: 1, price: 17}, {size: 500, unit: 1, price: 10}], {
    weight: 1, unit: 'kg'
}).estimatedPrice, 17);
assert.equal(estimate([{size: 1, unit: 4, price: 8}], {weight: 1, unit: 'kg'}).estimatedPrice, null);
assert.equal(estimate([{size: 500, unit: 1, price: 10}], {weight: 1, unit: 'kg', quantity: 2}).estimatedPrice, 40);
assert.equal(estimate([{size: 1000, unit: 1, price: 10}, {size: 1, unit: 2, price: 14}, {
    size: 500, unit: 1, price: 30
}], {}).estimatedPrice, 12);
console.log('grocery-estimate-units tests passed');
