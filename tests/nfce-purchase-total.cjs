const assert = require('node:assert/strict');
const { createHarness, seed } = require('./local-test-harness.cjs');

async function main() {
  const h = createHarness();
  await seed(h);
  const { confirmFiscalPurchase } = h.load('src/services/nfceImportService.js');
  const { readDatabase } = h.load('src/storage/localDatabase.js');
  const purchase = { qrCodeId: '12345', purchasedAt: '2026-01-01', totalAmount: 25 };
  const items = [
    { selected: true, name: 'Café', sourceDescription: 'CAFE', quantity: 1, unitPrice: 20, totalPrice: 20, category: 'bebidas' },
    { selected: false, name: 'Leite', sourceDescription: 'LEITE', quantity: 1, unitPrice: 5, totalPrice: 5, category: 'bebidas' },
    { selected: true, name: 'Sacola', sourceDescription: 'SACOLA PLASTICA', quantity: 1, unitPrice: 1, totalPrice: 1, category: 'outros' },
  ];
  const input = { accountId: 'a', pantryId: 'p', purchase, items };
  for (const totalAmount of [undefined, null, NaN, Infinity, 0, -1]) {
    await assert.rejects(confirmFiscalPurchase({ ...input, purchase: { ...purchase, totalAmount } }), /INVALID_FISCAL_TOTAL/);
  }
  assert.equal((await readDatabase()).purchases.length, 0);
  await confirmFiscalPurchase(input);
  const db = await readDatabase();
  assert.equal(db.purchases[0].total_price, 25);
  assert.equal(db.pantry_products.length, 1);
  assert.equal(db.pantry_products[0].price, 20);
  assert.equal(db.pantry_products[0].purchase_id, db.purchases[0].id);
  console.log('nfce-purchase-total tests passed');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
