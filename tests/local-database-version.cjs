const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { transformSync } = require('@babel/core');
const { randomUUID } = require('node:crypto');

const databaseKey = '@faltaoque/database';
const versionKey = '@faltaoque/database-schema-version';
const data = new Map();
let failWrite = false;
let failAfterWrite = false;
let failRead = false;
let makeReadFailOnWrite = false;
const storage = {
  getItem: async (key) => { if (failRead) throw new Error('read failed'); return data.has(key) ? data.get(key) : null; },
  setItem: async (key, value) => { if (key === databaseKey && makeReadFailOnWrite) failRead = true; if (key === databaseKey && failWrite) throw new Error('write failed'); data.set(key, value); if (key === databaseKey && failAfterWrite) throw new Error('write failed after commit'); },
  removeItem: async (key) => { data.delete(key); },
};
const file = path.resolve(__dirname, '../src/storage/localDatabase.js');
const { code } = transformSync(fs.readFileSync(file, 'utf8'), {
  babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
});
const moduleObject = { exports: {} };
new Function('require', 'module', 'exports', code)((name) => name === 'expo-crypto' ? { randomUUID } : storage, moduleObject, moduleObject.exports);
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
  failAfterWrite = true;
  await moduleObject.exports.updateDatabase((db) => ({ ...db, colors: db.colors.map((row, index) => index === 0 ? { ...row, name: 'Saved' } : row) }));
  failAfterWrite = false;
  assert.equal((await readDatabase()).colors[0].name, 'Saved');
  makeReadFailOnWrite = true;
  failAfterWrite = true;
  await assert.rejects(moduleObject.exports.updateDatabase((db) => ({ ...db, colors: db.colors.map((row, index) => index === 0 ? { ...row, name: 'Uncertain' } : row) })), /DATABASE_WRITE_UNCERTAIN/);
  let invoked = false;
  await assert.rejects(moduleObject.exports.updateDatabase((db) => { invoked = true; return db; }), /DATABASE_WRITE_UNCERTAIN/);
  makeReadFailOnWrite = false;
  failAfterWrite = false;
  failRead = false;
  await assert.rejects(moduleObject.exports.updateDatabase((db) => { invoked = true; return db; }), /DATABASE_PREVIOUS_WRITE_COMMITTED/);
  assert.equal(invoked, false);
  assert.equal((await readDatabase()).colors[0].name, 'Uncertain');
  makeReadFailOnWrite = true;
  failAfterWrite = true;
  await assert.rejects(moduleObject.exports.updateDatabase((db) => ({ ...db, colors: db.colors.map((row, index) => index === 0 ? { ...row, name: 'Restart' } : row) })), /DATABASE_WRITE_UNCERTAIN/);
  makeReadFailOnWrite = false;
  failAfterWrite = false;
  failRead = false;
  const restarted = { exports: {} };
  new Function('require', 'module', 'exports', code)((name) => name === 'expo-crypto' ? { randomUUID } : storage, restarted, restarted.exports);
  await assert.rejects(restarted.exports.updateDatabase((db) => { invoked = true; return db; }), /DATABASE_PREVIOUS_WRITE_COMMITTED/);
  assert.equal(invoked, false);
  assert.equal((await restarted.exports.readDatabase()).colors[0].name, 'Restart');
  // The original runtime would not continue after restart; use the restarted module below.
  moduleObject.exports = restarted.exports;
  makeReadFailOnWrite = true;
  failWrite = true;
  await assert.rejects(moduleObject.exports.updateDatabase((db) => db), /DATABASE_WRITE_UNCERTAIN/);
  makeReadFailOnWrite = false;
  failRead = false;
  failWrite = false;
  await assert.rejects(moduleObject.exports.updateDatabase((db) => { invoked = true; return db; }), /DATABASE_PREVIOUS_WRITE_NOT_COMMITTED/);
  assert.equal(invoked, false);
  console.log('local-database-version tests passed');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
