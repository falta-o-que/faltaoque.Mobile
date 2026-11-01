const assert = require('node:assert/strict');
const {createHarness} = require('./local-test-harness.cjs');
const {createRequestGate} = createHarness().load('src/utils/requestGate.js');

async function main() {
    const gate = createRequestGate();
    let resolveA, resolveB;
    const a = new Promise((resolve) => {
        resolveA = resolve;
    });
    const b = new Promise((resolve) => {
        resolveB = resolve;
    });
    const accepted = [];

    async function choose(promise) {
        const isCurrent = gate.start();
        const result = await promise;
        if (isCurrent()) accepted.push(result);
    }

    const first = choose(a);
    const second = choose(b);
    resolveB('B');
    await second;
    resolveA('A');
    await first;
    assert.deepEqual(accepted, ['B']);
    let resolvePending;
    const pending = choose(new Promise((resolve) => {
        resolvePending = resolve;
    }));
    gate.invalidate();
    resolvePending('stale');
    await pending;
    assert.deepEqual(accepted, ['B']);
    console.log('place-request-gate tests passed');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
