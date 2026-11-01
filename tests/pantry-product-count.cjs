const assert = require('node:assert/strict');
const { createHarness, seed } = require('./local-test-harness.cjs');

async function main() {
  const h = createHarness();
  await seed(h);
  const { addProduct, updateProductQuantity, listProducts, setProductBrandGrouping } = h.load('src/services/productService.js');
  const { getProductPresentationKey } = h.load('src/domain/pantryProductGrouping.js');
  const { listPantries } = h.load('src/services/pantryService.js');
  const scope = { accountId: 'a', pantryId: 'p' };
  const draft = { ...scope, price: '10', quantity: '1', category: 'bebidas' };
  let first;
  for (let index = 0; index < 3; index += 1) {
    const product = await addProduct({ ...draft, name: 'Café' });
    first ??= product;
    await addProduct({ ...draft, name: 'Leite' });
  }
  assert.equal((await listPantries('a'))[0].productCount, 2);
  await updateProductQuantity({ ...scope, productId: first.id, quantity: 0 });
  assert.equal((await listPantries('a'))[0].productCount, (await listProducts('a', 'p')).length);
  await addProduct({ ...draft, name: 'Café', brand: 'Marca diferente' });
  assert.equal((await listPantries('a'))[0].productCount, 3);
  await setProductBrandGrouping('a', 'p', getProductPresentationKey({ name: 'Café' }), 'grouped');
  assert.equal((await listPantries('a'))[0].productCount, 2);
  console.log('pantry-product-count tests passed');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
