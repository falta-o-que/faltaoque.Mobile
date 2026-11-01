const assert = require('node:assert/strict');
const {createHarness, seed} = require('./local-test-harness.cjs');

async function main() {
    const h = createHarness();
    await seed(h);
    const {
        addProduct, updateProduct, updateProductQuantity, listProductOccurrences
    } = h.load('src/services/productService.js');
    const {updateDatabase, readDatabase} = h.load('src/storage/localDatabase.js');
    const scope = {accountId: 'a', pantryId: 'p'};
    const draft = {...scope, name: 'Leite', price: '10', priceType: 'unit', quantity: '3', category: 'bebidas'};
    const product = await addProduct(draft);
    await updateProductQuantity({...scope, productId: product.id, quantity: 0});
    await updateDatabase((db) => ({
        ...db, pantry_products: db.pantry_products.map((row) => row.id === product.id ? {
            ...row, expiration_date: '2020-01-01'
        } : row)
    }));
    await updateProduct({
        ...draft, productId: product.id, quantity: '0', expirationDate: '01/01/2020', name: 'Leite atualizado'
    });
    const saved = (await listProductOccurrences('a', 'p'))[0];
    assert.equal(saved.name, 'Leite atualizado');
    assert.equal(saved.quantity, 0);
    assert.equal(saved.expirationDate, '2020-01-01');
    assert.equal((await readDatabase()).pantry_products[0].price, 30);
    await assert.rejects(updateProduct({...draft, productId: product.id, quantity: '0', expirationDate: '02/01/2020'}));
    await assert.rejects(addProduct({...draft, quantity: '0'}));
    await assert.rejects(addProduct({...draft, expirationDate: '01/01/2020'}));
    await updateProduct({
        ...draft, productId: product.id, quantity: '0', priceType: 'total', price: '30', expirationDate: ''
    });
    assert.equal((await listProductOccurrences('a', 'p'))[0].expirationDate, null);
    console.log('product-edit-expired tests passed');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
