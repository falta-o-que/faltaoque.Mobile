const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { transformSync } = require('@babel/core');

let items = [];
let storedItems = [];
let writes = 0;
const database = () => ({
  users_pantries: [{ user_id: 'a', pantry_id: 'p' }],
  grocery_lists: [{ id: 'l', pantry_id: 'p', is_active: true }],
  grocery_list_products: storedItems, markets: [], purchases: [], pantry_products: [],
});
const modules = {
  'expo-crypto': { randomUUID: () => 'id' },
  '../domain/dateValidation': { normalizeDateOnly: (value) => value },
  '../domain/productValidation': { PRODUCT_CATEGORIES: [], PRODUCT_UNITS: [] },
  '../domain/groceryCheckoutReconciliation': { arePresentationsCompatible: () => true },
  '../domain/fiscalItems': { isDisposableBagFiscalItem: () => false },
  '../repositories/marketRepository': { findOrCreateLocalMarket: (markets) => ({ markets, marketId: null }) },
  '../storage/localDatabase': { updateDatabase: async (update) => { update(database()); writes += 1; } },
  './groceryListService': { listGroceryLists: async () => [{ id: 'l', status: 'active', items }] },
};
const filename = path.resolve(__dirname, '../src/services/groceryCheckoutService.js');
const { code } = transformSync(fs.readFileSync(filename, 'utf8'), {
  babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
});
const service = { exports: {} };
new Function('require', 'module', 'exports', code)((name) => {
  if (!(name in modules)) throw new Error(`Unexpected import: ${name}`);
  return modules[name];
}, service, service.exports);

async function main() {
  const input = { accountId: 'a', pantryId: 'p', listId: 'l', mode: 'manual', dateValue: '2020-01-01', items: [] };
  await assert.rejects(service.exports.finalizeGroceryCheckout(input), /EMPTY_GROCERY_LIST/);
  items = [{ id: 'item' }];
  await assert.rejects(service.exports.finalizeGroceryCheckout(input), /EMPTY_GROCERY_LIST/);
  assert.equal(writes, 0);
  storedItems = [{ grocery_list_id: 'l' }];
  await service.exports.finalizeGroceryCheckout(input);
  assert.equal(writes, 1);
  console.log('empty-list-checkout tests passed');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
