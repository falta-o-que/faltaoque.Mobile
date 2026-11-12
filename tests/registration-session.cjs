const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {transformSync} = require('@babel/core');

let account;
let session;
let writeMode = 'success';
let failRead = false;
const modules = {
    'expo-crypto': {
        randomUUID: () => 'id-a', CryptoDigestAlgorithm: {SHA256: 'sha256'}, digestStringAsync: async () => 'hash'
    }, '../repositories/accountRepository': {
        createAccount: async (value) => {
            account = value;
        }, findAccountByEmail: async () => account ?? null, normalizeEmail: (value) => value.trim().toLowerCase(),
    }, '../repositories/sessionRepository': {
        saveActiveAccountId: async (id) => {
            if (writeMode !== 'before') session = id;
            if (writeMode !== 'success') throw new Error('storage failed');
        }, getActiveAccountId: async () => {
            if (failRead) throw new Error('read failed');
            return session;
        },
    },
};
const file = path.resolve(__dirname, '../src/services/authService.js');
const {code} = transformSync(fs.readFileSync(file, 'utf8'), {
    babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs']
});
const mod = {exports: {}};
new Function('require', 'module', 'exports', code)((name) => {
    if (!(name in modules)) throw new Error(`Unexpected import: ${name}`);
    return modules[name];
}, mod, mod.exports);
const input = {name: 'Pessoa', email: 'A@example.test', avatarColor: '#fff', password: 'password'};

async function main() {
    writeMode = 'before';
    await assert.rejects(mod.exports.register(input), /ACCOUNT_CREATED_SESSION_FAILED/);
    assert.equal(account.email, 'a@example.test');
    await assert.rejects(mod.exports.register(input), /EMAIL_ALREADY_EXISTS/);
    account = null;
    session = undefined;
    writeMode = 'after';
    const result = await mod.exports.register(input);
    assert.equal(result.id, 'id-a');
    assert.equal(session, 'id-a');
    account = null;
    session = undefined;
    failRead = true;
    await assert.rejects(mod.exports.register(input), /ACCOUNT_CREATED_SESSION_FAILED/);
    assert.ok(account);
    console.log('registration-session tests passed');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
