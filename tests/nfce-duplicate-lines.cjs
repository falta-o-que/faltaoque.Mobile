const assert = require('node:assert/strict');
const {createHarness, seed} = require('./local-test-harness.cjs');

async function main() {
    const h = createHarness();
    await seed(h);
    const {loadFiscalPurchase, confirmFiscalPurchase} = h.load('src/services/nfceImportService.js');
    const {readDatabase} = h.load('src/storage/localDatabase.js');
    const qrCodeId = '1'.repeat(44);
    const url = `https://www.nfce.fazenda.sp.gov.br/consulta?p=${qrCodeId}|3|1`;
    const itemRow = (price) => `<tr><td><span class="txtTit">LEITE UHT 1L</span><span class="Rqtd"><strong>Qtde.:</strong>1</span><span class="RUN"><strong>UN:</strong>und1</span><span class="RvlUnit"><strong>Vl. Unit.:</strong>${price},00</span></td><td><span class="valor">${price},00</span></td></tr>`;
    const html = `<div id="u20">Mercado Exemplo</div><table id="tabResult">${itemRow(5)}${itemRow(6)}</table><span class="totalNumb txtMax">11,00</span><strong>Emissão: </strong>12/09/2026 14:58:45`;
    global.fetch = async () => ({ok: true, text: async () => html});

    const purchase = await loadFiscalPurchase(url, 'a');
    assert.equal(purchase.items.length, 1, 'identical product lines are shown together in review');
    assert.equal(purchase.items[0].quantity, 2);
    assert.equal(purchase.items[0].totalPrice, 11);
    assert.equal(purchase.items[0].sourceItems.length, 2, 'original fiscal lines remain available for the duplicate warning and traceability');
    assert.equal(purchase.items[0].hasDifferentPrices, true);

    await confirmFiscalPurchase({
        accountId: 'a', pantryId: 'p', purchase, location: '01001000', items: purchase.items.map((item) => ({
            ...item, name: 'Leite UHT', brand: '', category: 'bebidas', selected: true, reviewed: true,
        })),
    });
    const database = await readDatabase();
    assert.equal(database.pantry_products.length, 1, 'duplicate receipt lines create one pantry occurrence');
    assert.equal(database.pantry_products[0].quantity, 2, 'the occurrence has the summed quantity');
    assert.equal(database.pantry_products[0].price, 11, 'the occurrence keeps the summed receipt price');
    assert.equal(database.purchases[0].total_price, 11);
    console.log('nfce-duplicate-lines tests passed');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
