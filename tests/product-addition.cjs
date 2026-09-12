// Run with node tests/product-addition.cjs. Native storage is replaced with an in-memory adapter.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { transformSync } = require('@babel/core');

let persisted;
let failWrite = false;
const storage = {
  getItem: async () => persisted,
  setItem: async (_, value) => {
    if (failWrite) throw new Error('Storage unavailable');
    persisted = value;
  },
};
function loader() {
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const { code } = transformSync(fs.readFileSync(file, 'utf8'), {
      babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
    });
    new Function('require', 'module', 'exports', code)((name) => {
      if (name === '@react-native-async-storage/async-storage') return storage;
      if (name === 'expo-crypto') return { randomUUID };
      if (name.startsWith('.')) return load(path.resolve(path.dirname(file), `${name}.js`));
      return require(name);
    }, module, module.exports);
    return module.exports;
  }
  return (file) => load(path.resolve(__dirname, '..', file));
}

async function main() {
  const load = loader();
  const { normalizeProduct, validateProduct } = load('src/domain/productValidation.js');
  const { addProduct, listProducts } = load('src/services/productService.js');
  const { readDatabase } = load('src/storage/localDatabase.js');
  const { createPantry, listPantriesByAccountId } = load('src/repositories/pantryRepository.js');
  const { createAccount } = load('src/repositories/accountRepository.js');
  const draft = { name: ' Café ', price: '12,35', quantity: '3', weight: '0,5', unit: 'kg', category: 'bebidas' };
  assert.equal(normalizeProduct(draft).totalPrice, 37.05);
  assert.equal(normalizeProduct({ ...draft, price: '1.234,56' }).unitPrice, 1234.56);
  for (const quantity of ['0', '-1', '1.5', '1e2', '']) assert.ok(validateProduct({ ...draft, quantity }).quantity);
  for (const price of ['0', '-2', '1,234', '1e2', 'Infinity']) assert.ok(validateProduct({ ...draft, price }).price);
  assert.ok(validateProduct({ ...draft, unit: '' }).unit);
  assert.ok(validateProduct({ ...draft, category: 'inventada' }).category);
  assert.ok(validateProduct({ ...draft, name: ' ' }).name);
  assert.equal(normalizeProduct({ ...draft, weight: '', unit: 'kg', category: null }).weight, null);

  const accounts = [{ id: 'a', email: 'a@example.test' }, { id: 'b', email: 'b@example.test' }];
  persisted = JSON.stringify({ version: 1, accounts });
  assert.equal((await readDatabase()).version, 3);
  assert.deepEqual((await readDatabase()).accounts, accounts);
  const original = JSON.stringify({ version: 2, accounts, pantries: [{ id: 'p', accountId: 'a', name: 'Casa', color: '#00dd00' }] });
  persisted = original;
  assert.equal((await readDatabase()).pantries[0].id, 'p');
  assert.equal(persisted, original, 'Reading a migration must not overwrite storage');

  await assert.rejects(addProduct({ ...draft, accountId: 'b', pantryId: 'p' }));
  assert.equal(persisted, original);
  await assert.rejects(addProduct({ ...draft, accountId: 'a', pantryId: 'missing' }));
  await assert.rejects(addProduct({ ...draft, quantity: '0', accountId: 'a', pantryId: 'p' }));
  assert.equal(persisted, original);
  failWrite = true;
  await assert.rejects(addProduct({ ...draft, accountId: 'a', pantryId: 'p' }));
  assert.equal(persisted, original, 'Failed save must preserve products and history together');
  failWrite = false;
  await Promise.all([
    addProduct({ ...draft, accountId: 'a', pantryId: 'p' }),
    addProduct({ ...draft, accountId: 'a', pantryId: 'p' }),
    createPantry({ id: 'p2', accountId: 'b', name: 'Outra', color: '#000' }),
    createAccount({ id: 'c', email: 'c@example.test' }),
  ]);
  const saved = await readDatabase();
  assert.equal(saved.accounts.length, 3);
  assert.equal(saved.pantries.length, 2);
  assert.equal(saved.products.length, 2);
  assert.equal(saved.purchases.length, 2);
  assert.equal(saved.purchases[0].source, 'manual');
  assert.equal(saved.purchases[0].location, '');
  assert.ok(!Number.isNaN(Date.parse(saved.purchases[0].purchasedAt)));
  assert.equal(saved.purchases[0].items[0].productId, saved.products[0].id);
  assert.equal((await listPantriesByAccountId('a'))[0].productCount, 2);
  assert.equal((await listProducts('b', 'p2')).length, 0);
  const reloaded = loader()('src/services/productService.js');
  assert.equal((await reloaded.listProducts('a', 'p')).length, 2);
  for (const invalid of ['{bad json', 'null', '{"version":999}', '{"version":3,"accounts":[],"pantries":[]}']) {
    persisted = invalid;
    await assert.rejects(addProduct({ ...draft, accountId: 'a', pantryId: 'p' }));
    assert.equal(persisted, invalid, 'Invalid storage must not be reset');
  }
  console.log('PASS: validation, migration v1/v2, account isolation, atomic save failure, concurrent additions, history and reload.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
