const fs = require('node:fs');
const path = require('node:path');
const {randomUUID} = require('node:crypto');
const {transformSync} = require('@babel/core');

function createHarness() {
    const data = new Map();
    let failWrites = false;
    const storage = {
        getItem: async (key) => data.has(key) ? data.get(key) : null, setItem: async (key, value) => {
            if (failWrites) throw new Error('Storage unavailable');
            data.set(key, value);
        }, removeItem: async (key) => {
            data.delete(key);
        },
    };
    const cache = new Map();

    function load(file) {
        const absolute = path.resolve(__dirname, '..', file);
        if (cache.has(absolute)) return cache.get(absolute).exports;
        const moduleObject = {exports: {}};
        cache.set(absolute, moduleObject);
        const {code} = transformSync(fs.readFileSync(absolute, 'utf8'), {
            babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
        });
        new Function('require', 'module', 'exports', code)((name) => {
            if (name === '@react-native-async-storage/async-storage') return storage;
            if (name === 'expo-crypto') return {randomUUID};
            if (name.startsWith('.')) return load(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(absolute), `${name}.js`)));
            return require(name);
        }, moduleObject, moduleObject.exports);
        return moduleObject.exports;
    }

    return {
        data, load, failWrites: (value) => {
            failWrites = value;
        }
    };
}

async function seed(harness) {
    const {createAccount} = harness.load('src/repositories/accountRepository.js');
    const {createPantry} = harness.load('src/repositories/pantryRepository.js');
    await createAccount({id: 'a', name: 'A', email: 'a@example.test', passwordHash: 'hash', avatarColor: '#00F0FF'});
    await createAccount({id: 'b', name: 'B', email: 'b@example.test', passwordHash: 'hash', avatarColor: '#00F0FF'});
    await createPantry({id: 'p', accountId: 'a', name: 'Casa', color: '#00F0FF'});
}

module.exports = {createHarness, seed};
