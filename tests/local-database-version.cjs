const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { transformSync } = require('@babel/core');

const databaseKey = '@faltaoque/database';
const versionKey = '@faltaoque/database-schema-version';
const data = new Map();
let failWrite = false;
const storage = {
  getItem: async (key) => data.has(key) ? data.get(key) : null,
  setItem: async (key, value) => { if (failWrite) throw new Error('write failed'); data.set(key, value); },
  removeItem: async (key) => { data.delete(key); },
};
const file = path.resolve(__dirname, '../src/storage/localDatabase.js');
const { code } = transformSync(fs.readFileSync(file, 'utf8'), {
  babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
});
const moduleObject = { exports: {} };
new Function('require', 'module', 'exports', code)(() => storage, moduleObject, moduleObject.exports);
const { readDatabase } = moduleObject.exports;

async function main() {
  const fresh = await readDatabase();
  assert.deepEqual(fresh.users, []);
  const complete = data.get(databaseKey);
  assert.equal(JSON.parse(complete).version, 11);

  for (const version of [1, 8, 9, 10]) {
    data.set(databaseKey, JSON.stringify({ oldData: ['discarded'] }));
    data.set(versionKey, String(version));
    assert.deepEqual((await readDatabase()).users, []);
    assert.equal(JSON.parse(data.get(databaseKey)).version, 11);
  }

  const incomplete = JSON.parse(complete);
  delete incomplete.tables.markets;
  for (const payload of [JSON.stringify(incomplete), JSON.stringify({ version: 12, tables: {} }), '{', JSON.stringify({ users: [] })]) {
    data.set(databaseKey, payload);
    data.delete(versionKey);
    await assert.rejects(readDatabase());
    assert.equal(data.get(databaseKey), payload);
  }
  const oldCurrent = JSON.stringify(fresh);
  data.set(databaseKey, oldCurrent);
  data.set(versionKey, '11');
  assert.deepEqual(await readDatabase(), fresh);
  assert.equal(data.get(databaseKey), oldCurrent);
  failWrite = true;
  await assert.rejects(moduleObject.exports.updateDatabase((db) => ({ ...db, colors: db.colors.map((row, index) => index === 0 ? { ...row, name: 'Changed' } : row) })), /write failed/);
  assert.equal(data.get(databaseKey), oldCurrent);
  failWrite = false;
  await moduleObject.exports.updateDatabase((db) => ({ ...db, colors: db.colors.map((row, index) => index === 0 ? { ...row, name: 'Changed' } : row) }));
  assert.equal(JSON.parse(data.get(databaseKey)).version, 11);
  assert.equal((await readDatabase()).colors[0].name, 'Changed');
  data.set(versionKey, '12');
  assert.equal((await readDatabase()).colors[0].name, 'Changed');
  console.log('local-database-version tests passed');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
