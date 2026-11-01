const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { transformSync } = require('@babel/core');

const databaseKey = '@faltaoque/database';
const versionKey = '@faltaoque/database-schema-version';
const data = new Map();
const storage = {
  getItem: async (key) => data.has(key) ? data.get(key) : null,
  setItem: async (key, value) => { data.set(key, value); },
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
  assert.equal(data.get(versionKey), '11');
  assert.deepEqual(fresh.users, []);
  const complete = data.get(databaseKey);

  for (const version of [1, 8, 9, 10]) {
    data.set(databaseKey, JSON.stringify({ oldData: ['discarded'] }));
    data.set(versionKey, String(version));
    assert.deepEqual((await readDatabase()).users, []);
    assert.equal(data.get(versionKey), '11');
  }

  const incomplete = JSON.parse(complete);
  delete incomplete.markets;
  for (const [payload, version] of [[JSON.stringify(incomplete), '11'], [complete, '12'], ['{', '11'], [complete, null]]) {
    data.set(databaseKey, payload);
    if (version === null) data.delete(versionKey); else data.set(versionKey, version);
    await assert.rejects(readDatabase());
    assert.equal(data.get(databaseKey), payload);
    assert.equal(data.has(versionKey) ? data.get(versionKey) : null, version);
  }
  data.set(databaseKey, complete);
  data.set(versionKey, '11');
  assert.deepEqual(await readDatabase(), fresh);
  console.log('local-database-version tests passed');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
