const assert = require('node:assert/strict');
const { createHarness, seed } = require('./local-test-harness.cjs');
async function main() {
  const h = createHarness();
  await seed(h);
  const service = h.load('src/services/groceryListService.js');
  const scope = { accountId: 'a', pantryId: 'p' };
  const first = await service.createGroceryList({ ...scope, name: 'Mercado' });
  const second = await service.createGroceryList({ ...scope, name: 'Feira' });
  const a = await service.addGroceryItem({ ...scope, listId: first.id, name: 'Café', quantity: 2, category: 'bebidas' });
  const b = await service.addGroceryItem({ ...scope, listId: second.id, name: 'Café', quantity: 1, category: 'bebidas' });
  assert.notEqual(a.id, b.id);
  assert.deepEqual(await service.listGroceryLists('b', 'p'), []);
  await service.setGroceryItemChecked({ ...scope, listId: first.id, itemId: a.id, checked: true });
  const lists = await service.listGroceryLists('a', 'p');
  assert.equal(lists.find((list) => list.id === first.id).items[0].checked, true);
  await service.removeGroceryItems({ ...scope, listId: first.id, itemIds: [a.id] });
  assert.equal((await service.listGroceryLists('a', 'p')).find((list) => list.id === first.id).items.length, 0);
  await service.deleteGroceryList({ ...scope, listId: second.id });
  assert.equal((await service.listGroceryLists('a', 'p')).length, 1);
  console.log('grocery-list tests passed');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
