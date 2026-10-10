const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { transformSync } = require('@babel/core');

let failWrite = false;
let stored = JSON.stringify({
  version: 4, accounts: [],
  pantries: [{ id: 'pantry-a', accountId: 'account-a', name: 'Casa' }],
  products: [], purchases: [], importedQrFingerprints: [],
});
const storage = {
  getItem: async () => stored,
  setItem: async (_, value) => {
    if (failWrite) throw new Error('Falha de gravação');
    stored = value;
  },
};

const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const moduleObject = { exports: {} };
  cache.set(file, moduleObject);
  const { code } = transformSync(fs.readFileSync(file, 'utf8'), {
    babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
  });
  new Function('require', 'module', 'exports', code)((name) => {
    if (name === '@react-native-async-storage/async-storage') return storage;
    if (name === 'expo-crypto') return { randomUUID };
    if (name.startsWith('.')) return load(path.resolve(path.dirname(file), `${name}.js`));
    return require(name);
  }, moduleObject, moduleObject.exports);
  return moduleObject.exports;
}

async function main() {
  const scope = { accountId: 'account-a', pantryId: 'pantry-a' };
  const listService = load(path.resolve(__dirname, '../src/services/groceryListService.js'));
  const { finishListAndStock } = load(path.resolve(__dirname, '../src/services/groceryCheckoutService.js'));
  const list = await listService.createGroceryList({ ...scope, name: 'Mercado' });
  const item = await listService.addGroceryItem({ ...scope, listId: list.id, name: 'Café', quantity: 2, category: 'bebidas', weight: '500', unit: 'g' });
  const otherItem = await listService.addGroceryItem({ ...scope, listId: list.id, name: 'Leite', quantity: 1, category: 'bebidas' });
  await listService.setGroceryItemChecked({ ...scope, listId: list.id, itemId: item.id, checked: true });
  await listService.setGroceryItemChecked({ ...scope, listId: list.id, itemId: otherItem.id, checked: true });

  await assert.rejects(finishListAndStock({ ...scope, listId: list.id, pricesByItemId: { [item.id]: '12,50', [otherItem.id]: '0' } }));
  assert.equal(JSON.parse(stored).products.length, 0);
  failWrite = true;
  await assert.rejects(finishListAndStock({ ...scope, listId: list.id, pricesByItemId: { [item.id]: '12,50', [otherItem.id]: '5,00' } }));
  failWrite = false;
  assert.equal(JSON.parse(stored).products.length, 0);
  assert.equal((await listService.listGroceryLists(scope.accountId, scope.pantryId))[0].status, 'active');

  await finishListAndStock({ ...scope, listId: list.id, pricesByItemId: { [item.id]: '12,50', [otherItem.id]: '5,00' } });
  const database = JSON.parse(stored);
  assert.equal(database.products.length, 2);
  assert.equal(database.products[0].quantity, 2);
  assert.equal(database.products[0].weight, 500);
  assert.equal(database.purchases.length, 2);
  assert.equal(database.purchases[0].totalPrice, 25);
  assert.equal(database.purchases[0].groceryListId, list.id);
  assert.equal((await listService.listGroceryLists(scope.accountId, scope.pantryId))[0].status, 'finished');
  await assert.rejects(finishListAndStock({ ...scope, listId: list.id, pricesByItemId: { [item.id]: '12,50', [otherItem.id]: '5,00' } }));
  assert.equal(JSON.parse(stored).products.length, 2);
  console.log('grocery-checkout tests passed');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
