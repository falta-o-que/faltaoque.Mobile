const assert = require('node:assert/strict');
const { createHarness, seed } = require('./local-test-harness.cjs');

async function main() {
  const h = createHarness();
  await seed(h);
  const { addProduct, listProducts, updateProductQuantity } = h.load('src/services/productService.js');
  const scope = { accountId: 'a', pantryId: 'p' };
  const draft = { ...scope, name: 'Nectar', price: '3', quantity: '1', category: 'bebidas' };
  const first = await addProduct(draft);
  const second = await addProduct({ ...draft, price: '5', quantity: '2' });
  let cards = await listProducts('a', 'p');
  assert.equal(cards[0].occurrenceCount, 2);
  await updateProductQuantity({ ...scope, productIds: cards[0].occurrenceIds, quantity: 2 });
  cards = await listProducts('a', 'p');
  assert.equal(cards.length, 1);
  assert.equal(cards[0].quantity, 2);
  assert.equal(cards[0].occurrenceCount, 1);
  assert.equal(cards[0].primaryOccurrence.id, second.id);
  assert.equal(cards[0].unitPrice, 5);
  assert.equal(cards[0].totalPrice, 10);
  assert.ok(cards[0].occurrenceIds.includes(first.id));
  await updateProductQuantity({ ...scope, productIds: cards[0].occurrenceIds, quantity: 0 });
  cards = await listProducts('a', 'p');
  assert.equal(cards.length, 1);
  assert.equal(cards[0].occurrenceCount, 1);
  assert.equal(cards[0].quantity, 0);
  console.log('pantry-active-occurrences tests passed');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
