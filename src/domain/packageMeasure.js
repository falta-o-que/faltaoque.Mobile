// Extract one unambiguous package size. Multipacks and multiple sizes need review.
export function extractPackageMeasure(description) {
  const original = String(description ?? '');
  const unchanged = { sourceDescription: original, weight: null, unit: null };
  const matches = [...original.matchAll(/(?:^|[\s(\[.:-])(\d+(?:[.,]\d+)?)\s*(kg|ml|g|l)\b/gi)];
  if (matches.length !== 1 || /\d\s*[x×]\s*\d|\d\s*(?:kg|ml|g|l)\s*[x×]\s*\d/i.test(original)) return unchanged;
  const match = matches[0];
  const weight = Number(match[1].replace(',', '.'));
  if (!Number.isFinite(weight) || weight <= 0) return unchanged;
  const unit = match[2].toLowerCase() === 'l' ? 'L' : match[2].toLowerCase();
  const prefixLength = /^[.:-]/.test(match[0]) ? 0 : match[0].search(/\d/);
  const measureStart = match.index + prefixLength;
  const sourceDescription = (original.slice(0, measureStart) + ' ' + original.slice(match.index + match[0].length))
    .replace(/\(\s*\)|\[\s*\]/g, ' ').replace(/\s+/g, ' ').replace(/^[\s-]+|[\s-]+$/g, '').trim();
  if (!sourceDescription) return unchanged;
  return { sourceDescription, weight, unit };
}
