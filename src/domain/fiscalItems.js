// Only identical descriptions and sales units are combined within one receipt.
// Brands, package sizes and presentations remain part of the description.
const normalize = (value) => String(value ?? '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

export function groupFiscalItems(items) {
  const groups = new Map();
  for (const item of items) {
    const key = JSON.stringify([normalize(item.sourceDescription), normalize(item.unitLabel)]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.values()].map((lines) => {
    const quantity = Number(lines.reduce((sum, item) => sum + item.quantity, 0).toFixed(6));
    const totalPrice = lines.reduce((cents, item) => cents + Math.round(item.totalPrice * 100), 0) / 100;
    const hasDifferentPrices = lines.some((item) => item.unitPrice !== lines[0].unitPrice);
    const unitPrice = hasDifferentPrices
      ? lines.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) / quantity
      : lines[0].unitPrice;
    return {
      ...lines[0], quantity, totalPrice, unitPrice, hasDifferentPrices,
      // Preserve the fiscal lines independently of subsequent review edits.
      sourceItems: lines.map(({ sourceDescription, quantity: count, unitLabel, unitPrice: price, totalPrice: total }) => ({
        sourceDescription, quantity: count, unitLabel, unitPrice: price, totalPrice: total,
      })),
    };
  });
}
