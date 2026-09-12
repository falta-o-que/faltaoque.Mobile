export const PRODUCT_CATEGORIES = ['bebidas', 'organicos', 'limpezaHigiene', 'integraisCereais', 'frescos', 'carnes'];
export const PRODUCT_UNITS = ['g', 'kg', 'ml', 'L'];

function parseDecimal(value, money = false) {
  const text = String(value ?? '').trim();
  const normalized = money && /^\d{1,3}(\.\d{3})+,\d{1,2}$/.test(text)
    ? text.replace(/\./g, '').replace(',', '.')
    : text.replace(',', '.');
  if (!(money ? /^\d+(\.\d{1,2})?$/ : /^\d+(\.\d+)?$/).test(normalized)) return NaN;
  return Number(normalized);
}

export function validateProduct(draft = {}) {
  const errors = {};
  const price = parseDecimal(draft.price, true);
  const quantity = Number(draft.quantity);
  const hasWeight = String(draft.weight ?? '').trim() !== '';
  if (typeof draft.name !== 'string' || !draft.name.trim()) errors.name = 'Informe o nome do produto.';
  if (!(price > 0) || !Number.isSafeInteger(Math.round(price * 100))) errors.price = 'Informe um preço positivo com até duas casas decimais.';
  if (!/^\d+$/.test(String(draft.quantity ?? '').trim()) || !Number.isSafeInteger(quantity) || quantity <= 0) errors.quantity = 'Informe uma quantidade inteira maior que zero.';
  if (!errors.price && !errors.quantity && !Number.isSafeInteger(Math.round(price * 100) * quantity)) errors.price = 'O valor total é muito alto.';
  if (hasWeight && (!(parseDecimal(draft.weight) > 0) || !Number.isFinite(parseDecimal(draft.weight)))) errors.weight = 'Informe um peso ou volume maior que zero.';
  if (hasWeight && !PRODUCT_UNITS.includes(draft.unit)) errors.unit = 'Escolha a unidade de medida.';
  if (draft.category && !PRODUCT_CATEGORIES.includes(draft.category)) errors.category = 'Escolha uma categoria válida.';
  return errors;
}

export function normalizeProduct(draft) {
  const errors = validateProduct(draft);
  if (Object.keys(errors).length) {
    const error = new Error('Verifique os campos do produto.');
    error.fields = errors;
    throw error;
  }
  const cents = Math.round(parseDecimal(draft.price, true) * 100);
  const quantity = Number(draft.quantity);
  const hasWeight = String(draft.weight ?? '').trim() !== '';
  return {
    name: draft.name.trim(), quantity, unitPrice: cents / 100, totalPrice: cents * quantity / 100,
    weight: hasWeight ? parseDecimal(draft.weight) : null,
    unit: hasWeight ? draft.unit : null,
    category: draft.category || null,
  };
}
