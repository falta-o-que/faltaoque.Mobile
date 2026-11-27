const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {transformSync} = require('@babel/core');

const data = new Map();
let failReads = false;
let writes = 0;
const storage = {
    getItem: async (key) => {
        if (failReads) throw new Error('read failed');
        return data.has(key) ? data.get(key) : null;
    }, setItem: async (key, value) => {
        writes += 1;
        data.set(key, value);
    }, removeItem: async (key) => data.delete(key),
};

const file = path.resolve(__dirname, '../src/services/pantryProductViewPreferenceService.js');
const {code} = transformSync(fs.readFileSync(file, 'utf8'), {
    babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
});
const moduleObject = {exports: {}};
new Function('require', 'module', 'exports', code)((name) => name === '@react-native-async-storage/async-storage' ? storage : require(name), moduleObject, moduleObject.exports,);

const {
    getPantryProductViewPreferences, savePantryProductBrandGrouping, savePromptedDuplicateCount,
} = moduleObject.exports;
const keyFor = (accountId, pantryId) => `@faltaoque/pantry-brand-view/${encodeURIComponent(accountId)}/${encodeURIComponent(pantryId)}`;

async function main() {
    assert.deepEqual(await getPantryProductViewPreferences('account-a', 'pantry-a'), {
        brandGroupingByPresentation: {}, promptedDuplicateCounts: {},
    });
    data.set(keyFor('legacy-account', 'legacy-pantry'), JSON.stringify({promptedDuplicateCounts: {product: 1}}));
    assert.deepEqual(await getPantryProductViewPreferences('legacy-account', 'legacy-pantry'), {
        brandGroupingByPresentation: {}, promptedDuplicateCounts: {product: 1},
    });

    const valid = {
        brandGroupingByPresentation: {'rice:5kg': 'separate'}, promptedDuplicateCounts: {'rice:5kg': 2},
    };
    data.set(keyFor('account-a', 'pantry-a'), JSON.stringify(valid));
    assert.deepEqual(await getPantryProductViewPreferences('account-a', 'pantry-a'), valid);
    assert.deepEqual(await getPantryProductViewPreferences('account-b', 'pantry-a'), {
        brandGroupingByPresentation: {}, promptedDuplicateCounts: {},
    });

    failReads = true;
    await assert.rejects(getPantryProductViewPreferences('account-a', 'pantry-a'), /read failed/);
    await assert.rejects(savePantryProductBrandGrouping('account-a', 'pantry-a', 'beans:1kg', 'grouped'), /read failed/);
    await assert.rejects(savePromptedDuplicateCount('account-a', 'pantry-a', 'beans:1kg', 2), /read failed/);
    failReads = false;
    assert.equal(writes, 0);
    assert.equal(data.get(keyFor('account-a', 'pantry-a')), JSON.stringify(valid));

    const invalidPayloads = ['{', 'null', '[]', JSON.stringify({brandGroupingByPresentation: null}), JSON.stringify({brandGroupingByPresentation: []}), JSON.stringify({promptedDuplicateCounts: null}), JSON.stringify({promptedDuplicateCounts: []}), JSON.stringify({brandGroupingByPresentation: {product: 'unknown'}}), JSON.stringify({promptedDuplicateCounts: {product: -1}}),];
    for (const payload of invalidPayloads) {
        data.set(keyFor('account-a', 'pantry-a'), payload);
        await assert.rejects(getPantryProductViewPreferences('account-a', 'pantry-a'));
        await assert.rejects(savePantryProductBrandGrouping('account-a', 'pantry-a', 'beans:1kg', 'grouped'));
        await assert.rejects(savePromptedDuplicateCount('account-a', 'pantry-a', 'beans:1kg', 2));
        assert.equal(data.get(keyFor('account-a', 'pantry-a')), payload);
    }
    assert.equal(writes, 0);

    data.set(keyFor('account-a', 'pantry-a'), JSON.stringify(valid));
    await savePantryProductBrandGrouping('account-a', 'pantry-a', 'beans:1kg', 'grouped');
    await savePromptedDuplicateCount('account-a', 'pantry-a', 'beans:1kg', 3);
    assert.deepEqual(JSON.parse(data.get(keyFor('account-a', 'pantry-a'))), {
        brandGroupingByPresentation: {'rice:5kg': 'separate', 'beans:1kg': 'grouped'},
        promptedDuplicateCounts: {'rice:5kg': 2, 'beans:1kg': 3},
    });

    console.log('pantry-product-view-preferences tests passed');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
