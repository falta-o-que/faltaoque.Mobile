const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {transformSync} = require('@babel/core');
function harness() {
    const values = new Map(), secure = new Map(), cache = new Map();
    let failSession = false;
    const storage = {getItem: async k => values.has(k) ? values.get(k) : null, setItem: async (k,v) => values.set(k,v), removeItem: async k => values.delete(k)};
    const secureStore = {WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1, getItemAsync: async k => secure.get(k) ?? null,
        setItemAsync: async (k,v) => {if (failSession) throw Error('session failed'); secure.set(k,v);}, deleteItemAsync: async k => secure.delete(k)};
    function load(file) {
        const absolute = path.resolve(__dirname, '..', file); if (cache.has(absolute)) return cache.get(absolute).exports;
        const mod = {exports:{}}; cache.set(absolute,mod);
        const {code} = transformSync(fs.readFileSync(absolute,'utf8'), {babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']});
        new Function('require','module','exports',code)(name => {
            if(name==='@react-native-async-storage/async-storage') return storage;
            if(name==='expo-secure-store') return secureStore;
            if(name==='expo-crypto') return {randomUUID:crypto.randomUUID, CryptoDigestAlgorithm:{SHA256:'sha256'}, digestStringAsync:async (_,text)=>crypto.createHash('sha256').update(text).digest('hex')};
            if(name.startsWith('.')) return load(path.relative(path.resolve(__dirname,'..'), path.resolve(path.dirname(absolute),`${name}.js`)));
            return require(name);
        },mod,mod.exports); return mod.exports;
    }
    return {load,values,secure,failSession: v => {failSession=v;}};
}
async function main() {
    const h=harness(), init=h.load('src/services/demoInitialization.js'), auth=h.load('src/services/authService.js'), db=h.load('src/storage/localDatabase.js');
    h.failSession(true); await assert.rejects(init.initializeDemo(), /session failed/);
    let data=await db.readDatabase(); assert.equal(data.purchases.length,24); assert.equal(data.pantry_products.length,384);
    h.failSession(false); await init.initializeDemo(); assert.equal((await auth.restoreSession()).email,'demo@faltaoque.app');
    await auth.logout(); await init.initializeDemo(); assert.equal(await auth.restoreSession(),null);
    await auth.login({email:'demo@faltaoque.app',password:'Demo@1234'});
    data=await db.readDatabase(); const pantry=data.pantries[0].id;
    assert.equal(data.purchases.length,24); assert.equal(new Set(data.purchases.map(p=>p.purchase_date.slice(0,7))).size,8);
    assert.ok(data.pantry_products.some(p=>p.current_quantity>0));
    const lists=await h.load('src/services/groceryListService.js').listGroceryLists(data.users[0].id,pantry);
    assert.equal(lists.length,2); assert.ok(lists.find(l=>l.status==='active').estimatedPrice>0);
    assert.equal((await h.load('src/repositories/dashboardRepository.js').listDashboardRecords(data.users[0].id,pantry)).purchases.length,24);
    await assert.rejects(h.load('src/repositories/dashboardRepository.js').listDashboardRecords('another-account',pantry),/PANTRY_NOT_FOUND/);
    const old=harness(), oldDb=old.load('src/storage/localDatabase.js'); await oldDb.readDatabase();
    const before=old.values.get('@faltaoque/database'); await old.load('src/services/demoInitialization.js').initializeDemo();
    assert.equal(old.values.get('@faltaoque/database'),before); assert.equal(old.secure.size,0);
    console.log('demo initialization tests passed');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
