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
  const { suggestCategory, confirmFiscalPurchase } = load('src/services/nfceImportService.js');
  const { groupFiscalItems } = load('src/domain/fiscalItems.js');
  const { extractPackageMeasure } = load('src/domain/packageMeasure.js');
  const { addProduct, deleteProduct, listProducts, updateProduct, updateProductQuantity } = load('src/services/productService.js');
  const { readDatabase } = load('src/storage/localDatabase.js');
  const { createPantry, listPantriesByAccountId } = load('src/repositories/pantryRepository.js');
  const { createAccount } = load('src/repositories/accountRepository.js');
  const draft = { name: ' Café ', price: '12,35', quantity: '3', weight: '0,5', unit: 'kg', category: 'bebidas', expirationDate: '31/12/2026' };
  assert.equal(normalizeProduct(draft).totalPrice, 37.05);
  assert.deepEqual(normalizeProduct({ ...draft, price: '100,00', quantity: '3', priceType: 'total' }), {
    name: 'Café', quantity: 3, unitPrice: 100 / 3, totalPrice: 100, priceType: 'total',
    weight: 0.5, unit: 'kg', category: 'bebidas', expirationDate: '2026-12-31',
  });
  assert.equal(normalizeProduct({ ...draft, price: '1.234,56' }).unitPrice, 1234.56);
  for (const quantity of ['0', '-1', '1.5', '1e2', '']) assert.ok(validateProduct({ ...draft, quantity }).quantity);
  for (const price of ['0', '-2', '1,234', '1e2', 'Infinity']) assert.ok(validateProduct({ ...draft, price }).price);
  assert.ok(validateProduct({ ...draft, unit: '' }).unit);
  assert.ok(validateProduct({ ...draft, category: 'inventada' }).category);
  assert.ok(validateProduct({ ...draft, category: null }).category);
  assert.ok(validateProduct({ ...draft, name: ' ' }).name);
  for (const expirationDate of ['29/02/2026', '31/13/2026', '31-12-2026']) assert.ok(validateProduct({ ...draft, expirationDate }).expirationDate);
  assert.equal(validateProduct({ ...draft, expirationDate: '01/01/2020' }).expirationDate, 'A validade deve ser hoje ou uma data futura.');
  assert.equal(normalizeProduct({ ...draft, expirationDate: '2026-12-31' }).expirationDate, '2026-12-31');
  assert.equal(normalizeProduct({ ...draft, expirationDate: '' }).expirationDate, null);
  assert.equal(normalizeProduct({ ...draft, weight: '', unit: 'kg' }).weight, null);
  assert.equal(suggestCategory('Café em pó'), 'bebidas');
  assert.equal(suggestCategory('Produto sem regra'), 'outros');
  assert.equal(normalizeProduct({ ...draft, category: 'outros' }).category, 'outros');

  const accounts = [{ id: 'a', email: 'a@example.test' }, { id: 'b', email: 'b@example.test' }];
  persisted = JSON.stringify({ version: 1, accounts });
  assert.equal((await readDatabase()).version, 4);
  assert.deepEqual((await readDatabase()).accounts, accounts);
  const original = JSON.stringify({ version: 2, accounts, pantries: [{ id: 'p', accountId: 'a', name: 'Casa', color: '#00dd00' }] });
  persisted = original;
  assert.equal((await readDatabase()).pantries[0].id, 'p');
  assert.equal(persisted, original, 'Reading a migration must not overwrite storage');
  persisted = JSON.stringify({ version: 3, accounts, pantries: [], products: [], purchases: [] });
  assert.equal((await readDatabase()).version, 4);
  assert.deepEqual((await readDatabase()).importedQrFingerprints, []);
  persisted = original;

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
  assert.equal(saved.products[0].expirationDate, '2026-12-31');
  assert.equal((await listPantriesByAccountId('a'))[0].productCount, 2);
  const changed = await updateProductQuantity({ accountId: 'a', pantryId: 'p', productId: saved.products[0].id, quantity: 7 });
  assert.equal(changed.quantity, 7);
  assert.equal((await listProducts('a', 'p')).find((product) => product.id === changed.id).quantity, 7);
  const edited = await updateProduct({
    ...changed,
    accountId: 'a',
    pantryId: 'p',
    productId: changed.id,
    name: 'Café em grãos',
    price: '14,50',
    quantity: '4',
    weight: '1',
    unit: 'kg',
    category: 'integraisCereais',
    expirationDate: '31/12/2026',
  });
  assert.equal(edited.name, 'Café em grãos');
  assert.equal(edited.quantity, 4);
  assert.equal(edited.unitPrice, 14.5);
  assert.equal(edited.totalPrice, 58);
  assert.equal(edited.category, 'integraisCereais');
  assert.equal((await readDatabase()).purchases[0].items[0].name, 'Café', 'Editar o estoque não reescreve a compra original.');
  await assert.rejects(updateProduct({ ...changed, accountId: 'a', pantryId: 'p', productId: changed.id, name: '', price: '1', quantity: '1', category: 'bebidas' }));
  await assert.rejects(updateProductQuantity({ accountId: 'a', pantryId: 'p', productId: changed.id, quantity: 0 }));
  await assert.rejects(updateProductQuantity({ accountId: 'b', pantryId: 'p', productId: changed.id, quantity: 2 }));
  await assert.rejects(deleteProduct({ accountId: 'b', pantryId: 'p', productId: changed.id }));
  await deleteProduct({ accountId: 'a', pantryId: 'p', productId: changed.id });
  assert.equal((await listProducts('a', 'p')).length, 1);
  assert.equal((await readDatabase()).purchases.length, 2, 'Excluir o estoque preserva o histórico de compras.');
  assert.equal((await listProducts('b', 'p2')).length, 0);
  const reloaded = loader()('src/services/productService.js');
  assert.equal((await reloaded.listProducts('a', 'p')).length, 1);
  const fiscalLine = { sourceDescription: 'CAFE MARCA A 500G', quantity: 1, unitLabel: 'UN', unitPrice: 12.35, totalPrice: 12.35 };
  const grouped = groupFiscalItems([fiscalLine, { ...fiscalLine, sourceDescription: ' Café  marca A 500g ', unitLabel: 'un' }]);
  assert.equal(grouped.length, 1);
  assert.equal(grouped[0].quantity, 2);
  assert.equal(grouped[0].totalPrice, 24.7);
  assert.equal(grouped[0].unitPrice, 12.35);
  assert.equal(grouped[0].sourceItems.length, 2);
  for (const different of [{ sourceDescription: 'CAFE MARCA A 1KG' }, { sourceDescription: 'CAFE MARCA B 500G' }, { unitLabel: 'kg' }]) {
    assert.equal(groupFiscalItems([fiscalLine, { ...fiscalLine, ...different }]).length, 2);
  }
  const discounted = groupFiscalItems([fiscalLine, { ...fiscalLine, unitPrice: 10, totalPrice: 9 }])[0];
  assert.equal(discounted.totalPrice, 21.35);
  assert.equal(discounted.unitPrice, 11.175);
  assert.equal(discounted.sourceItems[1].totalPrice, 9);
  assert.equal(discounted.hasDifferentPrices, true);
  const fractional = groupFiscalItems([{ ...fiscalLine, quantity: 0.1 }, { ...fiscalLine, quantity: 0.2 }])[0];
  assert.equal(fractional.quantity, 0.3);
  const fiscalDraft = { accountId: 'a', pantryId: 'p', purchase: { purchasedAt: '2026-09-12T12:00:00-03:00', merchantName: 'Mercado Teste', totalAmount: 24.7, qrFingerprint: 'synthetic-fingerprint' },
    items: [...grouped.map((item) => ({ ...item, ...extractPackageMeasure(item.sourceDescription), selected: true, category: 'outros' })), { ...fiscalLine, sourceDescription: 'Ignorado', selected: false, category: 'outros' }] };
  const beforeFiscal = persisted;
  failWrite = true;
  await assert.rejects(confirmFiscalPurchase(fiscalDraft));
  assert.equal(persisted, beforeFiscal);
  failWrite = false;
  const imported = await confirmFiscalPurchase(fiscalDraft);
  assert.equal(imported.length, 1);
  assert.equal(imported[0].quantity, 2);
  assert.equal(imported[0].totalPrice, 24.7);
  assert.equal(imported[0].category, 'outros');
  assert.equal(imported[0].name, 'CAFE MARCA A');
  assert.equal(imported[0].weight, 500);
  assert.equal(imported[0].unit, 'g');
  const fiscalHistory = (await readDatabase()).purchases.at(-1);
  assert.deepEqual(fiscalHistory.items[0].sourceItems, grouped[0].sourceItems);
  assert.equal(fiscalHistory.items[0].productId, imported[0].id);
  const afterFiscal = persisted;
  await assert.rejects(confirmFiscalPurchase(fiscalDraft), /DUPLICATE_FISCAL_NOTE/);
  assert.equal(persisted, afterFiscal);
  const editMeasure = { ...fiscalDraft, purchase: { ...fiscalDraft.purchase, qrFingerprint: 'synthetic-edit' }, items: [{ ...fiscalDraft.items[0], weight: 0.5, unit: 'kg' }] };
  const corrected = await confirmFiscalPurchase(editMeasure);
  assert.equal(corrected[0].weight, 0.5);
  assert.equal(corrected[0].unit, 'kg');
  await assert.rejects(confirmFiscalPurchase({ ...editMeasure, items: [{ ...editMeasure.items[0], weight: -1 }] }), /INVALID_FISCAL_ITEM/);
  await assert.rejects(confirmFiscalPurchase({ ...editMeasure, items: [{ ...editMeasure.items[0], unit: '' }] }), /INVALID_FISCAL_ITEM/);
  console.log('PASS: repeated fiscal lines, presentation separation, prices, originals, deselection, atomic import and Others.');
  for (const invalid of ['{bad json', 'null', '{"version":999}', '{"version":4,"accounts":[],"pantries":[]}']) {
    persisted = invalid;
    await assert.rejects(addProduct({ ...draft, accountId: 'a', pantryId: 'p' }));
    assert.equal(persisted, invalid, 'Invalid storage must not be reset');
  }
  console.log('PASS: validation, migration v1/v2, account isolation, atomic save failure, concurrent additions, history and reload.');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
