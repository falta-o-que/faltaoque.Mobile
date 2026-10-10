const assert = require('node:assert/strict');
const fs = require('node:fs');
const { transformSync } = require('@babel/core');
const code = transformSync(fs.readFileSync('src/integrations/nfce/spExtractor.js', 'utf8'), {
  babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
}).code;
const mod = { exports: {} };
new Function('exports', code)(mod.exports);
const { extractSaoPauloNfce } = mod.exports;
// Synthetic fixture: same public SP field layout, no real fiscal identifiers.
const fixture = `<div id="u20">Mercado Exemplo</div><table id="tabResult"><tr>
<td><span class="txtTit">Produto de teste</span><span class="RCod">(Código: 123)</span>
<span class="Rqtd"><strong>Qtde.:</strong>2,5</span>
<span class="RUN"><strong>UN:</strong>kg</span>
<span class="RvlUnit"><strong>Vl. Unit.:</strong>&nbsp;10,9</span></td>
<td><span class="valor">27,25</span></td></tr></table>
<span class="totalNumb txtMax">27,25</span><strong>Emissão: </strong>12/09/2026 14:58:45`;
const result = extractSaoPauloNfce(fixture);
assert.deepEqual(result, { merchantName: 'Mercado Exemplo', purchasedAt: '2026-09-12T14:58:45-03:00', totalAmount: 27.25,
  items: [{ sourceDescription: 'Produto de teste', quantity: 2.5, unitLabel: 'kg', unitPrice: 10.9, totalPrice: 27.25 }] });
assert.throws(() => extractSaoPauloNfce(fixture.replace('27,25</span></td>', '</span></td>')), /UNSUPPORTED/);
assert.throws(() => extractSaoPauloNfce('<html>Serviço indisponível</html>'), /UNSUPPORTED/);
assert.throws(() => extractSaoPauloNfce(fixture.replace('class="totalNumb txtMax"', 'class="missing"')), /UNSUPPORTED/);
console.log('PASS: SP layout, fractional quantity, prices without currency symbol, date and incomplete page rejection.');
