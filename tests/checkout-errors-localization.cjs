const assert = require('node:assert/strict');
const fs = require('node:fs');
const {transformSync} = require('@babel/core');
const {createHarness, seed} = require('./local-test-harness.cjs');

async function main() {
    const h = createHarness();
    await seed(h);
    const lists = h.load('src/services/groceryListService.js');
    const {finalizeGroceryCheckout} = h.load('src/services/groceryCheckoutService.js');
    const errors = h.load('src/localization/catalogs/errors.js');
    const shared = h.load('src/localization/catalogs/shopping.js').default;
    const translate = (language, key) => errors.default[language][key] ?? shared[language][key] ?? key;
    const {code} = transformSync(fs.readFileSync('src/utils/userErrors.js', 'utf8'), {
        babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
    });
    const errorModule = {exports: {}};
    new Function('require', 'module', 'exports', code)((name) => {
        if (name === 'react-native') return {
            Alert: {
                alert() {
                }
            }
        };
        if (name === '../localization') return {translate};
        if (name === '../localization/catalogs/errors') return errors;
        throw new Error(`Unexpected import ${name}`);
    }, errorModule, errorModule.exports);
    const {getUserErrorMessage} = errorModule.exports;
    const scope = {accountId: 'a', pantryId: 'p'};
    const list = await lists.createGroceryList({...scope, name: 'Mercado'});
    const item = await lists.addGroceryItem({
        ...scope, listId: list.id, name: 'Café', quantity: 1, category: 'bebidas', weight: 500, unit: 'g'
    });
    const product = {
        included: true, name: 'Café', quantity: '1', priceInput: '10', priceMode: 'unit', category: 'bebidas'
    };
    const input = {...scope, listId: list.id, mode: 'manual', dateValue: '2020-01-01', items: [product]};
    const nfce = {...input, mode: 'nfce', purchase: {qrCodeId: '123', purchasedAt: '2020-01-01', totalAmount: 10}};
    const cases = [[{...input, accountId: null}, 'CHECKOUT_LIST_UNAVAILABLE'], [{
        ...input, listId: 'missing'
    }, 'CHECKOUT_LIST_INACTIVE'], [{...input, dateValue: 'bad'}, 'CHECKOUT_DATE_INVALID'], [{
        ...input, marketQuery: 'loja'
    }, 'CHECKOUT_MARKET_INVALID'], [{...nfce, purchase: null}, 'CHECKOUT_RECEIPT_INVALID'], [{
        ...nfce, dateValue: '2020-01-02'
    }, 'CHECKOUT_RECEIPT_DATE_CHANGED'], [{
        ...nfce, items: [{...product, sourceDescription: 'A', listItemId: item.id}, {
            ...product, sourceDescription: 'B', listItemId: item.id
        }]
    }, 'CHECKOUT_DUPLICATE_LINK'], [{
        ...input, items: [{...product, needsReview: true, reviewed: false}]
    }, 'CHECKOUT_REVIEW_REQUIRED'], [{
        ...input, items: [{...product, name: ''}]
    }, 'CHECKOUT_ITEM_IDENTITY_INVALID'], [{
        ...input, items: [{...product, quantity: '0'}]
    }, 'CHECKOUT_ITEM_QUANTITY_INVALID'], [{
        ...input, items: [{...product, contentValue: '0', unit: 'g'}]
    }, 'CHECKOUT_ITEM_MEASURE_INVALID'], [{
        ...input, items: [{...product, priceInput: '0'}]
    }, 'CHECKOUT_ITEM_PRICE_INVALID'], [{
        ...input, items: [{...product, category: 'invalid'}]
    }, 'CHECKOUT_ITEM_CATEGORY_INVALID'], [{
        ...input, items: [{...product, listItemId: 'missing'}]
    }, 'CHECKOUT_ITEM_LINK_INVALID'], [{
        ...input, items: [{...product, listItemId: item.id, contentValue: '1', unit: 'L'}]
    }, 'CHECKOUT_ITEM_PRESENTATION_INVALID'], [{
        ...input, items: [{
            ...product, categoryConflict: {listCategory: 'bebidas', pantryCategory: 'outros'}, categoryResolved: false
        }]
    }, 'CHECKOUT_CATEGORY_CONFLICT'],];
    for (const [params, expected] of cases) {
        let error;
        try {
            await finalizeGroceryCheckout(params);
        } catch (caught) {
            error = caught;
        }
        assert.ok(error, `expected rejection for ${expected}`);
        assert.equal(error.message, expected);
        const messages = ['pt-BR', 'en', 'es'].map((language) => getUserErrorMessage(error, 'fallback', (key) => translate(language, key)));
        assert.ok(messages.every((message) => message !== 'fallback' && !message.includes(expected)), `${expected} must be translated`);
        assert.equal(new Set(messages).size, 3, `${expected} must be localized in all languages`);
    }
    for (const language of ['pt-BR', 'en', 'es']) {
        const fallback = translate(language, 'shopping.actionErrorFallback');
        assert.equal(getUserErrorMessage(new Error('SQL_SECRET_UNEXPECTED'), fallback, (key) => translate(language, key)), fallback);
    }
    console.log('checkout-errors-localization tests passed');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
