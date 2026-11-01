const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {transformSync} = require('@babel/core');

const source = fs.readFileSync(path.resolve(__dirname, '../src/screens/NotificationsScreen/index.js'), 'utf8');
const {code} = transformSync(source, {
    babelrc: false,
    configFile: false,
    plugins: [['@babel/plugin-transform-react-jsx', {runtime: 'automatic'}], '@babel/plugin-transform-modules-commonjs',]
});
const deferred = () => {
    let resolve;
    const promise = new Promise((done) => {
        resolve = done;
    });
    return {promise, resolve};
};
const tick = () => new Promise((resolve) => setImmediate(resolve));

async function scenario(reopen) {
    const slots = [];
    let cursor = 0;
    let focused = false;
    let pending = deferred();
    const written = [];
    const records = ['A', 'B'].map((id) => ({id, title: id, type: 'depleted', pantryId: 'p', product: {name: id}}));
    const modalType = function NotificationDetailsModal() {
    };
    const node = (type, props) => ({type, props: props || {}});
    const components = new Proxy({}, {get: (_, key) => key === '__esModule' ? false : String(key)});
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
            }, useEffect() {
                cursor++;
            }, useCallback(fn) {
                cursor++;
                return fn;
            },
        },
        'react/jsx-runtime': {jsx: node, jsxs: node, Fragment: 'Fragment'},
        'react-native': {
            ActivityIndicator: 'ActivityIndicator', Alert: {
                alert() {
                }
            }
        },
        'expo-notifications': {},
        '@react-navigation/native': {
            useFocusEffect(fn) {
                if (!focused) {
                    focused = true;
                    fn();
                }
            }
        },
        '../../components/Navbar': {__esModule: true, default: 'Navbar'},
        '../../components/NotificationDetailsModal': {__esModule: true, default: modalType},
        '../../components/QuickActionButton': {__esModule: true, default: 'QuickActionButton'},
        '../../assets/icons/export': components,
        '../../contexts/AuthContext': {useAuth: () => ({account: {id: 'a'}})},
        '../../contexts/AppPreferencesContext': {useAppPreferences: () => ({t: (key) => key})},
        '../../navigation/routes': {AUTHENTICATED_ROUTES: {}},
        '../../services/groceryListService': {
            listGroceryLists: async () => [{
                id: 'list', name: 'Lista', status: 'active'
            }], addGroceryItem: async (value) => {
                await pending.promise;
                written.push(value);
            }
        },
        '../../services/notificationService': {
            syncDeviceNotifications: async () => ({permissionGranted: true}),
            listNotifications: async () => records,
            markNotificationRead: async () => {
            },
            recordNotificationAddedToList: async () => {
            }
        },
        '../../utils/userErrors': {
            showUserErrorAlert() {
            }
        },
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
            embedded: true, navigation: {
                setParams() {
                }, navigate() {
                }
            }, route: {}
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

    const modal = (tree) => find(tree, (entry) => entry.type === modalType);
    const row = (tree, id) => find(tree, (entry) => entry.type === 'NotificationRow' && entry.props.accessibilityLabel === id);
    render();
    await tick();
    let tree = render();
    row(tree, 'A').props.onPress();
    await tick();
    tree = render();
    assert.equal(modal(tree).props.notification.id, 'A');
    const addition = modal(tree).props.onAddToList({id: 'list', name: 'Lista'});
    tree = render();
    modal(tree).props.onClose();
    tree = render();
    assert.equal(modal(tree).props.visible, false);
    if (reopen) {
        row(tree, reopen).props.onPress();
        await tick();
        tree = render();
        assert.equal(modal(tree).props.notification.id, reopen);
    }
    pending.resolve();
    await addition;
    tree = render();
    assert.equal(written.length, 1, 'closing does not cancel the addition');
    assert.equal(modal(tree).props.notification?.id ?? null, reopen || null);
    assert.equal(modal(tree).props.visible, Boolean(reopen));
    if (reopen === 'A') {
        assert.equal(modal(tree).props.notification.handled.action, 'added-to-list');
        assert.equal(modal(tree).props.notification.handled.listId, 'list');
    }
    if (reopen === 'B') assert.equal(modal(tree).props.notification.handled, undefined);
}

(async () => {
    await scenario(null);
    await scenario('B');
    await scenario('A');
    console.log('notification-modal-race tests passed');
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
