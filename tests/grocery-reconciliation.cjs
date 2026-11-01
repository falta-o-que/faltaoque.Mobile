const assert = require('node:assert/strict');
const { createHarness } = require('./local-test-harness.cjs');
const { findAutomaticPlannedMatch, normalizeFiscalProduct, reconcileGroceryCheckout, RECONCILIATION_STATUS } =
  createHarness().load('src/domain/groceryCheckoutReconciliation.js');

const auto = RECONCILIATION_STATUS.AUTO_MATCHED;
const manual = RECONCILIATION_STATUS.MANUAL_REVIEW;
const match = (plannedName, receiptName) => findAutomaticPlannedMatch(
  normalizeFiscalProduct(receiptName), [{ id: 'item', name: plannedName }],
);

assert.equal(match('Chocolate', 'Chocolate Granulado').status, manual);
assert.equal(match('Leite Integral', 'Leite Integral em Pó').status, manual);
assert.equal(match('Chocolate', 'Caixa Chocolate').status, manual);
assert.equal(match('Chocolate', 'Chocolate Chocolate').status, manual);
assert.equal(match('Leite Integral', 'Integral Leite').status, manual);
assert.equal(match('Café torrado', 'CAFE TORRADO').status, auto);
assert.equal(match('Biscoito Recheio', 'BISC. RECH.').status, auto);
assert.equal(match('Leite Integral', 'LEITE INTEGRAL NESTLE 1L').status, auto);
const incompatible = findAutomaticPlannedMatch(normalizeFiscalProduct('Leite Integral 1L'), [
  { id: 'item', name: 'Leite Integral', weight: 500, unit: 'ml' },
]);
assert.equal(incompatible.status, manual);
const duplicate = reconcileGroceryCheckout({ plannedItems: [{ id: 'item', name: 'Café' }],
  fiscalLines: [{ sourceDescription: 'Café' }, { sourceDescription: 'Café' }] });
assert.equal(duplicate.automaticMatches.length, 0);
assert.equal(duplicate.fiscalLinesForManualReview.length, 2);
console.log('grocery-reconciliation tests passed');
