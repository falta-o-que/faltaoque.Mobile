const assert = require('node:assert/strict');
const {createHarness} = require('./local-test-harness.cjs');

const deferred = () => {
    let resolve, reject;
    const promise = new Promise((done, fail) => {
        resolve = done;
        reject = fail;
    });
    return {promise, resolve, reject};
};

async function main() {
    const {createFiscalScanSession} = createHarness().load('src/utils/fiscalScanSession.js');
    const session = createFiscalScanSession();
    const events = [];

    async function scan(request, prepare) {
        const isCurrent = session.begin();
        if (!isCurrent) return;
        try {
            const purchase = await request;
            if (!isCurrent()) return;
            await prepare(purchase, isCurrent);
        } catch (error) {
            if (isCurrent()) events.push(`error:${error.message}`);
        } finally {
            session.finish(isCurrent);
        }
    }

    const deliver = async (purchase, isCurrent) => {
        if (isCurrent()) events.push(`purchase:${purchase}`);
    };

    const first = deferred();
    const firstResult = scan(first.promise, deliver);
    assert.equal(session.isBusy(), true);
    await scan(Promise.resolve('duplicate'), deliver);
    assert.deepEqual(events, []);
    session.invalidate();
    assert.equal(session.isBusy(), false);
    const second = deferred();
    const secondResult = scan(second.promise, deliver);
    first.resolve('old');
    await firstResult;
    assert.equal(session.isBusy(), true, 'old completion must not release the new request');
    assert.deepEqual(events, []);
    second.resolve('new');
    await secondResult;
    assert.deepEqual(events, ['purchase:new']);
    assert.equal(session.isBusy(), false);

    const preparing = deferred();
    const preparationStarted = deferred();
    const thirdResult = scan(Promise.resolve('prepared'), async (purchase, isCurrent) => {
        preparationStarted.resolve();
        await preparing.promise;
        if (isCurrent()) events.push(`purchase:${purchase}`);
    });
    await preparationStarted.promise;
    session.invalidate();
    preparing.resolve();
    await thirdResult;
    assert.deepEqual(events, ['purchase:new'], 'closing during preparation must suppress navigation');

    const failing = deferred();
    const fourthResult = scan(failing.promise, deliver);
    session.invalidate();
    const fifth = deferred();
    const fifthResult = scan(fifth.promise, deliver);
    failing.reject(new Error('old failure'));
    await fourthResult;
    assert.equal(session.isBusy(), true);
    assert.deepEqual(events, ['purchase:new'], 'old failure must not appear in reopened scanner');
    fifth.resolve('latest');
    await fifthResult;
    assert.deepEqual(events, ['purchase:new', 'purchase:latest']);
    assert.equal(session.isBusy(), false);
    console.log('nfce-scanner-cancellation tests passed');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
