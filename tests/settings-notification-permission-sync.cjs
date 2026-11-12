const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {transformSync} = require('@babel/core');

const source = fs.readFileSync(path.resolve(__dirname, '../src/screens/SettingsScreen/index.js'), 'utf8');
const {code} = transformSync(source, {
    babelrc: false,
    configFile: false,
    plugins: [['@babel/plugin-transform-react-jsx', {runtime: 'automatic'}], '@babel/plugin-transform-modules-commonjs']
});
const tick = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => {
    let resolve;
    let reject;
    const promise = new Promise((done, fail) => {
        resolve = done;
        reject = fail;
    });
    return {promise, resolve, reject};
};

function createHarness({permissionReads, syncResults = []}) {
    const slots = [];
    const effects = new Map();
    let cursor = 0;
    let appStateHandler;
    let permissionReadCount = 0;
    let syncCount = 0;
    const alerts = [];
    const node = (type, props) => ({type, props: props ?? {}});
    const components = new Proxy({}, {get: (_, key) => String(key)});
    const mocks = {
        react: {
            useState(initial) {
                const i = cursor++;
                if (!(i in slots)) slots[i] = initial;
                return [slots[i], (next) => {
                    slots[i] = typeof next === 'function' ? next(slots[i]) : next;
                }];
            }, useRef(initial) {
                const i = cursor++;
                if (!(i in slots)) slots[i] = {current: initial};
                return slots[i];
            }, useCallback(fn) {
                cursor++;
                return fn;
            }, useEffect(fn) {
                const i = cursor++;
                if (!effects.has(i)) effects.set(i, fn());
            },
        },
        'react/jsx-runtime': {jsx: node, jsxs: node, Fragment: 'Fragment'},
        'react-native': {
            Alert: {alert: (...args) => alerts.push(args)}, AppState: {
                addEventListener: (_event, handler) => {
                    appStateHandler = handler;
                    return {
                        remove() {
                        }
                    };
                }
            }, Linking: {
                openSettings: async () => {
                }, openURL: async () => {
                }
            }, Modal: 'Modal', Platform: {OS: 'android'}, ScrollView: 'ScrollView', Switch: 'Switch',
        },
        'expo-notifications': {
            IosAuthorizationStatus: {PROVISIONAL: 'provisional'}, getPermissionsAsync: () => {
                const result = permissionReads[permissionReadCount++];
                if (!result) throw new Error(`Unexpected permission read ${permissionReadCount}`);
                return result;
            },
        },
        '../../components/FormActions': 'FormActions',
        '../../components/DangerActionButton': 'DangerActionButton',
        '../../components/ModalActionButton': 'ModalActionButton',
        '../../components/ScreenSectionHeading': 'ScreenSectionHeading',
        '../../assets/icons/export': components,
        '../../contexts/AuthContext': {
            useAuth: () => ({
                account: {id: 'account'}, logout: async () => {
                }
            })
        },
        '../../contexts/AppPreferencesContext': {
            useAppPreferences: () => ({
                language: 'pt-BR',
                fontScale: 1,
                isPreferencesLoading: false,
                savePreferences: async (draft) => draft,
                t: (key) => key,
            }),
        },
        '../../services/notificationService': {
            syncDeviceNotifications: async (accountId) => {
                syncCount += 1;
                const result = syncResults[syncCount - 1];
                if (result instanceof Error) throw result;
                if (typeof result === 'function') return result(accountId);
                return result;
            },
        },
        '../../localization': {translate: (language, key) => `${language}:${key}`},
        './styles': components,
    };
    const module = {exports: {}};
    new Function('require', 'module', 'exports', code)((name) => {
        if (!Object.hasOwn(mocks, name)) throw new Error(`Unexpected import ${name}`);
        return mocks[name];
    }, module, module.exports);
    const Screen = module.exports.default;
    const render = () => {
        cursor = 0;
        return Screen({embedded: true});
    };

    function find(tree, predicate) {
        if (tree == null) return null;
        if (Array.isArray(tree)) {
            for (const child of tree) {
                const found = find(child, predicate);
                if (found) return found;
            }
            return null;
        }
        if (typeof tree !== 'object') return null;
        if (predicate(tree)) return tree;
        return find(tree.props?.children, predicate);
    }

    return {
        alerts, emitActive: async () => {
            await appStateHandler?.('active');
        }, find, permissionReadCount: () => permissionReadCount, render, syncCount: () => syncCount,
    };
}

async function permissionGrantSchedulesWithoutSave() {
    const harness = createHarness({
        permissionReads: [Promise.resolve({granted: false}), Promise.resolve({granted: true}), Promise.resolve({granted: true}),],
    });
    harness.render();
    await tick();
    assert.equal(harness.find(harness.render(), (entry) => entry.type === 'Switch').props.value, false);

    await harness.emitActive();
    await tick();
    assert.equal(harness.find(harness.render(), (entry) => entry.type === 'Switch').props.value, true);
    assert.equal(harness.syncCount(), 1, 'permission grant triggers notification sync without saving preferences');

    await harness.emitActive();
    await tick();
    assert.equal(harness.syncCount(), 1, 'subsequent active events do not duplicate the grant sync');
    assert.equal(harness.alerts.length, 0);
}

async function stalePermissionReadCannotUndoGrant() {
    const staleRead = deferred();
    const currentRead = deferred();
    const harness = createHarness({
        permissionReads: [Promise.resolve({granted: false}), staleRead.promise, currentRead.promise,]
    });
    harness.render();
    await tick();
    const firstRefresh = harness.emitActive();
    const secondRefresh = harness.emitActive();
    currentRead.resolve({granted: true});
    await secondRefresh;
    staleRead.resolve({granted: false});
    await firstRefresh;
    await tick();
    assert.equal(harness.find(harness.render(), (entry) => entry.type === 'Switch').props.value, true);
    assert.equal(harness.syncCount(), 1, 'the latest denied-to-granted transition is synchronized once');
}

async function syncFailureOffersRetry() {
    const harness = createHarness({
        permissionReads: [Promise.resolve({granted: false}), Promise.resolve({granted: true})],
        syncResults: [new Error('sync failed'), undefined],
    });
    harness.render();
    await tick();
    await harness.emitActive();
    await tick();
    assert.equal(harness.alerts.length, 1, 'sync failure shows the existing translated retry alert');
    const retry = harness.alerts[0][2][1].onPress;
    await retry();
    assert.equal(harness.syncCount(), 2, 'retry runs notification synchronization again');
}

async function initiallyGrantedPermissionDoesNotDuplicateStartupSync() {
    const harness = createHarness({
        permissionReads: [Promise.resolve({granted: true}), Promise.resolve({granted: true}),]
    });
    harness.render();
    await tick();
    await harness.emitActive();
    await tick();
    assert.equal(harness.syncCount(), 0, 'an already-granted initial permission is not treated as a new grant');
}

(async () => {
    await permissionGrantSchedulesWithoutSave();
    await stalePermissionReadCannotUndoGrant();
    await syncFailureOffersRetry();
    await initiallyGrantedPermissionDoesNotDuplicateStartupSync();
    console.log('settings-notification-permission-sync tests passed');
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
