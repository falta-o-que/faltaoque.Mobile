const assert = require('node:assert/strict');
const {createHarness, seed} = require('./local-test-harness.cjs');

async function main() {
    const h = createHarness();
    await seed(h);
    const {addProduct} = h.load('src/services/productService.js');
    const lists = h.load('src/services/groceryListService.js');
    const {finalizeGroceryCheckout} = h.load('src/services/groceryCheckoutService.js');
    const {readDatabase} = h.load('src/storage/localDatabase.js');
    const scope = {accountId: 'a', pantryId: 'p'};
    await addProduct({...scope, name: 'Café', quantity: '1', price: '12', category: 'bebidas'});
    const list = await lists.createGroceryList({...scope, name: 'Mercado'});
    const item = await lists.addGroceryItem({
        ...scope, listId: list.id, name: 'Café', quantity: 1, category: 'bebidas'
    });
    assert.equal((await lists.listGroceryLists('a', 'p'))[0].estimatedPrice, 12);
    await finalizeGroceryCheckout({
        ...scope, listId: list.id, mode: 'manual', dateValue: '2020-01-01', items: [{
            included: true,
            name: 'Café',
            quantity: '1',
            priceInput: '20',
            priceMode: 'total',
            category: 'bebidas',
            listItemId: item.id
        },]
    });
    let db = await readDatabase();
    assert.equal(db.grocery_lists.find((row) => row.id === list.id).estimated_price, 12);
    const finished = (await lists.listGroceryLists('a', 'p')).find((entry) => entry.id === list.id);
    assert.equal(finished.estimatedPrice, 12);
    assert.equal(finished.purchaseTotal, 20);
    assert.equal(finished.finishedAt, '2020-01-01');

    const second = await lists.createGroceryList({...scope, name: 'Mercado'});
    await lists.addGroceryItem({...scope, listId: second.id, name: 'Café', quantity: 1, category: 'bebidas'});
    await finalizeGroceryCheckout({...scope, listId: second.id, mode: 'manual', dateValue: '2020-01-02', items: []});
    const history = await lists.listGroceryLists('a', 'p');
    assert.equal(history.find((entry) => entry.id === list.id).purchaseTotal, 20);
    assert.equal(history.find((entry) => entry.id === second.id).purchaseTotal, 0);
    assert.equal(history.find((entry) => entry.id === second.id).finishedAt, '2020-01-02');
    db = await readDatabase();
    assert.equal(db.purchases.length, 2);
    console.log('checkout-estimate-history tests passed');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
