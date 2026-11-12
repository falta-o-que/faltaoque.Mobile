const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {transformSync} = require('@babel/core');

const source = fs.readFileSync(path.resolve(__dirname, '../src/screens/PantryScreen/index.js'), 'utf8');
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

function createHarness({occurrences, preferences = {promptedDuplicateCounts: {}}, preferencesPromise} = {}) {
    const slots = [];
    let cursor = 0;
    let focusEffect;
    const alerts = [];
    const preferenceWrites = [];
    const timers = new Map();
    let timerId = 0;
    let currentOccurrences = occurrences ?? [];
    const addProduct = async () => {
        currentOccurrences = [...currentOccurrences, {
            id: 'new', name: 'Arroz', brand: 'Marca B', contentValue: 1, unitOfMeasure: 'kg', quantity: 1,
        }];
    };
    const treeNode = (type, props) => ({type, props: props ?? {}});
    const components = new Proxy({}, {get: (_, key) => String(key)});
    const AddProductModal = function AddProductModal() {
    };
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
            },
        },
        'react/jsx-runtime': {jsx: treeNode, jsxs: treeNode, Fragment: 'Fragment'},
        'react-native': {
            ActivityIndicator: 'ActivityIndicator',
            Alert: {alert: (...args) => alerts.push(args)},
            SectionList: 'SectionList',
        },
        '@react-navigation/native': {
            useFocusEffect: (fn) => {
                focusEffect = fn;
            }
        },
        '../../assets/icons/export': components,
        '../../components/CategoryTag': 'CategoryTag',
        '../../components/ModalActionButton': 'ModalActionButton',
        '../../components/Navbar': 'Navbar',
        '../../components/SearchField': 'SearchField',
        '../../components/ProductCard': 'ProductCard',
        '../../components/AddProductModal': {__esModule: true, default: AddProductModal},
        '../../components/ProductInfoModal': 'ProductInfoModal',
        '../../components/ProductFilterModal': 'ProductFilterModal',
        '../../components/AddProductMethodModal': 'AddProductMethodModal',
        '../../components/NfceScannerModal': 'NfceScannerModal',
        '../../contexts/AuthContext': {useAuth: () => ({account: {id: 'account'}})},
        '../../contexts/AppPreferencesContext': {useAppPreferences: () => ({t: (key) => key, language: 'pt-BR'})},
        '../../domain/pantryProductGrouping': {
            getProductPresentationKey: (product) => `${product.name}:${product.contentValue}:${product.unitOfMeasure}`,
            hasDistinctBrands: (items) => new Set(items.map((item) => (item.brand ?? '').toLowerCase())).size > 1,
            normalizeProductIdentity: (value) => String(value ?? '').trim().toLowerCase(),
        },
        '../../navigation/routes': {AUTHENTICATED_ROUTES: {}},
        '../../services/pantryService': {listPantries: async () => [{id: 'pantry', name: 'Despensa'}]},
        '../../services/notificationService': {
            syncDeviceNotifications: async () => {
            }
        },
        '../../services/productService': {
            addProduct,
            assertFiscalNoteUnused: async () => {
            },
            deleteProduct: async () => {
            },
            getProductViewPreferences: async () => typeof preferencesPromise === 'function' ? preferencesPromise() : preferencesPromise ?? preferences,
            listProducts: async () => [],
            listProductOccurrences: async () => currentOccurrences,
            PANTRY_BRAND_GROUPING: {GROUPED: 'grouped', SEPARATE: 'separate'},
            saveProductDuplicatePromptCount: async (...args) => preferenceWrites.push(['count', ...args]),
            setProductBrandGrouping: async (...args) => preferenceWrites.push(['grouping', ...args]),
            updateProduct: async () => {
            },
            updateProductQuantity: async () => {
            },
        },
        '../../domain/productValidation': {PRODUCT_CATEGORIES: []},
        '../../utils/userErrors': {showUserErrorAlert: (...args) => alerts.push(args)},
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
        return Screen({
            route: {params: {pantryId: 'pantry'}}, navigation: {
                navigate() {
                }
            }
        });
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
        AddProductModal,
        alerts,
        find,
        focus: () => focusEffect?.(),
        preferenceWrites,
        render,
        timers,
        scheduleTimer(callback, delay) {
            const id = ++timerId;
            timers.set(id, {callback, delay});
            return id;
        },
        clearTimer(id) {
            timers.delete(id);
        },
    };
}

function duplicateOccurrences(count = 2) {
    return Array.from({length: count}, (_, index) => ({
        id: `occurrence-${index}`,
        name: 'Arroz',
        brand: index % 2 === 0 ? 'Marca A' : 'Marca B',
        contentValue: 1,
        unitOfMeasure: 'kg',
        quantity: 1,
    }));
}

async function startupReadAfterBlurDoesNotPrompt() {
    const pendingPreferences = deferred();
    const harness = createHarness({
        occurrences: duplicateOccurrences(), preferencesPromise: pendingPreferences.promise
    });
    harness.render();
    const cleanup = harness.focus();
    await tick();
    cleanup();
    pendingPreferences.resolve({promptedDuplicateCounts: {}});
    await tick();
    await tick();
    assert.equal(harness.alerts.length, 0, 'a delayed startup read cannot show a prompt after blur');
    assert.equal(harness.preferenceWrites.length, 0, 'a delayed startup read cannot persist prompt state after blur');
}

async function pendingPromptCallbackCannotPersistAfterBlur() {
    const harness = createHarness({occurrences: duplicateOccurrences(3)});
    harness.render();
    const cleanup = harness.focus();
    await tick();
    await tick();
    assert.equal(harness.alerts.length, 1, 'the first grouping choice is shown while focused');
    const firstAlertButtons = harness.alerts[0][2];
    cleanup();
    firstAlertButtons[0].onPress();
    await tick();
    assert.equal(harness.alerts.length, 1, 'a queued prompt cannot open after blur');
    assert.equal(harness.preferenceWrites.length, 0, 'a stale alert callback cannot persist grouping');
}

async function confirmationCallbackCannotPersistAfterBlur() {
    const harness = createHarness({occurrences: duplicateOccurrences()});
    harness.render();
    const cleanup = harness.focus();
    await tick();
    await tick();
    harness.alerts[0][2][0].onPress();
    assert.equal(harness.alerts.length, 2, 'selecting a grouping opens its confirmation while focused');
    const confirm = harness.alerts[1][2][1].onPress;
    cleanup();
    await confirm();
    assert.equal(harness.preferenceWrites.length, 0, 'confirmation delivered after blur cannot write grouping');
}

async function creationTimerIsCanceledOnBlur() {
    const originalSetTimeout = global.setTimeout;
    const originalClearTimeout = global.clearTimeout;
    try {
        const harness = createHarness({
            occurrences: duplicateOccurrences(1), preferences: {promptedDuplicateCounts: {}}
        });
        global.setTimeout = harness.scheduleTimer.bind(harness);
        global.clearTimeout = harness.clearTimer.bind(harness);
        harness.render();
        const cleanup = harness.focus();
        await tick();
        await tick();
        let tree = harness.render();
        const modal = harness.find(tree, (entry) => entry.type === harness.AddProductModal);
        await modal.props.onCreate({name: 'Arroz'});
        assert.equal(harness.timers.size, 1, 'creation schedules the delayed duplicate prompt');
        cleanup();
        assert.equal(harness.timers.size, 0, 'blur clears the delayed prompt timer');
        tree = harness.render();
        assert.ok(tree);
        assert.equal(harness.alerts.length, 0, 'a cleared timer cannot open an alert after blur');
    } finally {
        global.setTimeout = originalSetTimeout;
        global.clearTimeout = originalClearTimeout;
    }
}

async function timerRejectionAfterBlurIsHandled() {
    const pendingPreferences = deferred();
    let preferenceReads = 0;
    const originalSetTimeout = global.setTimeout;
    const originalClearTimeout = global.clearTimeout;
    try {
        const harness = createHarness({
            occurrences: duplicateOccurrences(1),
            preferencesPromise: () => ++preferenceReads === 1 ? {promptedDuplicateCounts: {}} : pendingPreferences.promise,
        });
        global.setTimeout = harness.scheduleTimer.bind(harness);
        global.clearTimeout = harness.clearTimer.bind(harness);
        harness.render();
        const cleanup = harness.focus();
        await tick();
        await tick();
        const modal = harness.find(harness.render(), (entry) => entry.type === harness.AddProductModal);
        await modal.props.onCreate({name: 'Arroz'});
        const timer = [...harness.timers.values()][0];
        assert.ok(timer, 'creation schedules the delayed duplicate prompt');
        timer.callback();
        await tick();
        cleanup();
        pendingPreferences.reject(new Error('preference read failed after blur'));
        await tick();
        await tick();
        assert.equal(harness.alerts.length, 0, 'a delayed rejection cannot show an alert after blur');
    } finally {
        global.setTimeout = originalSetTimeout;
        global.clearTimeout = originalClearTimeout;
    }
}

(async () => {
    await startupReadAfterBlurDoesNotPrompt();
    await pendingPromptCallbackCannotPersistAfterBlur();
    await confirmationCallbackCannotPersistAfterBlur();
    await creationTimerIsCanceledOnBlur();
    await timerRejectionAfterBlurIsHandled();
    console.log('pantry-grouping-prompt-lifecycle tests passed');
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
