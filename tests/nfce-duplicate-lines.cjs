const assert = require('node:assert/strict');
const {createHarness, seed} = require('./local-test-harness.cjs');

async function main() {
    const h = createHarness();
    await seed(h);
    const {loadFiscalPurchase, confirmFiscalPurchase} = h.load('src/services/nfceImportService.js');
    const {hasGroupedFiscalLines} = h.load('src/domain/fiscalItems.js');
    const {readDatabase} = h.load('src/storage/localDatabase.js');
    const qrCodeId = '1'.repeat(44);
    const url = `https://www.nfce.fazenda.sp.gov.br/consulta?p=${qrCodeId}|3|1`;
    const itemRow = (price, quantity = 1) => `<tr><td><span class="txtTit">LEITE UHT 1L</span><span class="Rqtd"><strong>Qtde.:</strong>${quantity}</span><span class="RUN"><strong>UN:</strong>und1</span><span class="RvlUnit"><strong>Vl. Unit.:</strong>${price},00</span></td><td><span class="valor">${price * quantity},00</span></td></tr>`;
    // Four matching fiscal rows prove grouping continues beyond a pair.
    let html = `<div id="u20">Mercado Exemplo</div><table id="tabResult">${itemRow(5)}${itemRow(6)}${itemRow(7)}${itemRow(8)}</table><span class="totalNumb txtMax">26,00</span><strong>Emissão: </strong>12/09/2026 14:58:45`;
    global.fetch = async () => ({ok: true, text: async () => html});

    const purchase = await loadFiscalPurchase(url, 'a');
    assert.equal(purchase.items.length, 1, 'four identical product lines are shown as one review item');
    assert.equal(purchase.items[0].quantity, 4, 'quantities from all four fiscal rows are summed');
    assert.equal(purchase.items[0].totalPrice, 26, 'prices from all four fiscal rows are summed');
    assert.equal(purchase.items[0].unitPrice, 6.5, 'unit price reflects the weighted average of source rows');
    assert.equal(purchase.items[0].sourceItems.length, 4, 'all original fiscal lines remain available for the duplicate warning and traceability');
    assert.equal(hasGroupedFiscalLines(purchase.items[0]), true, 'separate identical fiscal rows count as grouped duplicates');
    assert.equal(purchase.items[0].hasDifferentPrices, true);

    await confirmFiscalPurchase({
        accountId: 'a', pantryId: 'p', purchase, location: '01001000', items: purchase.items.map((item) => ({
            ...item, name: 'Leite UHT', brand: '', category: 'bebidas', selected: true, requiresReview: true,
        })),
    });
    const database = await readDatabase();
    assert.equal(database.pantry_products.length, 1, 'duplicate receipt lines create one pantry occurrence');
    assert.equal(database.pantry_products[0].quantity, 4, 'the single occurrence has the summed quantity');
    assert.equal(database.pantry_products[0].price, 26, 'the single occurrence keeps the summed receipt price');
    assert.equal(database.purchases[0].total_price, 26);

    html = `<div id="u20">Mercado Exemplo</div><table id="tabResult">${itemRow(5, 6)}</table><span class="totalNumb txtMax">30,00</span><strong>Emissão: </strong>12/09/2026 14:58:45`;
    const singleRowPurchase = await loadFiscalPurchase(url, 'b');
    assert.equal(singleRowPurchase.items.length, 1, 'one fiscal row with six units remains one item');
    assert.equal(singleRowPurchase.items[0].quantity, 6, 'the six units are read from the row quantity');
    assert.equal(singleRowPurchase.items[0].totalPrice, 30);
    assert.equal(singleRowPurchase.items[0].sourceItems.length, 1, 'the source list counts fiscal rows, not units');
    assert.equal(hasGroupedFiscalLines(singleRowPurchase.items[0]), false, 'one row with six units must not trigger the duplicate notice');
    console.log('nfce-duplicate-lines tests passed');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
