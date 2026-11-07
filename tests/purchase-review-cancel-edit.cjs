const assert = require('node:assert/strict');
const fs = require('node:fs');
const {transformSync} = require('@babel/core');

const slots = [];
const effects = [];
let cursor = 0;
const node = (type, props) => ({type, props: props || {}});
const components = new Proxy({}, {get: (_, key) => key === '__esModule' ? false : String(key)});
const mocks = {
    react: {
        useRef(initial) {
            const i = cursor++;
            if (!(i in slots)) slots[i] = {current: initial};
            return slots[i];
        }, useState(initial) {
            const i = cursor++;
            if (!(i in slots)) slots[i] = initial;
            return [slots[i], (value) => {
                slots[i] = typeof value === 'function' ? value(slots[i]) : value;
            }];
        }, useEffect(fn, deps) {
            const i = cursor++;
            if (!slots[i] || deps.some((v, j) => v !== slots[i][j])) {
                slots[i] = deps;
                effects.push(fn);
            }
        }, useLayoutEffect(fn, deps) {
            const i = cursor++;
            if (!slots[i] || deps.some((v, j) => v !== slots[i][j])) {
                slots[i] = deps;
                effects.push(fn);
            }
        },
    },
    'react/jsx-runtime': {jsx: node, jsxs: node, Fragment: 'Fragment'},
    'styled-components/native': {
        useTheme: () => ({
            colors: {
                primary: {700: '#000'}, black: {400: '#000', Black: '#000'}, warning: {600: '#000'}
            }
        })
    },
    '../CategoryTag': {__esModule: true, default: 'CategoryTag'},
    '../ModalActionButton': {__esModule: true, default: 'ModalActionButton'},
    '../FormField': {__esModule: true, default: 'FormField'},
    '../../assets/icons/export': components,
    '../../domain/productValidation': {PRODUCT_CATEGORIES: ['bebidas'], PRODUCT_UNITS: ['g']},
    '../../domain/fiscalItems': {hasGroupedFiscalLines: (item) => item.sourceItems?.length > 1},
    '../../contexts/AppPreferencesContext': {useAppPreferences: () => ({t: (key) => key})},
    '../AddProductModal/styles': components,
    './styles': components,
    '../../assets/grocery/legumesGrocery.png': 1,
};
const {code} = transformSync(fs.readFileSync('src/components/PurchaseProductReviewCard/index.js', 'utf8'), {
    babelrc: false,
    configFile: false,
    plugins: [['@babel/plugin-transform-react-jsx', {runtime: 'automatic'}], '@babel/plugin-transform-modules-commonjs'],
});
const moduleObject = {exports: {}};
new Function('require', 'module', 'exports', code)((name) => {
    if (!Object.hasOwn(mocks, name)) throw new Error(`Unexpected import: ${name}`);
    return mocks[name];
}, moduleObject, moduleObject.exports);
const Card = moduleObject.exports.default;

function find(value, type) {
    if (Array.isArray(value)) return value.map((entry) => find(entry, type)).find(Boolean);
    if (!value || typeof value !== 'object') return null;
    return value.type === type ? value : find(value.props?.children, type);
}

function render(props) {
    cursor = 0;
    const tree = Card(props);
    while (effects.length) effects.shift()();
    return tree;
}

let canceled;
let concluded = 0;
const original = {
    name: 'Café', brand: 'Marca', quantity: '2', priceInput: '10', priceMode: 'total', category: 'bebidas'
};
const props = {
    item: original, expanded: true, onCancelEdit: (value) => {
        canceled = value;
    }, onToggleEdit: () => {
        concluded += 1;
    }
};
let tree = render(props);
const cancel = find(tree, 'ModalActionButton');
assert.ok(cancel, 'the editor offers a standard cancel action');
assert.equal(cancel.props.accessibilityLabel, 'product.info.cancelEdit');
assert.equal(cancel.props.variant, 'cancel');
assert.equal(cancel.props.Icon, 'CancelCircleIcon');
tree = render({...props, item: {...original, name: 'Leite', brand: 'Outra'}});
find(tree, 'ModalActionButton').props.onPress();
assert.equal(canceled.name, 'Café');
assert.equal(canceled.brand, 'Marca');
assert.equal(concluded, 0);
find(tree, 'FinishEditButton').props.onPress();
assert.equal(concluded, 1);
tree = render({...props, busy: true});
assert.equal(find(tree, 'ModalActionButton').props.disabled, true);
tree = render({...props, expanded: false, item: {...original, sourceItems: [
    {sourceDescription: 'LEITE UHT 1L', quantity: 6},
]}});
assert.ok(!find(tree, 'DuplicateNotice'), 'six units from one fiscal row do not show the duplicate notice');
tree = render({...props, expanded: false, item: {...original, sourceItems: [
    {sourceDescription: 'LEITE UHT 1L', quantity: 1},
    {sourceDescription: 'LEITE UHT 1L', quantity: 1},
    {sourceDescription: 'LEITE UHT 1L', quantity: 1},
]}});
assert.ok(find(tree, 'DuplicateNotice'), 'separate repeated fiscal rows show the grouped-lines notice');
console.log('purchase-review-cancel-edit tests passed');
