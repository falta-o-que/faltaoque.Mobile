const clean = (value) => String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&').replace(/\s+/g, ' ').trim();

function decimal(value) {
  const text = clean(value);
  if (!/^\d+(?:\.\d{3})*(?:,\d+)?$/.test(text)) return null;
  const number = Number(text.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(number) ? number : null;
}

function span(source, className) {
  const pattern = new RegExp(`<span\\b[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/span>`, 'i');
  return clean(source.match(pattern)?.[1]);
}

export function isSaoPauloFiscalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && /(^|\.)fazenda\.sp\.gov\.br$/i.test(url.hostname);
  } catch { return false; }
}

export function extractSaoPauloNfce(html) {
  const source = String(html ?? '');
  const table = source.match(/<table\b[^>]*id=["']tabResult["'][^>]*>([\s\S]*?)<\/table>/i)?.[1];
  const blocks = table?.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) ?? [];
  const items = blocks.map((block) => {
    const sourceDescription = span(block, 'txtTit');
    const quantity = decimal(span(block, 'Rqtd').replace(/^Qtde\.?\s*:\s*/i, ''));
    const unitLabel = span(block, 'RUN').replace(/^UN\s*:\s*/i, '').toLowerCase();
    const unitPrice = decimal(span(block, 'RvlUnit').replace(/^Vl\.\s*Unit\.\s*:\s*/i, ''));
    const totalPrice = decimal(span(block, 'valor'));
    if (!sourceDescription || !(quantity > 0) || unitPrice === null || totalPrice === null) throw new Error('UNSUPPORTED_FISCAL_PAGE');
    return { sourceDescription, quantity, unitLabel: unitLabel || null, unitPrice, totalPrice };
  });
  const merchantName = clean(source.match(/<div\b[^>]*id=["']u20["'][^>]*>([\s\S]*?)<\/div>/i)?.[1]);
  const totalAmount = decimal(span(source, 'txtMax'));
  const date = clean(source).match(/Emiss[aã]o:\s*(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}:\d{2}:\d{2})/i);
  if (!items.length || !merchantName || totalAmount === null || !date) throw new Error('UNSUPPORTED_FISCAL_PAGE');
  const purchasedAt = `${date[3]}-${date[2]}-${date[1]}T${date[4]}-03:00`;
  if (!Number.isFinite(Date.parse(purchasedAt))) throw new Error('UNSUPPORTED_FISCAL_PAGE');
  return { merchantName, purchasedAt, totalAmount, items };
}
