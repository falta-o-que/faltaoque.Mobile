const assert = require('node:assert/strict');
const {createHarness, seed} = require('./local-test-harness.cjs');

function market(id, cep, localName) {
  return {id, cep, latitude: null, longitude: null, local_name: localName};
}

function purchase(id, pantryId, marketId, location, date, total) {
  return {
    id, title: `Compra ${id}`, location, market_id: marketId, purchase_date: date,
    total_price: total, total_products: 1, is_finished: true, finish_date: date,
    qr_code_id: null, pantry_id: pantryId,
  };
}

function pantryProduct(id, purchaseId, categoryId, name, price) {
  return {
    id, name, quantity: 1, current_quantity: 1, is_in_pantry: true, content_value: null,
    unit_of_measure: null, price, brand: null, expiration_date: null, finish_date: null,
    is_deleted: false, purchase_id: purchaseId, category_id: categoryId,
  };
}

async function addInitialHistory(harness) {
  const {updateDatabase} = harness.load('src/storage/localDatabase.js');
  await updateDatabase((database) => {
    const beverages = database.categories.find((item) => item.name === 'bebidas').id;
    const lists = [{
      id: 'list-a', name: 'Lista preservada', date: '2026-11-06', location: null,
      market_id: null, suggestion: null, estimated_price: 12, pantry_id: 'p', is_active: true,
    }];
    const listProducts = [{
      id: 'list-product-a', name: 'Café', quantity: 1, content_value: null,
      unit_of_measure: null, is_taken: false, grocery_list_id: 'list-a', category_id: beverages,
    }];
    return {
      ...database,
      markets: [market('market-old-a', '11111111', 'Mercado antigo'), market('market-b', '22222222', 'Mercado B')],
      purchases: [
        purchase('purchase-old-a', 'p', 'market-old-a', '11111111', '2026-10-01', 10),
        purchase('purchase-old-a2', 'p-a2', null, '04000000', '2026-10-02', 20),
        purchase('purchase-b', 'p-b', 'market-b', '22222222', '2026-10-03', 30),
      ],
      pantry_products: [
        pantryProduct('product-old-a', 'purchase-old-a', beverages, 'Café antigo', 10),
        pantryProduct('product-old-a2', 'purchase-old-a2', beverages, 'Leite antigo', 20),
        pantryProduct('product-b', 'purchase-b', beverages, 'Café B', 30),
      ],
      grocery_lists: lists,
      grocery_list_products: listProducts,
    };
  });
}

async function addMockHistory(harness) {
  const {updateDatabase} = harness.load('src/storage/localDatabase.js');
  await updateDatabase((database) => {
    const beverages = database.categories.find((item) => item.name === 'bebidas').id;
    return {
      ...database,
      markets: [
        ...database.markets,
        market('demo-market-1', '99999001', 'Atacarejo Central'),
        market('demo-market-2', '99999002', 'Mercado do Bairro'),
        market('demo-market-3', '99999003', 'Supermercado Jardim'),
        market('real-market', '77777777', 'Mercado real'),
      ],
      purchases: [
        ...database.purchases,
        {...purchase('demo-a1', 'p', 'demo-market-1', '99999001', '2026-11-01', 20), title: 'Compra de demonstração'},
        {...purchase('demo-a2', 'p-a2', 'demo-market-2', '99999002', '2026-11-02', 30), title: 'Compra de demonstração'},
        {...purchase('demo-b', 'p-b', 'demo-market-3', '99999003', '2026-11-03', 40), title: 'Compra de demonstração'},
        {...purchase('similar-title-real-data', 'p', 'real-market', '77777777', '2026-11-04', 50), title: 'Compra de demonstração'},
      ],
      pantry_products: [
        ...database.pantry_products,
        pantryProduct('demo-product-a1', 'demo-a1', beverages, 'Mock A1', 20),
        pantryProduct('demo-product-a2', 'demo-a2', beverages, 'Mock A2', 30),
        pantryProduct('demo-product-b', 'demo-b', beverages, 'Mock B', 40),
        pantryProduct('real-product-similar-title', 'similar-title-real-data', beverages, 'Compra real', 50),
      ],
      grocery_lists: [...database.grocery_lists, {
        id: 'list-b-demo-market', name: 'Lista B', date: '2026-11-05', location: null,
        market_id: 'demo-market-3', suggestion: null, estimated_price: 0,
        pantry_id: 'p-b', is_active: true,
      }],
    };
  });
}

async function testDashboardReadAndPersistence() {
  const h = createHarness();
  await seed(h);
  const {createPantry} = h.load('src/repositories/pantryRepository.js');
  await createPantry({id: 'p-a2', accountId: 'a', name: 'Outra casa', color: '#00F0FF'});
  await createPantry({id: 'p-b', accountId: 'b', name: 'Casa B', color: '#00F0FF'});
  await addInitialHistory(h);

  const {listDashboardRecords} = h.load('src/repositories/dashboardRepository.js');
  const service = h.load('src/services/dashboardService.js');
  const accountA = await listDashboardRecords('a');
  assert.deepEqual(accountA.purchases.map((item) => item.id), ['purchase-old-a', 'purchase-old-a2']);
  assert.equal(accountA.purchases[0].pantryName, 'Casa');
  assert.equal(accountA.purchases[0].marketName, 'Mercado antigo');
  assert.equal(accountA.purchases[1].marketName, '04000000', 'market location is the fallback when no market row is linked');
  assert.equal(accountA.purchases[0].products[0].category, 'bebidas');
  assert.equal(accountA.purchases[0].products[0].total, 10);

  const loadedA = await service.loadDashboard('a');
  assert.equal(loadedA.records.length, 2);
  assert.equal(loadedA.filters.markets.length, 1);
  assert.equal(loadedA.filters.products.length, 2);
  const loadedB = await service.loadDashboard('b');
  assert.deepEqual(loadedB.records.map((item) => item.id), ['purchase-b']);
  assert.equal(loadedB.filters.markets[0].name, 'Mercado B');
  await assert.rejects(() => listDashboardRecords(null), /UNAUTHENTICATED/);

  const {updateDatabase} = h.load('src/storage/localDatabase.js');
  await updateDatabase((database) => ({
    ...database,
    purchases: database.purchases.map((item) => item.id === 'purchase-old-a'
      ? {...item, total_price: 42, purchase_date: '2026-11-07'} : item),
  }));
  const loadedAgain = await service.loadDashboard('a');
  assert.equal(loadedAgain.records.find((item) => item.id === 'purchase-old-a').total, 42,
    'dashboard reads the committed persisted snapshot on each load');
}

async function testMockCleanupAndAccountIsolation() {
  const h = createHarness();
  await seed(h);
  const {createPantry} = h.load('src/repositories/pantryRepository.js');
  await createPantry({id: 'p-a2', accountId: 'a', name: 'Outra casa', color: '#00F0FF'});
  await createPantry({id: 'p-b', accountId: 'b', name: 'Casa B', color: '#00F0FF'});
  await addInitialHistory(h);
  await addMockHistory(h);

  const {removeDashboardDemoPurchases} = h.load('src/repositories/dashboardRepository.js');
  const {readDatabase} = h.load('src/storage/localDatabase.js');
  const {purchaseCount, marketCount} = await removeDashboardDemoPurchases('a');
  assert.equal(purchaseCount, 2, 'only sample purchases in the active account’s pantries are removed');
  assert.equal(marketCount, 2, 'unused sample markets are removed, while referenced markets remain');

  let database = await readDatabase();
  assert.equal(database.pantries.length, 3, 'the cleanup preserves all pantries');
  assert.deepEqual(database.grocery_lists.map((list) => list.id), ['list-a', 'list-b-demo-market']);
  assert.deepEqual(database.grocery_list_products.map((item) => item.id), ['list-product-a']);
  assert.ok(!database.purchases.some((item) => ['demo-a1', 'demo-a2'].includes(item.id)));
  assert.ok(database.purchases.some((item) => item.id === 'purchase-old-a'), 'ordinary purchases in the same pantries are preserved');
  assert.ok(database.purchases.some((item) => item.id === 'purchase-old-a2'));
  assert.ok(database.purchases.some((item) => item.id === 'similar-title-real-data'), 'a matching title on a real market is not treated as a sample');
  assert.ok(database.purchases.some((item) => item.id === 'purchase-b'), 'another account’s purchase is preserved');
  assert.equal(database.purchases.length, 5);
  assert.equal(database.pantry_products.length, 5, 'only products linked to removed sample purchases are deleted');
  assert.ok(database.pantry_products.every((item) => !['demo-product-a1', 'demo-product-a2'].includes(item.id)));
  assert.ok(database.markets.some((item) => item.id === 'demo-market-3'), 'a sample market still referenced by a grocery list is preserved');
  assert.ok(database.markets.some((item) => item.id === 'real-market'));
  assert.ok(!database.markets.some((item) => ['demo-market-1', 'demo-market-2'].includes(item.id)));

  const service = h.load('src/services/dashboardService.js');
  const loadedA = await service.loadDashboard('a');
  assert.equal(loadedA.records.length, 3, 'dashboard loading retains the active account’s non-sample purchases');
  const {listDashboardRecords} = h.load('src/repositories/dashboardRepository.js');
  assert.equal((await listDashboardRecords('b')).purchases.length, 2,
    'the active account cleanup leaves another account’s sample untouched');
  const loadedB = await service.loadDashboard('b');
  assert.equal(loadedB.records.length, 1, 'the other account cleanup runs only when that account loads the dashboard');

  database = await readDatabase();
  const beforeSecondCleanup = JSON.stringify(database);
  const secondCleanup = await removeDashboardDemoPurchases('a');
  assert.deepEqual(secondCleanup, {purchaseCount: 0, marketCount: 0}, 'cleanup is idempotent');
  database = await readDatabase();
  assert.equal(JSON.stringify(database), beforeSecondCleanup);

  const beforeInvalidRequest = JSON.stringify(database);
  await assert.rejects(() => removeDashboardDemoPurchases(null), /UNAUTHENTICATED/);
  assert.equal(JSON.stringify(await readDatabase()), beforeInvalidRequest, 'an invalid cleanup request leaves the database unchanged');
}

async function main() {
  await testDashboardReadAndPersistence();
  await testMockCleanupAndAccountIsolation();
  console.log('dashboard-repository tests passed');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
