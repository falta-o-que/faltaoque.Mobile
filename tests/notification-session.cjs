const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {transformSync} = require('@babel/core');

let scheduled = [];
let failedStorageReadKey = null;
let storageSetCount = 0;
let pauseAccount = null;
let releasePantries;
let signalPantries;
let started;
const storage = new Map();
const metadataKey = '@faltaoque/notifications/a';
const notificationApi = {
    IosAuthorizationStatus: {PROVISIONAL: 1, DENIED: 2},
    AndroidImportance: {DEFAULT: 3},
    setNotificationChannelAsync: async () => {
    },
    getPermissionsAsync: async () => ({granted: true}),
    getAllScheduledNotificationsAsync: async () => [...scheduled],
    getPresentedNotificationsAsync: async () => [],
    cancelScheduledNotificationAsync: async (id) => {
        scheduled = scheduled.filter((entry) => entry.identifier !== id);
    },
    dismissNotificationAsync: async () => {
    },
    scheduleNotificationAsync: async ({content}) => {
        scheduled.push({identifier: String(scheduled.length + 1), content});
    },
};
const modules = {
    '@react-native-async-storage/async-storage': {
        getItem: async (key) => {
            if (key === failedStorageReadKey) throw new Error('SIMULATED_STORAGE_READ_FAILURE');
            return storage.get(key) ?? null;
        }, setItem: async (key, value) => {
            storageSetCount += 1;
            storage.set(key, value);
        },
    },
    'expo-notifications': notificationApi,
    'react-native': {Platform: {OS: 'android'}},
    '../localization': {translate: (_, key) => key},
    './pantryService': {
        listPantries: async (account) => {
            if (account === pauseAccount) {
                signalPantries();
                await new Promise((resolve) => {
                    releasePantries = resolve;
                });
            }
            return [{id: `pantry-${account}`, name: account}];
        }
    },
    './productService': {
        listProductOccurrences: async () => [],
        listProducts: async () => [{id: 'product', name: 'Produto', quantity: 0}]
    },
};
const file = path.resolve(__dirname, '../src/services/notificationService.js');
const {code} = transformSync(fs.readFileSync(file, 'utf8'), {
    babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs']
});
const moduleObject = {exports: {}};
new Function('require', 'module', 'exports', code)((name) => {
    if (!(name in modules)) throw new Error(`Unexpected import: ${name}`);
    return modules[name];
}, moduleObject, moduleObject.exports);
const {markNotificationRead, setNotificationSession, syncDeviceNotifications} = moduleObject.exports;

async function main() {
    scheduled.push({identifier: 'unrelated', content: {data: {accountId: 'a', notificationId: 'other'}}});
    setNotificationSession('a');
    pauseAccount = 'a';
    started = new Promise((resolve) => {
        signalPantries = resolve;
    });
    const oldSync = syncDeviceNotifications('a');
    await started;
    setNotificationSession(null);
    setNotificationSession('b');
    const newSync = syncDeviceNotifications('b');
    pauseAccount = null;
    releasePantries();
    await Promise.all([oldSync, newSync]);
    assert.equal(scheduled.some((item) => item.content.data.accountId === 'a' && item.identifier !== 'unrelated'), false);
    assert.equal(scheduled.some((item) => item.content.data.accountId === 'b'), true);
    assert.equal(scheduled.some((item) => item.identifier === 'unrelated'), true);

    setNotificationSession(null);
    setNotificationSession('a');
    await syncDeviceNotifications('a');
    assert.equal(scheduled.some((item) => item.content.data.accountId === 'b'), false);
    assert.equal(scheduled.some((item) => item.content.data.accountId === 'a' && item.identifier !== 'unrelated'), true);

    const existingMetadata = JSON.stringify({
        readIds: ['previously-read'], handledById: {}, dismissedIds: ['dismissed'], announcedIds: []
    });
    storage.set(metadataKey, existingMetadata);
    failedStorageReadKey = metadataKey;
    const writesBeforeFailedRead = storageSetCount;
    await assert.rejects(markNotificationRead('a', 'newly-read'), /SIMULATED_STORAGE_READ_FAILURE/);
    assert.equal(storage.get(metadataKey), existingMetadata, 'a read failure preserves the existing notification history');
    assert.equal(storageSetCount, writesBeforeFailedRead, 'a failed read must not be followed by a metadata write');

    failedStorageReadKey = null;
    const invalidMetadata = '{invalid json';
    storage.set(metadataKey, invalidMetadata);
    const writesBeforeInvalidMetadata = storageSetCount;
    await assert.rejects(markNotificationRead('a', 'newly-read'));
    assert.equal(storage.get(metadataKey), invalidMetadata, 'invalid metadata is not replaced by an empty state');
    assert.equal(storageSetCount, writesBeforeInvalidMetadata, 'invalid metadata must not be followed by a write');

    console.log('notification-session tests passed');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
