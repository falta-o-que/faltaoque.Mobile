export const PRODUCT_CATEGORIES = ['bebidas', 'organicos', 'limpezaHigiene', 'integraisCereais', 'frescos', 'carnes'];
export const PRODUCT_UNITS = ['g', 'kg', 'ml', 'L'];
export const PRODUCT_PRICE_TYPES = ['unit', 'total'];

function parseDecimal(value, money = false) {
  const text = String(value ?? '').trim();
  const normalized = money && /^\d{1,3}(\.\d{3})+,\d{1,2}$/.test(text)
    ? text.replace(/\./g, '').replace(',', '.')
    : text.replace(',', '.');
  if (!(money ? /^\d+(\.\d{1,2})?$/ : /^\d+(\.\d+)?$/).test(normalized)) return NaN;
  return Number(normalized);
}

function parseExpirationDate(value) {
  if (!value) return null;
  const match = String(value).match(/^(?:(\d{4})-(\d{2})-(\d{2})|(\d{2})\/(\d{2})\/(\d{4}))$/);
  if (!match) return null;
  const [, isoYear, isoMonth, isoDay, brDay, brMonth, brYear] = match;
  const [year, month, day] = [isoYear ?? brYear, isoMonth ?? brMonth, isoDay ?? brDay].map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function isTodayOrFuture(isoDate) {
  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const [year, month, day] = isoDate.split('-').map(Number);
  return Date.UTC(year, month - 1, day) >= todayUtc;
}

export function validateProduct(draft = {}) {
  const errors = {};
  const price = parseDecimal(draft.price, true);
  const quantity = Number(draft.quantity);
  const priceType = draft.priceType ?? 'unit';
  const hasWeight = String(draft.weight ?? '').trim() !== '';
  if (typeof draft.name !== 'string' || !draft.name.trim()) errors.name = 'Informe o nome do produto.';
  if (!(price > 0) || !Number.isSafeInteger(Math.round(price * 100))) errors.price = 'Informe um preço positivo com até duas casas decimais.';
  if (!PRODUCT_PRICE_TYPES.includes(priceType)) errors.priceType = 'Escolha como o preço foi informado.';
  if (!/^\d+$/.test(String(draft.quantity ?? '').trim()) || !Number.isSafeInteger(quantity) || quantity <= 0) errors.quantity = 'Informe uma quantidade inteira maior que zero.';
  if (priceType === 'unit' && !errors.price && !errors.quantity && !Number.isSafeInteger(Math.round(price * 100) * quantity)) errors.price = 'O valor total é muito alto.';
  if (hasWeight && (!(parseDecimal(draft.weight) > 0) || !Number.isFinite(parseDecimal(draft.weight)))) errors.weight = 'Informe um peso ou volume maior que zero.';
  if (hasWeight && !PRODUCT_UNITS.includes(draft.unit)) errors.unit = 'Escolha a unidade de medida.';
  if (!PRODUCT_CATEGORIES.includes(draft.category)) errors.category = 'Escolha uma categoria.';
  const expirationDate = draft.expirationDate && parseExpirationDate(draft.expirationDate);
  if (draft.expirationDate && !expirationDate) errors.expirationDate = 'Informe uma data válida no formato DD/MM/AAAA.';
  if (expirationDate && !isTodayOrFuture(expirationDate)) errors.expirationDate = 'A validade deve ser hoje ou uma data futura.';
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
  const priceType = draft.priceType ?? 'unit';
  const hasWeight = String(draft.weight ?? '').trim() !== '';
  return {
    name: draft.name.trim(), quantity,
    unitPrice: priceType === 'total' ? cents / 100 / quantity : cents / 100,
    totalPrice: priceType === 'total' ? cents / 100 : cents * quantity / 100,
    priceType,
    weight: hasWeight ? parseDecimal(draft.weight) : null,
    unit: hasWeight ? draft.unit : null,
    category: draft.category,
    expirationDate: draft.expirationDate ? parseExpirationDate(draft.expirationDate) : null,
  };
}
