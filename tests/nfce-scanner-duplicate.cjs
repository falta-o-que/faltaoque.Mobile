const assert = require('node:assert/strict');
const fs = require('node:fs');
const {transformSync} = require('@babel/core');
const {createHarness} = require('./local-test-harness.cjs');

async function main() {
    const {createFiscalScanSession} = createHarness().load('src/utils/fiscalScanSession.js');
    let resolvePurchase;
    let resolvePreparation;
    let calls = 0;
    let deliveries = 0;
    const purchase = new Promise((resolve) => {
        resolvePurchase = resolve;
    });
    const preparation = new Promise((resolve) => {
        resolvePreparation = resolve;
    });
    const camera = function CameraView() {
    };
    const node = (type, props) => ({type, props: props || {}});
    const components = new Proxy({}, {get: (_, key) => key === '__esModule' ? false : String(key)});
    const mocks = {
        react: {
            useRef: (value) => ({current: value}), useState: (value) => [value, () => {
            }], useLayoutEffect: (fn) => fn()
        },
        'react/jsx-runtime': {jsx: node, jsxs: node, Fragment: 'Fragment'},
        'react-native': {ActivityIndicator: 'ActivityIndicator', Modal: 'Modal'},
        'expo-camera': {
            CameraView: camera, useCameraPermissions: () => [{granted: true}, () => {
            }]
        },
        '../../assets/icons/export': components,
        '../ButtonClick': {__esModule: true, default: 'ButtonClick'},
        '../ModalActionButton': {__esModule: true, default: 'ModalActionButton'},
        '../../services/nfceImportService': {
            loadFiscalPurchase: () => {
                calls += 1;
                return purchase;
            }
        },
        '../../contexts/AppPreferencesContext': {useAppPreferences: () => ({t: (key) => key})},
        '../../utils/userErrors': {getUserErrorMessage: () => 'erro'},
        '../../utils/fiscalScanSession': {createFiscalScanSession},
        './styles': components,
    };
    const {code} = transformSync(fs.readFileSync('src/components/NfceScannerModal/index.js', 'utf8'), {
        babelrc: false,
        configFile: false,
        plugins: [['@babel/plugin-transform-react-jsx', {runtime: 'automatic'}], '@babel/plugin-transform-modules-commonjs'],
    });
    const module = {exports: {}};
    new Function('require', 'module', 'exports', code)((name) => {
        if (!Object.hasOwn(mocks, name)) throw new Error(`Unexpected import: ${name}`);
        return mocks[name];
    }, module, module.exports);
    const tree = module.exports.default({
        visible: true, accountId: 'a', onRequestClose() {
        }, onPurchaseLoaded: async () => {
            deliveries += 1;
            await preparation;
        }
    });

    function find(value) {
        if (Array.isArray(value)) return value.map(find).find(Boolean);
        if (!value || typeof value !== 'object') return null;
        return value.type === camera ? value : find(value.props?.children);
    }

    const scan = find(tree).props.onBarcodeScanned;
    const first = scan({data: 'first'});
    await scan({data: 'second'});
    assert.equal(calls, 1, 'events before rerender must start one consultation');
    resolvePurchase({qrCodeId: 'first'});
    await Promise.resolve();
    await scan({data: 'third'});
    assert.equal(calls, 1, 'scanner stays locked while review is being prepared');
    assert.equal(deliveries, 1);
    resolvePreparation();
    await first;
    console.log('nfce-scanner-duplicate tests passed');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
