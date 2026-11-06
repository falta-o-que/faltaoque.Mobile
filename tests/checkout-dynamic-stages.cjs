const assert = require('node:assert/strict');
const fs = require('node:fs');
const {transformSync} = require('@babel/core');

function harness(initialItems, listItems) {
    const slots = [];
    const effects = [];
    let cursor = 0;
    let items = initialItems;
    let confirmation;
    const node = (type, props) => ({type, props: props || {}});
    const components = new Proxy({}, {get: (_, key) => key === '__esModule' ? false : String(key)});
    const mocks = {
        react: {
            useState(initial) {
                const i = cursor++;
                if (!(i in slots)) slots[i] = initial;
                return [slots[i], (v) => {
                    slots[i] = typeof v === 'function' ? v(slots[i]) : v;
                }];
            }, useRef(initial) {
                const i = cursor++;
                if (!(i in slots)) slots[i] = {current: initial};
                return slots[i];
            }, useEffect(fn, deps) {
                const i = cursor++;
                if (!slots[i] || deps.some((v, j) => v !== slots[i][j])) {
                    slots[i] = deps;
                    effects.push(fn);
                }
            },
        },
        'react/jsx-runtime': {jsx: node, jsxs: node, Fragment: 'Fragment'},
        'react-native': {
            ActivityIndicator: 'ActivityIndicator', Modal: 'Modal', Alert: {
                alert: (...args) => {
                    confirmation = args;
                }
            }
        },
        '../../assets/icons/export': components,
        '../../domain/productValidation': {PRODUCT_CATEGORIES: ['bebidas']},
        '../../domain/groceryCheckoutReconciliation': {arePresentationsCompatible: () => true},
        '../../contexts/AppPreferencesContext': {
            useAppPreferences: () => ({
                language: 'pt-BR', t: (key, values) => values?.name ? `${key}:${values.name}` : key
            })
        },
        './styles': components,
    };
    const {code} = transformSync(fs.readFileSync('src/components/GroceryCheckoutReview/index.js', 'utf8'), {
        babelrc: false,
        configFile: false,
        plugins: [['@babel/plugin-transform-react-jsx', {runtime: 'automatic'}], '@babel/plugin-transform-modules-commonjs'],
    });
    const mod = {exports: {}};
    new Function('require', 'module', 'exports', code)((name) => {
        if (Object.hasOwn(mocks, name)) return mocks[name];
        if (name.startsWith('../')) return {__esModule: true, default: name.split('/').pop()};
        throw new Error(`Unexpected import ${name}`);
    }, mod, mod.exports);
    const props = {
        visible: true,
        mode: 'nfce',
        list: {name: 'Lista', items: listItems},
        purchase: {},
        dateValue: '2020-01-01',
        onChangeItem: (id, patch) => {
            items = items.map((item) => item.id === id ? {...item, ...patch, ...(Object.hasOwn(patch, 'listItemId') ? {matchStatus: patch.listItemId ? 'manual' : 'unmatched'} : {})} : item);
        },
        onResetItems: (next) => {
            items = next;
        },
        onConfirm() {
        },
        onClose() {
        }
    };
    const render = () => {
        cursor = 0;
        const tree = mod.exports.default({...props, items});
        while (effects.length) effects.shift()();
        return tree;
    };
    render.confirmation = () => confirmation;
    return render;
}

function all(tree, type, out = []) {
    if (Array.isArray(tree)) {
        tree.forEach((x) => all(x, type, out));
        return out;
    }
    if (!tree || typeof tree !== 'object') return out;
    if (tree.type === type) out.push(tree);
    all(tree.props?.children, type, out);
    return out;
}

const base = {name: 'Café', quantity: '1', priceInput: '10', priceMode: 'total', category: 'bebidas', included: true};
const auto = {
    ...base,
    id: 'auto',
    sourceDescription: 'CAFE',
    listItemId: 'a',
    matchStatus: 'automatic',
    needsReview: false,
    reviewed: false
};
const fiscal = {
    ...base,
    id: 'fiscal',
    name: 'Leite',
    sourceDescription: 'LEITE',
    listItemId: null,
    matchStatus: 'unmatched',
    included: false,
    needsReview: true,
    reviewed: false
};
const lists = [{id: 'a', name: 'Café'}, {id: 'b', name: 'Leite'}];
const missing = {
    ...base,
    id: 'missing-b',
    name: 'Leite',
    sourceDescription: '',
    listItemId: 'b',
    included: false,
    needsReview: true,
    reviewed: false
};
const render = harness([auto, fiscal, missing], lists);
const stage = (tree) => all(tree, 'StepTitle')[0].props.children;
const next = (tree) => {
    const button = all(tree, 'ButtonClick').find((item) => item.props.title === 'shopping.continue');
    assert.ok(button);
    assert.equal(button.props.disabled, false);
    button.props.onPress();
};
let tree = render();
tree = render();
assert.equal(stage(tree), 'shopping.reviewMatchesTitle');
next(tree);
tree = render();
assert.equal(stage(tree), 'shopping.reviewRelateTitle');
assert.ok(!all(tree, 'ProgressChipText').some((x) => x.props.children === 'shopping.step.matches'), 'resolved automatic stage must disappear');
const link = all(tree, 'DecisionOption').find((item) => item.props.accessibilityLabel === 'shopping.linkTo:Leite');
assert.ok(link);
link.props.onPress();
tree = render();
assert.equal(stage(tree), 'shopping.reviewRelateTitle', 'current stage stays visible while editing');
next(tree);
tree = render();
assert.equal(stage(tree), 'shopping.reviewSummaryTitle');
assert.ok(!all(tree, 'ProgressChipText').some((x) => x.props.children === 'shopping.step.relate'), 'resolved manual stage must disappear');
const restart = all(tree, 'RestartChoice')[0];
assert.ok(restart);
restart.props.onPress();
assert.equal(stage(render()), 'shopping.reviewSummaryTitle', 'opening confirmation must not discard decisions');
assert.equal(render.confirmation()[2][0].style, 'cancel');
assert.equal(render.confirmation()[2][1].style, 'destructive');
const back = (screen) => {
    const button = all(screen, 'Choice').find((entry) => all(entry, 'ChoiceText').some((text) => text.props.children === 'shopping.backOneStep'));
    assert.ok(button, 'visited stages must remain accessible through back');
    button.props.onPress();
};
back(tree);
tree = render();
assert.equal(stage(tree), 'shopping.reviewRelateTitle');
back(tree);
tree = render();
assert.equal(stage(tree), 'shopping.reviewMatchesTitle');
next(tree);
tree = render();
assert.equal(stage(tree), 'shopping.reviewRelateTitle', 'forward should revisit the next previously viewed stage');
next(tree);
tree = render();
assert.equal(stage(tree), 'shopping.reviewSummaryTitle');
const editPurchase = all(tree, 'Choice').find((x) => all(x, 'ChoiceText').some((text) => text.props.children === 'shopping.editPurchaseData'));
assert.ok(editPurchase, 'summary must allow editing purchase data');
editPurchase.props.onPress();
tree = render();
assert.equal(stage(tree), 'shopping.reviewSummaryTitle');
assert.ok(all(tree, 'PlaceSearchField').length, 'purchase data editor must open in summary');
const finishPurchaseEdit = all(tree, 'Choice').find((x) => all(x, 'ChoiceText').some((text) => text.props.children === 'shopping.finishEditing'));
assert.ok(finishPurchaseEdit);
finishPurchaseEdit.props.onPress();
tree = render();
assert.equal(stage(tree), 'shopping.reviewSummaryTitle');
assert.equal(all(tree, 'PlaceSearchField').length, 0, 'purchase data editor must close');
const review = all(tree, 'Choice').find((x) => all(x, 'ChoiceText').some((text) => text.props.children === 'shopping.editDataAndLink'));
assert.ok(review, 'summary must allow editing resolved product');
review.props.onPress();
tree = render();
assert.notEqual(stage(tree), 'shopping.reviewSummaryTitle');

const renderUnlinked = harness([auto, fiscal], [lists[0]]);
let unlinkedTree = renderUnlinked();
unlinkedTree = renderUnlinked();
next(unlinkedTree);
unlinkedTree = renderUnlinked();
assert.equal(stage(unlinkedTree), 'shopping.reviewRelateTitle');
next(unlinkedTree);
unlinkedTree = renderUnlinked();
assert.equal(stage(unlinkedTree), 'shopping.reviewUnlinkedTitle', 'unlinked line still needs a decision');
const ignore = all(unlinkedTree, 'DecisionOption').find((item) => all(item, 'DecisionTitle').some((title) => title.props.children === 'shopping.ignoreLine'));
assert.ok(ignore);
ignore.props.onPress();
unlinkedTree = renderUnlinked();
assert.equal(stage(unlinkedTree), 'shopping.reviewUnlinkedTitle', 'decision does not unexpectedly change the current stage');
next(unlinkedTree);
unlinkedTree = renderUnlinked();
assert.equal(stage(unlinkedTree), 'shopping.reviewSummaryTitle');
const inclusion = all(unlinkedTree, 'Choice').find((item) => all(item, 'ChoiceText').some((title) => title.props.children === 'shopping.reviewInclusion'));
assert.ok(inclusion, 'summary must allow revisiting the inclusion decision');
inclusion.props.onPress();
unlinkedTree = renderUnlinked();
assert.equal(stage(unlinkedTree), 'shopping.reviewUnlinkedTitle');
render.confirmation()[2][1].onPress();
tree = render();
assert.equal(stage(tree), 'shopping.reviewMatchesTitle', 'confirming discard restarts the review');
console.log('checkout-dynamic-stages tests passed');
