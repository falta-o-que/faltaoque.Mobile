const assert = require('node:assert/strict');
const fs = require('node:fs');
const {transformSync} = require('@babel/core');

function harness(file) {
    const slots = [];
    let cursor = 0;
    const effects = [];
    const calls = [];
    const params = {};
    const navigation = {
        navigate: (...args) => calls.push(args), setParams: (values) => Object.assign(params, values),
    };
    const node = (type, props) => ({type, props: props || {}});
    const components = new Proxy({}, {get: (_, key) => key === '__esModule' ? false : String(key)});
    const component = (name) => ({__esModule: true, default: name});
    const mocks = {
        react: {
            useState(initial) {
                const i = cursor++;
                if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
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
            }, useEffect(fn, deps) {
                const i = cursor++;
                const old = slots[i];
                if (!old || !deps || deps.some((v, j) => v !== old.deps[j])) {
                    slots[i] = {deps};
                    effects.push(fn);
                }
            },
        },
        'react/jsx-runtime': {jsx: node, jsxs: node, Fragment: 'Fragment'},
        'react-native': {
            ActivityIndicator: 'ActivityIndicator', Alert: {
                alert() {
                    throw new Error('unexpected alert');
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
            useFocusEffect() {
            }
        },
        '../../assets/icons/export': components,
        '../../contexts/AuthContext': {useAuth: () => ({account: {id: 'a'}})},
        '../../contexts/AppPreferencesContext': {useAppPreferences: () => ({t: (key) => key})},
        '../../navigation/routes': {
            AUTHENTICATED_ROUTES: {
                HOME: 'Home', PANTRIES: 'Pantries', GROCERY_PANTRY_PICKER: 'GroceryPantryPicker'
            }
        },
        '../../services/pantryService': {},
        '../../services/notificationService': {},
        '../../services/groceryListService': {},
        '../../utils/userErrors': {
            showUserErrorAlert() {
            }
        },
        './styles': components,
    };
    const {code} = transformSync(fs.readFileSync(file, 'utf8'), {
        babelrc: false,
        configFile: false,
        plugins: [['@babel/plugin-transform-react-jsx', {runtime: 'automatic'}], '@babel/plugin-transform-modules-commonjs']
    });
    const module = {exports: {}};
    new Function('require', 'module', 'exports', code)((name) => {
        if (Object.hasOwn(mocks, name)) return mocks[name];
        if (name === '../../components/CreatePantryModal') return {
            ...component('CreatePantryModal'), PantryFormModal: 'PantryFormModal'
        };
        if (name.startsWith('../../components/') || name.startsWith('../')) return component(name.split('/').pop());
        throw new Error(`Unexpected import: ${name}`);
    }, module, module.exports);
    return {
        calls, params, render() {
            cursor = 0;
            const tree = module.exports.default({navigation, route: {params}});
            while (effects.length) effects.shift()();
            return tree;
        },
    };
}

function all(tree, type, result = []) {
    if (Array.isArray(tree)) {
        tree.forEach((v) => all(v, type, result));
        return result;
    }
    if (!tree || typeof tree !== 'object') return result;
    if (tree.type === type) result.push(tree);
    all(tree.props?.children, type, result);
    return result;
}

const notifications = harness('src/screens/NotificationsScreen/index.js');
const notificationTree = notifications.render();
for (const [label, section] of [['notifications.pantry', 'pantry'], ['notifications.profile', 'profile'], ['notifications.settings', 'settings']]) {
    const action = all(notificationTree, 'QuickActionButton').find((entry) => entry.props.accessibilityLabel === label);
    assert.ok(action, `missing ${label}`);
    action.props.onPress();
    assert.deepEqual(notifications.calls.pop(), ['Home', {section}]);
}
all(notificationTree, 'Navbar')[0].props.onItemChange('profile', {});
assert.deepEqual(notifications.calls.pop(), ['Home', {section: 'profile'}]);

const home = harness('src/screens/HomeScreen/index.js');
const selected = () => all(home.render(), 'QuickActionButton').find((entry) => entry.props.selected)?.props.accessibilityLabel;
assert.equal(selected(), 'home.action.pantry');
for (const section of ['settings', 'profile', 'pantry']) {
    home.params.section = section;
    home.render();
    assert.equal(home.params.section, undefined, 'handled section should be cleared');
    assert.equal(selected(), `home.action.${section}`);
}
home.params.section = 'invalid';
home.render();
assert.equal(selected(), 'home.action.pantry', 'invalid target must not change selection');
console.log('notification-shortcut-navigation tests passed');
