import {createRequestGate} from './requestGate';

export function createFiscalScanSession() {
    const gate = createRequestGate();
    let busy = false;
    return {
        begin() {
            if (busy) return null;
            busy = true;
            return gate.start();
        }, invalidate() {
            gate.invalidate();
            busy = false;
        }, isBusy: () => busy, finish(isCurrent) {
            if (isCurrent()) busy = false;
        },
    };
}
