export const GROCERY_SUGGESTION_TYPES = Object.freeze({
  NEAREST: 'nearest',
  BEST_VALUE: 'bestValue',
  MOST_BOUGHT_BRANDS: 'mostBoughtBrands',
});

export const GROCERY_SUGGESTION_OPTIONS = Object.freeze([
  { type: GROCERY_SUGGESTION_TYPES.NEAREST, label: 'Mais perto' },
  { type: GROCERY_SUGGESTION_TYPES.BEST_VALUE, label: 'Melhor custo-benefício' },
  { type: GROCERY_SUGGESTION_TYPES.MOST_BOUGHT_BRANDS, label: 'Marcas mais compradas' },
]);
