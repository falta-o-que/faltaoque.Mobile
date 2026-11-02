const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {transformSync} = require('@babel/core');
const {createHarness, seed} = require('./local-test-harness.cjs');

function loadNotificationService(harness) {
    const scheduled = [];
    const metadata = new Map();
    const notificationApi = {
        IosAuthorizationStatus: {PROVISIONAL: 1, DENIED: 2},
        AndroidImportance: {DEFAULT: 3},
        setNotificationChannelAsync: async () => {},
        getPermissionsAsync: async () => ({granted: true}),
        getAllScheduledNotificationsAsync: async () => [...scheduled],
        getPresentedNotificationsAsync: async () => [],
        cancelScheduledNotificationAsync: async (identifier) => {
            const index = scheduled.findIndex((item) => item.identifier === identifier);
            if (index >= 0) scheduled.splice(index, 1);
        },
        dismissNotificationAsync: async () => {},
        scheduleNotificationAsync: async ({content}) => {
            const identifier = `scheduled-${scheduled.length + 1}`;
            scheduled.push({identifier, content});
            return identifier;
        },
    };
    const modules = {
        '@react-native-async-storage/async-storage': {
            getItem: async (key) => metadata.get(key) ?? null,
            setItem: async (key, value) => metadata.set(key, value),
        },
        'expo-notifications': notificationApi,
        'react-native': {Platform: {OS: 'android'}},
        '../localization': {
            translate: (_language, key, values) => `${key}${values?.product ? `: ${values.product}` : ''}`,
        },
        './pantryService': harness.load('src/services/pantryService.js'),
        './productService': harness.load('src/services/productService.js'),
    };
    const file = path.resolve(__dirname, '../src/services/notificationService.js');
    const {code} = transformSync(fs.readFileSync(file, 'utf8'), {
        babelrc: false,
        configFile: false,
        plugins: ['@babel/plugin-transform-modules-commonjs'],
    });
    const moduleObject = {exports: {}};
    new Function('require', 'module', 'exports', code)((name) => {
        if (!Object.hasOwn(modules, name)) throw new Error(`Unexpected import: ${name}`);
        return modules[name];
    }, moduleObject, moduleObject.exports);
    return {...moduleObject.exports, scheduled};
}

async function addRiceBrands(harness, {brandAQuantity = 1, brandBQuantity = 2, grouping = 'separate'} = {}) {
    const {addProduct, setProductBrandGrouping, updateProductQuantity} = harness.load('src/services/productService.js');
    const {getProductPresentationKey} = harness.load('src/domain/pantryProductGrouping.js');
    const scope = {accountId: 'a', pantryId: 'p'};
    const brandA = await addProduct({...scope, name: 'Arroz', brand: 'Marca A', quantity: String(brandAQuantity), price: '5', category: 'bebidas'});
    const brandB = await addProduct({...scope, name: 'Arroz', brand: 'Marca B', quantity: String(brandBQuantity), price: '7', category: 'bebidas'});
    await setProductBrandGrouping('a', 'p', getProductPresentationKey({name: 'Arroz'}), grouping);
    return {
        brandA,
        brandB,
        zero: (product) => updateProductQuantity({...scope, productIds: [product.id], quantity: 0}),
    };
}

async function separatedBrandGetsItsOwnNotification() {
    const harness = createHarness();
    await seed(harness);
    const notifications = loadNotificationService(harness);
    const {brandA, brandB, zero} = await addRiceBrands(harness);
    await zero(brandA);

    const pantryService = harness.load('src/services/productService.js');
    const cards = await pantryService.listProducts('a', 'p');
    assert.equal(cards.length, 2, 'the zeroed separated brand remains its own card');
    assert.equal(cards.find((card) => card.occurrenceIds.includes(brandA.id)).quantity, 0);
    assert.equal(cards.find((card) => card.occurrenceIds.includes(brandB.id)).quantity, 2);

    let items = await notifications.listNotifications('a');
    assert.equal(items.length, 1, 'only the zeroed separated brand creates a depleted notification');
    assert.match(items[0].title, /Marca A/);
    assert.doesNotMatch(items[0].title, /Marca B/);

    notifications.setNotificationSession('a');
    await notifications.syncDeviceNotifications('a');
    assert.equal(notifications.scheduled.length, 1, 'the zeroed brand is scheduled on the device');
    assert.match(notifications.scheduled[0].content.body, /Marca A/);

    await zero(brandB);
    items = await notifications.listNotifications('a');
    assert.equal(items.length, 2, 'both separately displayed zeroed brands keep their own notification');
    assert.deepEqual(items.map((item) => item.title).sort(), [
        'notifications.productDepletedTitle: Arroz · Marca A',
        'notifications.productDepletedTitle: Arroz · Marca B',
    ]);
}

async function groupedBrandsWaitForTheCombinedStockToReachZero() {
    const harness = createHarness();
    await seed(harness);
    const notifications = loadNotificationService(harness);
    const {brandA, brandB, zero} = await addRiceBrands(harness, {grouping: 'grouped'});
    await zero(brandA);
    assert.equal((await notifications.listNotifications('a')).length, 0, 'a grouped product stays stocked while B has units');

    await zero(brandB);
    const items = await notifications.listNotifications('a');
    assert.equal(items.length, 1, 'grouped brands produce one notification for the combined product');
    assert.equal(items[0].title, 'notifications.productDepletedTitle: Arroz');
}

async function sameBrandPurchasesStillAggregate() {
    const harness = createHarness();
    await seed(harness);
    const {addProduct, setProductBrandGrouping, updateProductQuantity, listProducts} = harness.load('src/services/productService.js');
    const {getProductPresentationKey} = harness.load('src/domain/pantryProductGrouping.js');
    const scope = {accountId: 'a', pantryId: 'p'};
    const older = await addProduct({...scope, name: 'Arroz', brand: 'Marca A', quantity: '1', price: '5', category: 'bebidas'});
    await addProduct({...scope, name: 'Arroz', brand: 'Marca A', quantity: '2', price: '9', category: 'bebidas'});
    await setProductBrandGrouping('a', 'p', getProductPresentationKey({name: 'Arroz'}), 'separate');
    await updateProductQuantity({...scope, productIds: [older.id], quantity: 0});

    const cards = await listProducts('a', 'p');
    assert.equal(cards.length, 1, 'purchases of one brand remain one product when brands are separated');
    assert.equal(cards[0].quantity, 2, 'remaining same-brand stock keeps the separated product active');
}

(async () => {
    await separatedBrandGetsItsOwnNotification();
    await groupedBrandsWaitForTheCombinedStockToReachZero();
    await sameBrandPurchasesStillAggregate();
    console.log('separated-brand-depleted-notification tests passed');
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
