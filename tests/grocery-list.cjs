const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { transformSync } = require('@babel/core');

const file = path.resolve(__dirname, '../src/services/groceryListService.js');
const { code } = transformSync(fs.readFileSync(file, 'utf8'), {
  babelrc: false,
  configFile: false,
  plugins: ['@babel/plugin-transform-modules-commonjs'],
});
const moduleObject = { exports: {} };
new Function('module', 'exports', code)(moduleObject, moduleObject.exports);
const service = moduleObject.exports;

async function main() {
  const scope = { accountId: 'account-a', pantryId: 'pantry-a' };
  const otherPantry = { accountId: 'account-a', pantryId: 'pantry-b' };
  const otherAccount = { accountId: 'account-b', pantryId: 'pantry-a' };
  const first = await service.createGroceryList({ ...scope, name: 'Mercado' });
  assert.equal(first.pantryId, scope.pantryId);
  const second = await service.createGroceryList({ ...scope, name: 'Feira' });
  const a = await service.addGroceryItem({ ...scope, listId: first.id, name: 'Café', quantity: 2, category: 'bebidas' });
  const b = await service.addGroceryItem({ ...scope, listId: second.id, name: 'Café', quantity: 1, category: 'bebidas' });
  assert.notEqual(a.id, b.id, 'same name in two lists must create separate occurrences');
  assert.deepEqual(await service.listGroceryLists(otherPantry.accountId, otherPantry.pantryId), []);
  assert.deepEqual(await service.listGroceryLists(otherAccount.accountId, otherAccount.pantryId), []);

  const snapshot = await service.listGroceryLists(scope.accountId, scope.pantryId);
  snapshot[0].items[0].name = 'changed outside the service';
  assert.equal((await service.listGroceryLists(scope.accountId, scope.pantryId))[0].items[0].name, 'Café');
  await service.setGroceryItemChecked({ ...scope, listId: first.id, itemId: a.id, checked: true });
  await service.finishGroceryList({ ...scope, listId: first.id });
  await assert.rejects(service.addGroceryItem({ ...scope, listId: first.id, name: 'Leite', quantity: 1 }));
  const repeated = await service.repeatGroceryList({ ...scope, listId: first.id });
  assert.notEqual(repeated.id, first.id);
  assert.notEqual(repeated.items[0].id, a.id);
  assert.equal(repeated.items[0].checked, false);
  assert.equal(repeated.status, 'active');
  const extra = await service.addGroceryItem({ ...scope, listId: repeated.id, name: 'Leite', quantity: 1, category: 'laticinios' });
  await assert.rejects(service.removeGroceryItems({ ...scope, listId: repeated.id, itemIds: ['unknown'] }));
  await service.removeGroceryItems({ ...scope, listId: repeated.id, itemIds: [repeated.items[0].id] });
  const afterRemoval = (await service.listGroceryLists(scope.accountId, scope.pantryId)).find((list) => list.id === repeated.id);
  assert.deepEqual(afterRemoval.items.map((item) => item.id), [extra.id]);
  assert.equal((await service.listGroceryLists(scope.accountId, scope.pantryId))[0].status, 'finished');
  await assert.rejects(service.deleteGroceryList({ ...scope, listId: first.id }));
  await service.deleteGroceryList({ ...scope, listId: second.id });
  assert.equal((await service.listGroceryLists(scope.accountId, scope.pantryId)).some((list) => list.id === second.id), false);
  console.log('grocery-list tests passed');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
