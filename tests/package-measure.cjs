const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { transformSync } = require('@babel/core');

const file = path.resolve(__dirname, '..', 'src/domain/packageMeasure.js');
const code = transformSync(fs.readFileSync(file, 'utf8'), {
  babelrc: false,
  configFile: false,
  plugins: ['@babel/plugin-transform-modules-commonjs'],
}).code;
const mod = { exports: {} };
new Function('exports', 'module', code)(mod.exports, mod);
const { extractPackageMeasure } = mod.exports;

const unchanged = (sourceDescription) => ({ sourceDescription, weight: null, unit: null });

assert.deepEqual(extractPackageMeasure('Arroz 5 kg'), {
  sourceDescription: 'Arroz', weight: 5, unit: 'kg',
});
assert.deepEqual(extractPackageMeasure('Refri 350ML'), {
  sourceDescription: 'Refri', weight: 350, unit: 'ml',
});
assert.deepEqual(extractPackageMeasure('Leite 1,5 l'), {
  sourceDescription: 'Leite', weight: 1.5, unit: 'L',
});
assert.deepEqual(extractPackageMeasure('Suco 2.25L'), {
  sourceDescription: 'Suco', weight: 2.25, unit: 'L',
});
// Synthetic descriptions using receipt-style abbreviations joined to the size.
assert.deepEqual(extractPackageMeasure('CAFE ALMOF.500G'), {
  sourceDescription: 'CAFE ALMOF', weight: 500, unit: 'g',
});
assert.deepEqual(extractPackageMeasure('MOLHO TRAD.300G SACHE'), {
  sourceDescription: 'MOLHO TRAD SACHE', weight: 300, unit: 'g',
});
assert.deepEqual(extractPackageMeasure('BEBIDA VOL.1,5L'), {
  sourceDescription: 'BEBIDA VOL', weight: 1.5, unit: 'L',
});
assert.deepEqual(extractPackageMeasure('SUCO-350ML'), {
  sourceDescription: 'SUCO', weight: 350, unit: 'ml',
});

assert.deepEqual(extractPackageMeasure('Arroz'), unchanged('Arroz'));
assert.deepEqual(extractPackageMeasure('CARNE KG'), unchanged('CARNE KG'));
assert.deepEqual(extractPackageMeasure('Pack 6 x 350ml'), unchanged('Pack 6 x 350ml'));
assert.deepEqual(extractPackageMeasure('Cafe 1kg 500g'), unchanged('Cafe 1kg 500g'));
assert.deepEqual(extractPackageMeasure('Agua 0 ml'), unchanged('Agua 0 ml'));

// Parentheses unrelated to the extracted measure are part of the product name.
assert.deepEqual(extractPackageMeasure('Molho (caseiro) 500g'), {
  sourceDescription: 'Molho (caseiro)', weight: 500, unit: 'g',
});

console.log('PASS: package measure extraction, decimals, units, ambiguity guards and name punctuation.');
