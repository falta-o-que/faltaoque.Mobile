const assert = require('node:assert/strict');
const {createHarness, seed} = require('./local-test-harness.cjs');

async function main() {
    const h = createHarness();
    const {updateFiscalReviewPrice} = h.load('src/domain/fiscalReviewPrices.js');
    const original = {quantity: '2', unitPrice: '10,00', totalPrice: '20,00'};
    const unit = updateFiscalReviewPrice(original, 'unitPrice', '5,00');
    assert.equal(unit.totalPrice, '10,00');
    const more = updateFiscalReviewPrice(unit, 'quantity', '3');
    assert.equal(more.totalPrice, '15,00');
    const total = updateFiscalReviewPrice(more, 'totalPrice', '24,00');
    assert.equal(total.unitPrice, '8,00');
    assert.equal(updateFiscalReviewPrice(total, 'quantity', '2').unitPrice, '12,00');
    assert.equal(updateFiscalReviewPrice(unit, 'unitPrice', '').totalPrice, '');
    assert.equal(updateFiscalReviewPrice({...original, quantity: '0,5'}, 'unitPrice', '6,00').totalPrice, '3,00');

    await seed(h);
    const {confirmFiscalPurchase} = h.load('src/services/nfceImportService.js');
    const {readDatabase} = h.load('src/storage/localDatabase.js');
    const number = (value) => Number(value.replace(',', '.'));
    await confirmFiscalPurchase({
        accountId: 'a',
        pantryId: 'p',
        purchase: {qrCodeId: 'b11', purchasedAt: '2026-01-01', totalAmount: 20},
        items: [{
            ...unit,
            selected: true,
            name: 'Café',
            sourceDescription: 'CAFE',
            quantity: number(unit.quantity),
            unitPrice: number(unit.unitPrice),
            totalPrice: number(unit.totalPrice),
            category: 'bebidas'
        }]
    });
    const db = await readDatabase();
    assert.equal(db.pantry_products[0].price, 10);
    assert.equal(db.pantry_products[0].price / db.pantry_products[0].quantity, 5);
    assert.equal(db.purchases[0].total_price, 20);
    console.log('nfce-review-prices tests passed');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
