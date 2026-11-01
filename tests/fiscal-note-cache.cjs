const assert = require('node:assert/strict');
const fs = require('node:fs');
const { transformSync } = require('@babel/core');
const values = new Map();
const storage = { async getItem(key) { return values.get(key) ?? null; }, async setItem(key, value) { values.set(key, value); } };
function load(file, resolve) {
  const source = transformSync(fs.readFileSync(file, 'utf8'), { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
  const module = { exports: {} };
  new Function('module', 'exports', 'require', source)(module, module.exports, resolve);
  return module.exports;
}
const cache = load('src/repositories/fiscalNoteCache.js', () => ({ __esModule: true, default: storage }));
const id = '1'.repeat(44);
const note = { qrCodeId: id, merchantName: 'Loja', purchasedAt: '2026-01-01T12:00:00-03:00', totalAmount: 10, items: [{ sourceDescription: 'Produto', quantity: 1, unitPrice: 10, totalPrice: 10 }] };
const stubs = { '../repositories/fiscalNoteCache': cache, '../integrations/nfce/spExtractor': { isSaoPauloFiscalUrl: () => true, isFiscalRequestRejected: () => false, extractSaoPauloNfce: () => note }, '../domain/fiscalItems': { groupFiscalItems: (items) => items }, '../domain/packageMeasure': { extractPackageMeasure: () => ({}) } };
const service = load('src/services/nfceImportService.js', (name) => stubs[name] || {});
let requests = 0;
global.fetch = async () => { requests++; return { ok: true, text: async () => '<html/>' }; };
(async () => {
 const url = `https://nfce.fazenda.sp.gov.br/?p=${id}|3|1`;
 await service.loadFiscalPurchase(url, 'account-a');
 await service.loadFiscalPurchase(url, 'account-a');
 assert.equal(requests, 1, 'same account and note should use cache');
 await service.loadFiscalPurchase(url, 'account-b');
 assert.equal(requests, 2, 'other account must not reuse cache');
 const key = [...values.keys()].find(k => k.includes('account-a'));
 values.set(key, '{invalid');
 await service.loadFiscalPurchase(url, 'account-a');
 assert.equal(requests, 3);
 assert.equal(values.get(key), '{invalid', 'invalid cache must not be overwritten');
 storage.setItem = async () => { throw new Error('storage failure'); };
 assert.ok(await service.loadFiscalPurchase(url, 'account-c'), 'cache write failures must not block reading');
 console.log('PASS: fiscal cache reuse, account isolation, corrupt data preservation and write failure');
})().catch((e) => { console.error(e); process.exitCode = 1; });
