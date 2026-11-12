const assert = require('node:assert/strict');
const { createHarness, seed } = require('./local-test-harness.cjs');

async function main() {
  const h = createHarness();
  await seed(h);
  const { addProduct, updateProduct, updateProductQuantity, listProductOccurrences } = h.load('src/services/productService.js');
  const { readDatabase, updateDatabase } = h.load('src/storage/localDatabase.js');
  const scope = { accountId: 'a', pantryId: 'p' };
  const draft = { ...scope, name: 'Café', price: '10', priceType: 'unit', quantity: '3', category: 'bebidas' };
  const product = await addProduct(draft);
  await updateProductQuantity({ ...scope, productId: product.id, quantity: 1 });
  await updateProduct({ ...draft, productId: product.id, quantity: '1' });
  let db = await readDatabase();
  let row = db.pantry_products.find((entry) => entry.id === product.id);
  assert.equal(row.quantity, 3);
  assert.equal(row.current_quantity, 1);
  assert.equal(row.price, 30);
  assert.equal(db.purchases.find((entry) => entry.id === row.purchase_id).total_price, 30);
  await updateProduct({ ...draft, productId: product.id, quantity: '1', price: '12' });
  db = await readDatabase();
  row = db.pantry_products.find((entry) => entry.id === product.id);
  assert.equal(row.price, 36);
  assert.equal(db.purchases.find((entry) => entry.id === row.purchase_id).total_price, 36);
  assert.equal((await listProductOccurrences('a', 'p'))[0].unitPrice, 12);
  await updateProduct({ ...draft, productId: product.id, quantity: '1', priceType: 'total', price: '45' });
  db = await readDatabase();
  row = db.pantry_products.find((entry) => entry.id === product.id);
  assert.equal(row.price, 45);
  assert.equal(db.purchases.find((entry) => entry.id === row.purchase_id).total_price, 45);

  await updateDatabase((database) => ({ ...database, purchases: database.purchases.map((purchase) =>
    purchase.id === row.purchase_id ? { ...purchase, qr_code_id: 'fiscal', total_price: 70 } : purchase) }));
  await updateProduct({ ...draft, productId: product.id, quantity: '1', price: '20' });
  db = await readDatabase();
  assert.equal(db.pantry_products.find((entry) => entry.id === product.id).price, 60);
  assert.equal(db.purchases.find((entry) => entry.id === row.purchase_id).total_price, 70);

  await updateDatabase((database) => ({ ...database,
    purchases: database.purchases.map((purchase) => purchase.id === row.purchase_id
      ? { ...purchase, qr_code_id: null, total_products: 2, total_price: 80 } : purchase),
    pantry_products: [...database.pantry_products, { ...row, id: 'other', price: 20 }],
  }));
  await updateProduct({ ...draft, productId: product.id, quantity: '1', price: '15' });
  db = await readDatabase();
  assert.equal(db.pantry_products.find((entry) => entry.id === product.id).price, 45);
  assert.equal(db.purchases.find((entry) => entry.id === row.purchase_id).total_price, 80);
  console.log('product-price-history tests passed');
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
