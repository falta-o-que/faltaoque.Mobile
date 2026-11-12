const assert = require('node:assert/strict');
const fs = require('node:fs');
const {transformSync} = require('@babel/core');

const tick = () => new Promise((resolve) => setImmediate(resolve));
const defer = () => {
    let resolve, reject;
    const promise = new Promise((yes, no) => {
        resolve = yes;
        reject = no;
    });
    return {promise, resolve, reject};
};

function renderHarness(file) {
    const slots = [];
    let cursor = 0, effect = null, cleanup = null, lastFocus = null;
    const pending = [];
    const t = (key) => key;
    const node = (type, props) => ({type, props: props || {}});
    const components = new Proxy({}, {get: (_, key) => key === '__esModule' ? false : String(key)});
    const defaultComponent = (name) => ({__esModule: true, default: name});
    const mocks = {
        react: {
            useState(initial) {
                const i = cursor++;
                if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
                return [slots[i], (value) => {
                    slots[i] = typeof value === 'function' ? value(slots[i]) : value;
                }];
            }, useRef(initial) {
                const i = cursor++;
                if (!(i in slots)) slots[i] = {current: initial};
                return slots[i];
            }, useEffect() {
                cursor++;
            }, useCallback(fn, deps) {
                const i = cursor++;
                if (!slots[i] || deps.some((value, index) => value !== slots[i].deps[index])) slots[i] = {fn, deps};
                return slots[i].fn;
            },
        },
        'react/jsx-runtime': {jsx: node, jsxs: node, Fragment: 'Fragment'},
        'react-native': {
            ActivityIndicator: 'ActivityIndicator', Alert: {
                alert() {
                }
            }
        },
        'expo-notifications': {
            addNotificationReceivedListener: () => ({
                remove() {
                }
            })
        },
        '@react-navigation/native': {
            useFocusEffect(fn) {
                if (fn !== lastFocus) effect = fn;
            }
        },
        '../../assets/icons/export': components,
        '../../contexts/AuthContext': {useAuth: () => ({account: {id: 'a'}})},
        '../../contexts/AppPreferencesContext': {useAppPreferences: () => ({t})},
        '../../navigation/routes': {AUTHENTICATED_ROUTES: {}},
        '../../services/pantryService': {
            listPantries: () => {
                const item = defer();
                pending.push(item);
                return item.promise;
            }
        },
        '../../services/notificationService': {
            syncDeviceNotifications: async () => ({unreadCount: 0}), listNotifications: async () => []
        },
        '../../utils/userErrors': {
            showUserErrorAlert() {
            }
        },
        './styles': components,
    };
    const {code} = transformSync(fs.readFileSync(file, 'utf8'), {
        babelrc: false,
        configFile: false,
        plugins: [['@babel/plugin-transform-react-jsx', {runtime: 'automatic'}], '@babel/plugin-transform-modules-commonjs'],
    });
    const module = {exports: {}};
    new Function('require', 'module', 'exports', code)((name) => {
        if (Object.hasOwn(mocks, name)) return mocks[name];
        if (name === '../../components/CreatePantryModal') return {
            ...defaultComponent('CreatePantryModal'), PantryFormModal: 'PantryFormModal'
        };
        if (name.startsWith('../../components/') || name.startsWith('../')) return defaultComponent(name.split('/').pop());
        throw new Error(`Unexpected import ${name}`);
    }, module, module.exports);
    const Screen = module.exports.default;

    function render() {
        cursor = 0;
        return Screen({
            navigation: {
                navigate() {
                }
            }
        });
    }

    function flushFocus() {
        if (!effect) return;
        cleanup?.();
        lastFocus = effect;
        cleanup = effect();
        effect = null;
    }

    return {pending, render, flushFocus};
}

function find(tree, type) {
    if (Array.isArray(tree)) return tree.map((child) => find(child, type)).find(Boolean) ?? null;
    if (!tree || typeof tree !== 'object') return null;
    return tree.type === type ? tree : find(tree.props?.children, type);
}

async function scenario(file, result) {
    const h = renderHarness(file);
    let tree = h.render();
    assert.equal(find(tree, 'EmptyText'), null, `${file}: initial render must not show empty state`);
    h.flushFocus();
    tree = h.render();
    assert.equal(find(tree, 'EmptyText'), null, `${file}: pending load must not show empty state`);
    if (result === 'failure') h.pending[0].reject(new Error('failed')); else h.pending[0].resolve(result === 'data' ? [{
        id: 'p',
        name: 'Casa'
    }] : []);
    await tick();
    tree = h.render();
    if (result === 'data') {
        assert.ok(find(tree, 'PantryCard'), `${file}: data must show card`);
        assert.equal(find(tree, 'EmptyText'), null);
    } else if (result === 'empty') {
        assert.ok(find(tree, 'EmptyText'), `${file}: confirmed empty must be shown`);
    } else {
        assert.ok(find(tree, 'LoadError'), `${file}: failed load must show error`);
        assert.equal(find(tree, 'EmptyText'), null);
        find(tree, 'RetryButton').props.onPress();
        h.render();
        h.flushFocus();
        tree = h.render();
        assert.equal(find(tree, 'EmptyText'), null, `${file}: retry must not show empty state while pending`);
        h.pending[1].resolve([{id: 'p', name: 'Casa'}]);
        await tick();
        tree = h.render();
        assert.ok(find(tree, 'PantryCard'), `${file}: retry succeeds`);
    }
}

(async () => {
    for (const file of ['src/screens/HomeScreen/index.js', 'src/screens/PantriesScreen/index.js']) {
        for (const result of ['data', 'empty', 'failure']) await scenario(file, result);
    }
    console.log('pantry-loading-state tests passed');
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
