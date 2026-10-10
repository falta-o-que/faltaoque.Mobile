function normalizeIdentity(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ').trim().toLowerCase();
}

function packageKey(product = {}) {
  const amountValue = product.weight ?? product.contentValue ?? product.content_value;
  if (amountValue == null || amountValue === '') return 'none';
  const amount = Number(amountValue);
  if (!Number.isFinite(amount) || amount <= 0) return 'invalid';
  const unit = product.unit ?? product.unitOfMeasure ?? product.unit_of_measure;
  if (unit === 'kg' || unit === 'g') return `mass:${amount * (unit === 'kg' ? 1000 : 1)}`;
  if (unit === 'L' || unit === 'ml') return `volume:${amount * (unit === 'L' ? 1000 : 1)}`;
  return `invalid:${unit ?? 'none'}`;
}

export function getProductPresentationKey(product = {}) {
  return `${normalizeIdentity(product.name)}:${packageKey(product)}`;
}

export function getProductBrandIdentityKey(product = {}) {
  return `${getProductPresentationKey(product)}:${normalizeIdentity(product.brand)}`;
}

export function normalizeProductIdentity(value) {
  return normalizeIdentity(value);
}
