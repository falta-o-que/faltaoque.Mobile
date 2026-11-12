const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {transformSync} = require('@babel/core');

function compile(file, requireMock, plugins) {
    const source = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
    const {code} = transformSync(source, {babelrc: false, configFile: false, plugins});
    const module = {exports: {}};
    new Function('require', 'module', 'exports', code)(requireMock, module, module.exports);
    return module.exports;
}

const themeModule = compile('src/theme/index.js', (name) => {
    if (name === './tokens.json') return require('../src/theme/tokens.json');
    throw new Error(`Unexpected theme import: ${name}`);
}, ['@babel/plugin-transform-modules-commonjs']);

const normalTheme = themeModule.createTheme(1.1);
const fallbackTheme = themeModule.createTheme(1.1, 'sans-serif');
assert.equal(normalTheme.fonts.scale, 1.1);
assert.equal(fallbackTheme.fonts.scale, 1.1);
for (const family of ['inter', 'poppins']) {
    for (const weight of ['regular', 'medium', 'bold']) {
        assert.match(normalTheme.fonts.families[family][weight], /^(Inter|Poppins)_/);
        assert.equal(fallbackTheme.fonts.families[family][weight], 'sans-serif');
    }
}

let fontState = [false, null];
const node = (type, props) => ({type, props: props || {}});
const ActivityIndicator = () => null;
const RootNavigator = () => null;
const ThemeProvider = () => null;
const mocks = {
    react: {useMemo: (fn) => fn()},
    'react/jsx-runtime': {jsx: node, jsxs: node},
    'react-native': {ActivityIndicator, Platform: {OS: 'android', select: (values) => values.android}},
    'expo-font': {useFonts: () => fontState},
    'expo-notifications': {
        setNotificationHandler: () => {
        }
    },
    '@expo-google-fonts/inter': {},
    '@expo-google-fonts/poppins': {},
    'react-native-safe-area-context': {SafeAreaProvider: () => null},
    'styled-components/native': {ThemeProvider},
    './contexts/AuthContext': {
        AuthProvider: () => null, useAuth: () => ({account: {id: 'a'}, isRestoringSession: false})
    },
    './contexts/AppPreferencesContext': {
        AppPreferencesProvider: () => null,
        useAppPreferences: () => ({fontScale: 1.1, isPreferencesLoading: false, t: (key) => key})
    },
    './navigation/RootNavigator': {__esModule: true, default: RootNavigator},
    './theme': themeModule,
};
const app = compile('src/App.js', (name) => {
    if (!Object.hasOwn(mocks, name)) throw new Error(`Unexpected app import: ${name}`);
    return mocks[name];
}, [['@babel/plugin-transform-react-jsx', {runtime: 'automatic'}], '@babel/plugin-transform-modules-commonjs']);

const root = app.default();
const withFonts = root.props.children.props.children;
let rendered = withFonts.type(withFonts.props);
assert.equal(rendered.type, ActivityIndicator, 'font loading must display an indicator');

fontState = [true, null];
rendered = withFonts.type(withFonts.props);
assert.notEqual(rendered.type, ActivityIndicator, 'loaded fonts must enter the app');
let provider = rendered.type(rendered.props);
assert.equal(provider.type, ThemeProvider);
assert.equal(provider.props.theme.fonts.families.inter.regular, 'Inter_400Regular');
let authNode = provider.props.children;
let content = authNode.props.children;
assert.equal(content.type(content.props).type, RootNavigator, 'loaded fonts must allow navigation');

fontState = [false, new Error('font load failed')];
rendered = withFonts.type(withFonts.props);
assert.notEqual(rendered.type, ActivityIndicator, 'font failure must not leave an indefinite spinner');
provider = rendered.type(rendered.props);
assert.equal(provider.type, ThemeProvider);
for (const family of ['inter', 'poppins']) {
    for (const weight of ['regular', 'medium', 'bold']) {
        assert.equal(provider.props.theme.fonts.families[family][weight], 'sans-serif');
    }
}
authNode = provider.props.children;
content = authNode.props.children;
assert.equal(content.type(content.props).type, RootNavigator, 'font failure must still allow navigation');
console.log('font-startup tests passed');
