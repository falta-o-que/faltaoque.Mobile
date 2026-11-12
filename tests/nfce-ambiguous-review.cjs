const assert = require('node:assert/strict');
const {createHarness, seed} = require('./local-test-harness.cjs');

async function main() {
  const h = createHarness();
  await seed(h);
  const {normalizeFiscalProduct} = h.load('src/domain/groceryCheckoutReconciliation.js');
  const {confirmFiscalPurchase} = h.load('src/services/nfceImportService.js');
  const {readDatabase} = h.load('src/storage/localDatabase.js');
  const description = 'REFRIGERANTE PACK 6 X 350ML';
  assert.equal(normalizeFiscalProduct(description).requiresReview, true);
  const ambiguous = {selected: true, name: 'Refrigerante', sourceDescription: description, quantity: 1, totalPrice: 20, unitPrice: 20, category: 'bebidas'};
  const normal = {selected: true, name: 'Água', sourceDescription: 'AGUA', quantity: 1, totalPrice: 5, unitPrice: 5, category: 'bebidas'};
  const input = {accountId: 'a', pantryId: 'p', purchase: {qrCodeId: 'b12', purchasedAt: '2026-01-01', totalAmount: 25}, items: [ambiguous, normal]};
  await assert.rejects(confirmFiscalPurchase(input), /FISCAL_REVIEW_REQUIRED/);
  assert.equal((await readDatabase()).purchases.length, 0);
  await confirmFiscalPurchase({...input, items: [{...ambiguous, reviewed: true}, normal]});
  assert.equal((await readDatabase()).pantry_products.length, 2);
  await confirmFiscalPurchase({...input, purchase: {...input.purchase, qrCodeId: 'b12-ignored'}, items: [{...ambiguous, selected: false}, normal]});
  assert.equal((await readDatabase()).pantry_products.length, 3);
  console.log('nfce-ambiguous-review tests passed');
}
main().catch((error) => {console.error(error); process.exitCode = 1;});
