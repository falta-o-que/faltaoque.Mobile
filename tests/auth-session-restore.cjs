const assert = require('node:assert/strict');
const fs = require('node:fs');
const {transformSync} = require('@babel/core');

const tick = () => new Promise((resolve) => setImmediate(resolve));
const defer = () => {
    let resolve, reject;
    const promise = new Promise((yes, no) => {
        resolve = yes;
        reject = no;
    });
    return {promise, resolve, reject};
};

function compile(file, mocks) {
    const {code} = transformSync(fs.readFileSync(file, 'utf8'), {
        babelrc: false,
        configFile: false,
        plugins: [['@babel/plugin-transform-react-jsx', {runtime: 'automatic'}], '@babel/plugin-transform-modules-commonjs'],
    });
    const module = {exports: {}};
    new Function('require', 'module', 'exports', code)((name) => {
        if (Object.hasOwn(mocks, name)) return mocks[name];
        throw new Error(`Unexpected import ${name}`);
    }, module, module.exports);
    return module.exports;
}

function createHarness() {
    const slots = [];
    const pendingEffects = [];
    const restoreRequests = [];
    const notificationSessions = [];
    let cursor = 0;

    const sameDeps = (left, right) => left?.length === right?.length && left.every((value, index) => value === right[index]);
    const useStoredValue = (factory, deps) => {
        const index = cursor++;
        if (!slots[index] || !sameDeps(slots[index].deps, deps)) {
            slots[index] = {deps, value: factory()};
        }
        return slots[index].value;
    };
    const react = {
        createContext: () => ({Provider: 'AuthContextProvider'}),
        useCallback: (callback, deps) => useStoredValue(() => callback, deps),
        useContext: () => null,
        useEffect(effect, deps) {
            const index = cursor++;
            if (!slots[index] || !sameDeps(slots[index].deps, deps)) {
                slots[index]?.cleanup?.();
                slots[index] = {deps};
                pendingEffects.push({effect, index});
            }
        },
        useMemo: (factory, deps) => useStoredValue(factory, deps),
        useState(initial) {
            const index = cursor++;
            if (!slots[index]) slots[index] = {value: typeof initial === 'function' ? initial() : initial};
            return [slots[index].value, (next) => {
                slots[index].value = typeof next === 'function' ? next(slots[index].value) : next;
            }];
        },
    };
    const node = (type, props) => ({type, props: props || {}});
    const module = compile('src/contexts/AuthContext.js', {
        react, 'react/jsx-runtime': {jsx: node, jsxs: node}, '../services/authService': {
            restoreSession() {
                const request = defer();
                restoreRequests.push(request);
                return request.promise;
            },
        }, '../services/notificationService': {
            setNotificationSession(accountId) {
                notificationSessions.push(accountId);
            },
        }, './SessionRestoreError': {__esModule: true, default: 'SessionRestoreError'},
    });

    return {
        notificationSessions, restoreRequests, render() {
            cursor = 0;
            return module.AuthProvider({children: 'APP'});
        }, flushEffects() {
            while (pendingEffects.length) {
                const {effect, index} = pendingEffects.shift();
                slots[index].cleanup = effect();
            }
        },
    };
}

async function retryAfterTransientFailure() {
    const harness = createHarness();
    let tree = harness.render();
    harness.flushEffects();
    harness.restoreRequests[0].reject(new Error('network unavailable'));
    await tick();

    tree = harness.render();
    const errorState = tree.props.children;
    assert.equal(errorState.type, 'SessionRestoreError', 'transient failure must show recovery UI');
    assert.deepEqual(harness.notificationSessions, [], 'transient failure must not clear the saved session state');
    assert.equal(tree.props.value.sessionRestoreError, true);

    errorState.props.onRetry();
    tree = harness.render();
    assert.equal(tree.props.children, 'APP', 'retry returns to the existing loading flow');
    assert.equal(tree.props.value.isRestoringSession, true);
    harness.flushEffects();

    const account = {id: 'account-1'};
    harness.restoreRequests[1].resolve(account);
    await tick();
    tree = harness.render();
    assert.equal(tree.props.children, 'APP');
    assert.equal(tree.props.value.account, account);
    assert.equal(tree.props.value.isRestoringSession, false);
    assert.equal(tree.props.value.sessionRestoreError, false);
    assert.deepEqual(harness.notificationSessions, ['account-1']);
}

async function confirmedSessionAbsenceEntersPublicFlow() {
    const harness = createHarness();
    let tree = harness.render();
    harness.flushEffects();
    harness.restoreRequests[0].resolve(null);
    await tick();
    tree = harness.render();

    assert.equal(tree.props.children, 'APP', 'confirmed absence must continue to public navigation');
    assert.equal(tree.props.value.account, null);
    assert.equal(tree.props.value.isRestoringSession, false);
    assert.equal(tree.props.value.sessionRestoreError, false);
    assert.deepEqual(harness.notificationSessions, [undefined]);
}

function translationsCoverSupportedLanguages() {
    const {getSessionRestoreMessages} = compile('src/contexts/SessionRestoreError/messages.js', {});
    for (const language of ['pt-BR', 'en', 'es']) {
        const messages = getSessionRestoreMessages(language);
        assert.ok(messages.title);
        assert.ok(messages.description);
    }
    assert.deepEqual(getSessionRestoreMessages('unknown'), getSessionRestoreMessages('pt-BR'));
}

(async () => {
    await retryAfterTransientFailure();
    await confirmedSessionAbsenceEntersPublicFlow();
    translationsCoverSupportedLanguages();
    console.log('auth-session-restore tests passed');
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
