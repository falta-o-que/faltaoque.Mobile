const assert = require('node:assert/strict');
const {createHarness, seed} = require('./local-test-harness.cjs');

async function main() {
    const h = createHarness();
    await seed(h);
    const lists = h.load('src/services/groceryListService.js');
    const {finalizeGroceryCheckout} = h.load('src/services/groceryCheckoutService.js');
    const {readDatabase, updateDatabase} = h.load('src/storage/localDatabase.js');
    const {createPantry} = h.load('src/repositories/pantryRepository.js');
    const scope = {accountId: 'a', pantryId: 'p'};

    async function makeList() {
        const list = await lists.createGroceryList({...scope, name: 'Mercado'});
        const item = await lists.addGroceryItem({
            ...scope, listId: list.id, name: 'Café', quantity: 1, category: 'bebidas'
        });
        return {list, item};
    }

    async function finish({list, item}, dateValue) {
        await finalizeGroceryCheckout({
            ...scope, listId: list.id, mode: 'manual', dateValue, items: [{
                included: true,
                name: 'Café',
                quantity: '1',
                priceInput: '20',
                priceMode: 'total',
                category: 'bebidas',
                listItemId: item.id,
            }]
        });
    }

    const first = await makeList();
    const second = await makeList();
    await finish(second, '2020-01-09');
    await finish(first, '2020-01-10');
    let history = await lists.listGroceryLists('a', 'p');
    assert.equal(history.find((x) => x.id === first.list.id).finishedAt, '2020-01-10');
    assert.equal(history.find((x) => x.id === second.list.id).finishedAt, '2020-01-09');
    assert.equal(history.find((x) => x.id === first.list.id).purchaseTotal, 20);
    assert.equal(history.find((x) => x.id === second.list.id).purchaseTotal, 20);

    const third = await makeList();
    await finalizeGroceryCheckout({
        ...scope, listId: third.list.id, mode: 'manual', dateValue: '2020-01-11', items: []
    });
    history = await lists.listGroceryLists('a', 'p');
    assert.equal(history.find((x) => x.id === third.list.id).purchaseTotal, 0);
    assert.equal(history.find((x) => x.id === third.list.id).finishedAt, '2020-01-11');

    await createPantry({id: 'other', accountId: 'a', name: 'Outra', color: '#00F0FF'});
    await updateDatabase((database, metadata) => {
        const template = database.purchases[0];
        delete metadata.listCheckout[first.list.id];
        metadata.listCheckout[second.list.id].purchaseId = 'other-purchase';
        return {
            ...database,
            purchases: [...database.purchases, {
                ...template,
                id: 'unrelated',
                purchase_date: '2019-01-01'
            }, {...template, id: 'other-purchase', pantry_id: 'other'},]
        };
    });
    await readDatabase();
    history = await lists.listGroceryLists('a', 'p');
    assert.equal(history.find((x) => x.id === first.list.id).finishedAt, null);
    assert.equal(history.find((x) => x.id === first.list.id).purchaseTotal, null);
    assert.equal(history.find((x) => x.id === second.list.id).purchaseTotal, null);
    assert.deepEqual(await lists.listGroceryLists('b', 'p'), []);
    await updateDatabase((database, metadata) => {
        metadata.listCheckout[first.list.id] = {purchaseId: 'unrelated', finishedAt: '2020-01-10'};
        metadata.listCheckout[second.list.id].purchaseId = 'unrelated';
        return database;
    });
    history = await lists.listGroceryLists('a', 'p');
    assert.equal(history.find((x) => x.id === first.list.id).purchaseTotal, null);
    assert.equal(history.find((x) => x.id === second.list.id).purchaseTotal, null);
    console.log('checkout-history-association tests passed');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
