const assert = require('node:assert/strict');
const { createHarness, seed } = require('./local-test-harness.cjs');
async function main() {
  const h = createHarness();
  await seed(h);
  const { addProduct, listProductOccurrences } = h.load('src/services/productService.js');
  const { readDatabase } = h.load('src/storage/localDatabase.js');
  const draft = { accountId: 'a', pantryId: 'p', name: 'Café', price: '10', quantity: '2', category: 'bebidas' };
  await assert.rejects(addProduct({ ...draft, accountId: 'b' }));
  await assert.rejects(addProduct({ ...draft, quantity: '0' }));
  const before = h.data.get('@faltaoque/database');
  h.failWrites(true);
  await assert.rejects(addProduct(draft), /Storage unavailable/);
  assert.equal(h.data.get('@faltaoque/database'), before);
  h.failWrites(false);
  await Promise.all([addProduct(draft), addProduct(draft)]);
  const db = await readDatabase();
  assert.equal(db.purchases.length, 2);
  assert.equal(db.pantry_products.length, 2);
  assert.equal((await listProductOccurrences('a', 'p')).length, 2);
  await assert.rejects(listProductOccurrences('b', 'p'));
  console.log('product-addition tests passed');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
