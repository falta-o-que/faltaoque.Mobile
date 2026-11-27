const assert = require('node:assert/strict');
const fs = require('node:fs');
const {transformSync} = require('@babel/core');
const secure = new Map(), local = new Map();
const key = 'faltaoque.session.api.v1';
let failSecure = false, failRemove = false;
const storage = {
    getItem: async k => local.get(k) ?? null, removeItem: async k => {
        if (failRemove) throw Error('remove');
        local.delete(k);
    }
};
const secrets = {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1, getItemAsync: async k => secure.get(k) ?? null, setItemAsync: async (k, v) => {
        if (failSecure) throw Error('secure');
        secure.set(k, v);
    }, deleteItemAsync: async k => secure.delete(k)
};
const src = fs.readFileSync('src/repositories/sessionRepository.js', 'utf8');
const code = transformSync(src, {
    babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs']
}).code;
const mod = {exports: {}};
new Function('require', 'module', 'exports', code)(name => name === 'expo-secure-store' ? secrets : storage, mod, mod.exports);
const session = {token: 'token', account: {id: 'a'}, expiration: '2099-01-01T00:00:00Z'};
(async () => {
    local.set(key, JSON.stringify(session));
    failSecure = true;
    await assert.rejects(mod.exports.getSession(), /secure/);
    assert.ok(local.has(key));
    failSecure = false;
    failRemove = true;
    await assert.rejects(mod.exports.getSession(), /remove/);
    assert.ok(secure.has(key));
    assert.ok(local.has(key));
    failRemove = false;
    assert.deepEqual(await mod.exports.getSession(), session);
    assert.equal(local.has(key), false);
    await mod.exports.clearSession();
    assert.equal(await mod.exports.getSession(), null);
    await mod.exports.saveSession(session);
    assert.equal(local.has(key), false);
    assert.deepEqual(await mod.exports.getSession(), session);
    const otherSession = {...session, token: 'new-token'};
    failRemove = true;
    await assert.rejects(mod.exports.saveSession(otherSession), /remove/);
    assert.deepEqual(JSON.parse(secure.get(key)), session);
    failRemove = false;
    local.set(key, JSON.stringify(session));
    await mod.exports.clearSession();
    assert.equal(local.has(key), false);
    assert.equal(secure.has(key), false);
    console.log('secure-session tests passed');
})().catch(e => {
    console.error(e);
    process.exitCode = 1;
});
