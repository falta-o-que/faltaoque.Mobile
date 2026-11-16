const assert = require('node:assert/strict');
const {createHarness, seed} = require('./local-test-harness.cjs');

async function main() {
    const harness = createHarness();
    await seed(harness);
    const {updateDatabase} = harness.load('src/storage/localDatabase.js');
    let pantryId;
    await updateDatabase((database, metadata) => {
        harness.load('src/services/demoData.js').createDemoData(database, metadata);
        pantryId = database.pantries.find((pantry) => pantry.id !== 'p').id;
        return database;
    });
    const lists = await harness.load('src/services/groceryListService.js').listGroceryLists(
        harness.load('src/services/demoData.js').DEMO_ACCOUNT_ID, pantryId);
    const list = lists.find((entry) => entry.status === 'active');
    const previousFetch = global.fetch;
    const previousKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY = 'test';
    let resolveFetch;
    global.fetch = () => new Promise((resolve) => { resolveFetch = resolve; });
    try {
        const {getGroceryMarketSuggestions} = harness.load('src/services/groceryMarketSuggestionService.js');
        let initial;
        const pending = getGroceryMarketSuggestions({pantryId, pantryCep: '04046400',
            list,
            onInitialOptions: (options) => { initial = options; }});
        while (!resolveFetch) await new Promise((resolve) => setImmediate(resolve));
        assert.equal(initial[0].disabled, true);
        assert.ok(initial[1].candidate.estimate.estimatedPrice > 0);
        assert.equal(initial[2].candidate.brandCoverage.available, 8);
        resolveFetch({ok: true, json: async () => ({status: 'OK', results: [{geometry: {location: {lat: -23.625, lng: -46.638}}}]})});
        const final = await pending;
        assert.equal(final[0].disabled, false);
        assert.deepEqual(final.map((option) => option.candidate.market.local_name), [
            'Atacadão Indianópolis', 'Carrefour Express Moema', 'Minuto Pão de Açúcar',
        ]);
        assert.equal(final[1].candidate.estimate.estimatedPrice, initial[1].candidate.estimate.estimatedPrice);
    } finally {
        global.fetch = previousFetch;
        if (previousKey === undefined) delete process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
        else process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY = previousKey;
    }
    console.log('grocery-market-suggestions tests passed');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
