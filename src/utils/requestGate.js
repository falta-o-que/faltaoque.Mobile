export function createRequestGate() {
    let sequence = 0;
    return {
        invalidate: () => {
            sequence += 1;
        }, start: () => {
            const request = ++sequence;
            return () => request === sequence;
        },
    };
}
