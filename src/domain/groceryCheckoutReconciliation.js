import { extractPackageMeasure } from './packageMeasure';

export const RECONCILIATION_STATUS = Object.freeze({
  AUTO_MATCHED: 'auto_matched',
  MANUAL_REVIEW: 'manual_review',
});

export const RECONCILIATION_REASON = Object.freeze({
  AMBIGUOUS_FISCAL_DESCRIPTION: 'ambiguous_fiscal_description',
  AMBIGUOUS_PLANNED_MATCH: 'ambiguous_planned_match',
  INCOMPATIBLE_PRESENTATION: 'incompatible_presentation',
  NO_NAME_MATCH: 'no_name_match',
});

const BUILT_IN_BRANDS = Object.freeze([
  { name: 'Nestlé', aliases: ['Nestlé', 'Nestle'] },
  { name: 'Tio João', aliases: ['Tio João', 'Tio Joao'] },
]);

const DISPLAY_WORDS = Object.freeze({
  joao: 'João',
  nestle: 'Nestlé',
  prestigio: 'Prestígio',
  choc: 'Chocolate',
  bic: 'Biscoito',
  bisc: 'Biscoito',
  rech: 'Recheio',
});

const LOWERCASE_WORDS = new Set(['a', 'as', 'da', 'das', 'de', 'do', 'dos', 'e', 'em', 'para', 'por']);

function comparableText(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function wordsWithSpans(value) {
  const words = [];
  for (const match of String(value ?? '').matchAll(/[\p{L}\p{N}]+/gu)) {
    words.push({ key: comparableText(match[0]), start: match.index, end: match.index + match[0].length });
  }
  return words;
}

function normalizeBrandCatalog(brandCatalog) {
  const additionalBrands = Array.isArray(brandCatalog) ? brandCatalog : [];
  return [...BUILT_IN_BRANDS, ...additionalBrands].map((entry) => {
    const object = typeof entry === 'string' ? { name: entry, aliases: [entry] } : entry;
    const name = String(object?.name ?? '').trim();
    const aliases = [name, ...(object?.aliases ?? [])]
      .map((alias) => comparableText(alias).split(' ').filter(Boolean)).filter((tokens) => tokens.length > 0);
    return { name, key: comparableText(name), aliases };
  }).filter((entry) => entry.name && entry.key);
}

function locateKnownBrands(description, brandCatalog) {
  const sourceWords = wordsWithSpans(description);
  const matches = [];
  for (const brand of normalizeBrandCatalog(brandCatalog)) {
    for (const alias of brand.aliases) {
      for (let start = 0; start <= sourceWords.length - alias.length; start += 1) {
        if (alias.every((token, offset) => token === sourceWords[start + offset].key)) {
          matches.push({ brand, start: sourceWords[start].start, end: sourceWords[start + alias.length - 1].end });
        }
      }
    }
  }
  const unique = new Map();
  matches.forEach((match) => unique.set(`${match.brand.key}:${match.start}:${match.end}`, match));
  return [...unique.values()];
}

function removeTextSpan(value, start, end) {
  return `${value.slice(0, start)} ${value.slice(end)}`
    .replace(/\s+([,.;:)\]])/g, '$1').replace(/([(\[])\s+/g, '$1')
    .replace(/\(\s*\)|\[\s*\]/g, ' ').replace(/\s+/g, ' ')
    .replace(/^[\s,.;:/-]+|[\s,.;:/-]+$/g, '').trim();
}

function readableDisplayName(value) {
  const source = String(value ?? '').replace(/\./g, ' ').replace(/\s+/g, ' ').trim();
  const allCaps = !/[a-z\p{Ll}]/u.test(source);
  let wordIndex = 0;
  return source.replace(/[\p{L}][\p{L}\p{M}]*/gu, (word) => {
    const key = comparableText(word);
    const restored = DISPLAY_WORDS[key];
    const display = restored ?? (allCaps ? `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}` : word);
    const result = wordIndex > 0 && LOWERCASE_WORDS.has(key) ? key : display;
    wordIndex += 1;
    return result;
  }).replace(/\.(?=\s|$)/g, '');
}

const MATCH_STOP_WORDS = new Set(['a', 'as', 'da', 'das', 'de', 'do', 'dos', 'e', 'em', 'para', 'por', 'caixa', 'cx', 'at', 'un']);
const MATCH_TOKEN_ALIASES = Object.freeze({
  choc: 'chocolate',
  chocolate: 'chocolate',
  bic: 'bolacha',
  bisc: 'bolacha',
  biscoito: 'bolacha',
  bolacha: 'bolacha',
  rech: 'recheio',
  recheio: 'recheio',
  recheado: 'recheio',
});

function matchingTokens(value) {
  return comparableText(value).split(' ').map((token) => MATCH_TOKEN_ALIASES[token] ?? token)
    .filter((token) => token && !MATCH_STOP_WORDS.has(token));
}

function plannedMatchScore(plannedItem, fiscalProposal) {
  const plannedTokens = [...new Set(matchingTokens(plannedItem?.name))];
  const fiscalTokens = [...new Set(matchingTokens(fiscalProposal?.name))];
  if (!plannedTokens.length || !fiscalTokens.length) return 0;
  if (plannedTokens.length === fiscalTokens.length && plannedTokens.every((token) => fiscalTokens.includes(token))) return 1;
  const overlap = plannedTokens.filter((token) => fiscalTokens.includes(token));
  if (plannedTokens.length > 1 && overlap.length === plannedTokens.length) return 0.94;
  // A distinctive single-word product name (e.g. Prestígio) may have receipt qualifiers.
  if (plannedTokens.length === 1 && overlap.length === 1 && plannedTokens[0].length >= 7) return 0.86;
  return 0;
}

function hasAmbiguousMeasure(description, extracted) {
  if (extracted.weight != null) return false;
  return /\d+(?:[.,]\d+)?\s*(?:kg|ml|g|l)\b|\d\s*[x×]\s*\d/i.test(String(description ?? ''));
}

/**
 * Builds a review proposal from one receipt description.
 *
 * Brand removal is deliberately catalog based. Unknown words remain in `name`,
 * so the caller can show and edit the proposal without losing fiscal meaning.
 * An ambiguous brand or package expression sets `requiresReview` and therefore
 * prevents automatic matching.
 */
export function normalizeFiscalProduct(sourceDescription, { brandCatalog = [] } = {}) {
  const original = String(sourceDescription ?? '');
  const extracted = extractPackageMeasure(original);
  const issues = [];
  if (hasAmbiguousMeasure(original, extracted)) issues.push('ambiguous_package_measure');

  const brandMatches = locateKnownBrands(extracted.sourceDescription, brandCatalog);
  const brandKeys = new Set(brandMatches.map((match) => match.brand.key));
  let nameSource = extracted.sourceDescription;
  let brand = null;
  if (brandKeys.size === 1 && brandMatches.length === 1) {
    brand = brandMatches[0].brand.name;
    nameSource = removeTextSpan(nameSource, brandMatches[0].start, brandMatches[0].end);
  } else if (brandMatches.length > 0) {
    issues.push('ambiguous_brand');
  }

  // SEFAZ descriptions often append AT as an internal presentation code.
  nameSource = nameSource.replace(/\bAT\b/gi, ' ').replace(/\s+/g, ' ').trim();

  const name = readableDisplayName(nameSource);
  if (!comparableText(name)) issues.push('missing_product_name');
  return {
    sourceDescription: original,
    name,
    brand,
    weight: extracted.weight,
    unit: extracted.unit,
    requiresReview: issues.length > 0,
    issues,
  };
}

function readMeasure(product) {
  const weight = product?.weight ?? product?.contentValue ?? product?.content_value ?? null;
  const unit = product?.unit ?? product?.unitOfMeasure ?? product?.unit_of_measure ?? null;
  const hasWeight = weight != null && String(weight).trim() !== '';
  const hasUnit = unit != null && String(unit).trim() !== '';
  if (!hasWeight && !hasUnit) return { kind: 'absent' };
  if (!hasWeight || !hasUnit) return { kind: 'invalid' };
  const numericWeight = Number(String(weight).replace(',', '.'));
  const normalizedUnit = String(unit).trim().toLowerCase();
  if (!Number.isFinite(numericWeight) || numericWeight <= 0 || !['g', 'kg', 'ml', 'l'].includes(normalizedUnit)) {
    return { kind: 'invalid' };
  }
  if (normalizedUnit === 'kg') return { kind: 'valid', family: 'mass', amount: numericWeight * 1000 };
  if (normalizedUnit === 'g') return { kind: 'valid', family: 'mass', amount: numericWeight };
  return { kind: 'valid', family: 'volume', amount: normalizedUnit === 'l' ? numericWeight * 1000 : numericWeight };
}

/** A planned item without a size accepts a receipt package; otherwise sizes must be exactly equivalent. */
export function arePresentationsCompatible(plannedItem, fiscalProposal) {
  const planned = readMeasure(plannedItem);
  const fiscal = readMeasure(fiscalProposal);
  if (planned.kind === 'invalid' || fiscal.kind === 'invalid') return false;
  if (planned.kind === 'absent') return true;
  return fiscal.kind === 'valid' && planned.family === fiscal.family && Math.abs(planned.amount - fiscal.amount) < 1e-9;
}

/** Returns a high-confidence candidate; reconcileGroceryCheckout applies one-to-one constraints. */
export function findAutomaticPlannedMatch(fiscalProposal, plannedItems) {
  const candidates = (plannedItems ?? []).map((item, index) => ({
    plannedItemId: item?.id ?? null,
    plannedItemIndex: index,
    score: plannedMatchScore(item, fiscalProposal),
    compatible: arePresentationsCompatible(item, fiscalProposal),
  })).filter((candidate) => candidate.compatible && candidate.score > 0)
    .sort((a, b) => b.score - a.score);
  if (fiscalProposal?.requiresReview) return {
    status: RECONCILIATION_STATUS.MANUAL_REVIEW,
    reason: RECONCILIATION_REASON.AMBIGUOUS_FISCAL_DESCRIPTION, candidates,
  };
  if (candidates.length === 1 || (candidates.length > 1 && candidates[0].score - candidates[1].score >= 0.12)) {
    if (candidates[0].score >= 0.85) return {
      status: RECONCILIATION_STATUS.AUTO_MATCHED, reason: null, ...candidates[0], candidates,
    };
  }
  return {
    status: RECONCILIATION_STATUS.MANUAL_REVIEW,
    reason: candidates.length > 1 ? RECONCILIATION_REASON.AMBIGUOUS_PLANNED_MATCH : RECONCILIATION_REASON.NO_NAME_MATCH,
    candidates,
  };
}

/**
 * Reconciles receipt lines without merging them or mutating either input.
 * `occurrences` keeps one entry per fiscal line. `missingPlannedItems` contains
 * planned rows that received no safe automatic match and still need a decision.
 */
export function reconcileGroceryCheckout({ plannedItems = [], fiscalLines = [], brandCatalog = [] } = {}) {
  const occurrences = fiscalLines.map((fiscalLine, receiptLineIndex) => {
    const proposal = normalizeFiscalProduct(fiscalLine?.sourceDescription, { brandCatalog });
    const match = findAutomaticPlannedMatch(proposal, plannedItems);
    return { receiptLineIndex, fiscalLine: { ...fiscalLine }, proposal, match };
  });
  const eligibleByPlanned = new Map();
  occurrences.forEach((occurrence, occurrenceIndex) => {
    if (occurrence.match.status !== RECONCILIATION_STATUS.AUTO_MATCHED) return;
    const key = occurrence.match.plannedItemId ?? occurrence.match.plannedItemIndex;
    if (!eligibleByPlanned.has(key)) eligibleByPlanned.set(key, []);
    eligibleByPlanned.get(key).push(occurrenceIndex);
  });
  eligibleByPlanned.forEach((occurrenceIndexes) => {
    if (occurrenceIndexes.length < 2) return;
    occurrenceIndexes.forEach((occurrenceIndex) => {
      occurrences[occurrenceIndex].match = {
        status: RECONCILIATION_STATUS.MANUAL_REVIEW,
        reason: RECONCILIATION_REASON.AMBIGUOUS_PLANNED_MATCH,
        candidates: occurrences[occurrenceIndex].match.candidates,
      };
    });
  });
  const matchedIndexes = new Set(occurrences
    .filter(({ match }) => match.status === RECONCILIATION_STATUS.AUTO_MATCHED)
    .map(({ match }) => match.plannedItemIndex));
  const missingPlannedItems = plannedItems.map((item, plannedItemIndex) => ({ plannedItemIndex, plannedItem: { ...item } }))
    .filter(({ plannedItemIndex }) => !matchedIndexes.has(plannedItemIndex));
  return {
    occurrences,
    automaticMatches: occurrences.filter(({ match }) => match.status === RECONCILIATION_STATUS.AUTO_MATCHED),
    fiscalLinesForManualReview: occurrences.filter(({ match }) => match.status === RECONCILIATION_STATUS.MANUAL_REVIEW),
    missingPlannedItems,
  };
}

