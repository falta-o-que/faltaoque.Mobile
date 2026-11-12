const positiveNumber = (value) => {
    const text = String(value ?? '').trim();
    if (!/^\d+(?:[,.]\d+)?$/.test(text)) return null;
    const result = Number(text.replace(',', '.'));
    return Number.isFinite(result) && result > 0 ? result : null;
};

export function updateFiscalReviewPrice(item, field, value) {
    const mode = field === 'unitPrice' ? 'unit' : field === 'totalPrice' ? 'total' : item.priceMode || 'total';
    const next = {...item, [field]: value, priceMode: mode};
    const quantity = positiveNumber(next.quantity);
    const price = positiveNumber(mode === 'unit' ? next.unitPrice : next.totalPrice);
    const calculated = quantity && price ? (mode === 'unit' ? price * quantity : price / quantity) : null;
    const derived = calculated != null && Number.isFinite(calculated) ? calculated.toFixed(2).replace('.', ',') : '';
    return mode === 'unit' ? {...next, totalPrice: derived} : {...next, unitPrice: derived};
}
