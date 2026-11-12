const assert = require('node:assert/strict');
const {createHarness} = require('./local-test-harness.cjs');

const h = createHarness();
const {validateGroceryListForm} = h.load('src/domain/groceryListFormValidation.js');
const catalogs = h.load('src/localization/catalogs/shared.js').default;
const valid = {name: 'Mercado', plannedDate: '', marketQuery: '', selectedMarket: null};
const nameError = {field: 'name', messageKey: 'shoppingModal.listNameError'};
const dateError = {field: 'plannedDate', messageKey: 'shoppingModal.dateError'};
const marketError = {field: 'market', messageKey: 'shoppingModal.marketError'};

assert.deepEqual(validateGroceryListForm({...valid, name: '  '}), nameError);
assert.deepEqual(validateGroceryListForm({...valid, plannedDate: '31/02/2099'}), dateError);
assert.deepEqual(validateGroceryListForm({...valid, plannedDate: '01/01/2000'}), dateError);
assert.deepEqual(validateGroceryListForm({...valid, marketQuery: 'Mercado sem seleção'}), marketError);
assert.equal(validateGroceryListForm(valid), null);
assert.equal(validateGroceryListForm({...valid, plannedDate: '01/01/9999', marketQuery: 'Mercado', selectedMarket: {cep: '00000000'}}), null);
assert.deepEqual(validateGroceryListForm({...valid, name: '', plannedDate: 'inválida', marketQuery: 'Mercado'}), nameError);
assert.deepEqual(validateGroceryListForm({...valid, plannedDate: 'inválida', marketQuery: 'Mercado'}), dateError);

for (const {messageKey} of [nameError, dateError, marketError]) {
    const translations = ['pt-BR', 'en', 'es'].map((language) => catalogs[language][messageKey]);
    assert.ok(translations.every((text) => typeof text === 'string' && text.length > 0), `${messageKey} must be translated in each language`);
    assert.equal(new Set(translations).size, 3, `${messageKey} must have distinct translations`);
}
console.log('grocery-list-validation-locales tests passed');
