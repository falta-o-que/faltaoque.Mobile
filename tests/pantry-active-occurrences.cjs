const assert = require('node:assert/strict');
const {createHarness, seed} = require('./local-test-harness.cjs');

async function main() {
    const h = createHarness();
    await seed(h);
    const {
        addProduct, listProducts, updateProductQuantity, setProductBrandGrouping
    } = h.load('src/services/productService.js');
    const {getProductPresentationKey} = h.load('src/domain/pantryProductGrouping.js');
    const scope = {accountId: 'a', pantryId: 'p'};
    const draft = {...scope, name: 'Nectar', price: '3', quantity: '1', category: 'bebidas'};
    const first = await addProduct(draft);
    const second = await addProduct({...draft, price: '5', quantity: '2'});
    let cards = await listProducts('a', 'p');
    assert.equal(cards[0].occurrenceCount, 2);
    await updateProductQuantity({...scope, productIds: cards[0].occurrenceIds, quantity: 2});
    cards = await listProducts('a', 'p');
    assert.equal(cards.length, 1);
    assert.equal(cards[0].quantity, 2);
    assert.equal(cards[0].occurrenceCount, 1);
    assert.equal(cards[0].primaryOccurrence.id, second.id);
    assert.equal(cards[0].unitPrice, 5);
    assert.equal(cards[0].totalPrice, 10);
    assert.ok(cards[0].occurrenceIds.includes(first.id));
    await updateProductQuantity({...scope, productIds: cards[0].occurrenceIds, quantity: 0});
    cards = await listProducts('a', 'p');
    assert.equal(cards.length, 1);
    assert.equal(cards[0].occurrenceCount, 1);
    assert.equal(cards[0].quantity, 0);
    const another = await addProduct({...draft, name: 'Suco', brand: 'Marca A'});
    await addProduct({...draft, name: 'Suco', brand: ''});
    cards = await listProducts('a', 'p');
    const juiceCards = cards.filter((card) => card.baseName === 'Suco');
    assert.equal(juiceCards.length, 2);
    for (const card of juiceCards) {
        await updateProductQuantity({...scope, productIds: card.occurrenceIds, quantity: 0});
    }
    cards = (await listProducts('a', 'p')).filter((card) => card.baseName === 'Suco');
    assert.equal(cards.length, 1);
    assert.equal(cards[0].quantity, 0);
    assert.equal(cards[0].occurrenceCount, 1);
    assert.ok(cards[0].occurrenceIds.includes(another.id));
    const deodorantA = await addProduct({...draft, name: 'Desodorante', brand: 'Marca A'});
    await addProduct({...draft, name: 'Desodorante', brand: 'Marca B', quantity: '2'});
    await setProductBrandGrouping('a', 'p', getProductPresentationKey({name: 'Desodorante'}), 'grouped');
    let deodorant = (await listProducts('a', 'p')).find((card) => card.baseName === 'Desodorante');
    assert.equal(deodorant.name, 'Desodorante');
    assert.equal(deodorant.occurrenceCount, 2);
    await updateProductQuantity({...scope, productIds: deodorant.occurrenceIds, quantity: 2});
    deodorant = (await listProducts('a', 'p')).find((card) => card.baseName === 'Desodorante');
    assert.equal(deodorant.name, 'Desodorante · Marca B');
    assert.equal(deodorant.occurrenceCount, 1);
    assert.ok(deodorant.occurrenceIds.includes(deodorantA.id));

    const riceA = await addProduct({...draft, name: 'Arroz', brand: 'Marca A'});
    const riceB = await addProduct({...draft, name: 'Arroz', brand: 'Marca B', quantity: '2'});
    await setProductBrandGrouping('a', 'p', getProductPresentationKey({name: 'Arroz'}), 'separate');
    await updateProductQuantity({...scope, productIds: [riceA.id], quantity: 0});
    let riceCards = (await listProducts('a', 'p')).filter((card) => card.baseName === 'Arroz');
    assert.equal(riceCards.length, 2, 'separated brands remain separate even when one brand is depleted');
    assert.equal(riceCards.find((card) => card.occurrenceIds.includes(riceA.id)).quantity, 0);
    assert.equal(riceCards.find((card) => card.occurrenceIds.includes(riceB.id)).quantity, 2);
    await updateProductQuantity({...scope, productIds: [riceB.id], quantity: 0});
    riceCards = (await listProducts('a', 'p')).filter((card) => card.baseName === 'Arroz');
    assert.equal(riceCards.length, 2, 'explicitly separated brands stay separate when all are depleted');
    assert.deepEqual(riceCards.map((card) => card.quantity), [0, 0]);
    console.log('pantry-active-occurrences tests passed');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
