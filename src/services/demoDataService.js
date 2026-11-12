import * as Crypto from 'expo-crypto';

import {findAccountByEmail, findAccountById} from '../repositories/accountRepository';
import {saveActiveAccountId} from '../repositories/sessionRepository';
import {getCategoryId, getColorId, readDatabase, updateDatabase} from '../storage/localDatabase';

const DEMO_EMAIL = 'demo@faltaoque.app';
const DEMO_NAME = 'Mariana Oliveira';
const DEMO_PANTRY_NAME = 'Despensa da Mariana';
const UNITS = {g: 1, kg: 2, ml: 3, L: 4};

const MARKETS = [
  {name: 'Atacadão - Indianópolis', cep: '04045004', latitude: -23.6293346, longitude: -46.6447403, priceFactor: 0.94},
  {name: 'Carrefour Express Moema', cep: '04077023', latitude: -23.6074878, longitude: -46.6547188, priceFactor: 1.04},
  {name: 'Minuto Pão de Açúcar', cep: '04089001', latitude: -23.608077, longitude: -46.6620796, priceFactor: 1.11},
];

const PRODUCTS = [
  {name: 'Arroz tipo 1', category: 'integraisCereais', content: 5, unit: 'kg', price: 29.9, quantity: 1, brands: ['Camil', 'Prato Fino', 'Tio João']},
  {name: 'Feijão carioca', category: 'integraisCereais', content: 1, unit: 'kg', price: 8.49, quantity: 2, brands: ['Kicaldo', 'Tio João', 'Camil']},
  {name: 'Leite semidesnatado UHT', category: 'bebidas', content: 1, unit: 'L', price: 5.29, quantity: 4, brands: ['Piracanjuba', 'Italac', 'Tirol']},
  {name: 'Café torrado e moído', category: 'integraisCereais', content: 500, unit: 'g', price: 18.9, quantity: 1, brands: ['Pilão', 'Melitta', '3 Corações']},
  {name: 'Macarrão espaguete', category: 'integraisCereais', content: 500, unit: 'g', price: 4.39, quantity: 2, brands: ['Dona Benta', 'Adria', 'Renata']},
  {name: 'Peito de frango', category: 'carnes', content: 1, unit: 'kg', price: 19.9, quantity: 1, brands: ['Sadia', 'Seara', 'Perdigão']},
  {name: 'Banana nanica', category: 'frescos', content: 1, unit: 'kg', price: 7.99, quantity: 1, brands: ['Seleção da feira', 'Hortifruti', 'Fresquinho']},
  {name: 'Detergente neutro', category: 'limpezaHigiene', content: 500, unit: 'ml', price: 2.49, quantity: 2, brands: ['Ypê', 'Limpol', 'Minuano']},
  {name: 'Tomate italiano', category: 'frescos', content: 1, unit: 'kg', price: 9.49, quantity: 1, brands: ['Seleção da feira', 'Hortifruti', 'Fresquinho']},
];

const LISTS = [
  {name: 'Compras da semana', marketIndex: 0, items: [0, 1, 2, 3, 4, 6, 7], checked: [0, 2]},
  {name: 'Reposição e feira', marketIndex: 1, items: [1, 2, 5, 6, 8], checked: []},
];

function dateOnly(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function purchaseDate(monthsAgo, marketIndex, today) {
  const date = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 1);
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const day = monthsAgo === 0
    ? Math.max(1, Math.min(today.getDate() - marketIndex * 2, daysInMonth))
    : Math.min(5 + marketIndex * 7, daysInMonth);
  date.setDate(day);
  return dateOnly(date);
}

function futureDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return dateOnly(date);
}

function addDemoPurchase({database, pantryId, market, marketIndex, monthsAgo, today, stockPurchase}) {
  const purchaseId = Crypto.randomUUID();
  const date = purchaseDate(monthsAgo, marketIndex, today);
  const productRows = PRODUCTS.map((product, productIndex) => {
    const trend = 1 + ((17 - monthsAgo) * 0.004) + (Math.sin(monthsAgo + productIndex) * 0.025);
    const price = Math.round(product.price * market.priceFactor * trend * product.quantity * 100) / 100;
    const isInPantry = stockPurchase;
    const isFresh = product.category === 'frescos' || product.category === 'bebidas' || product.category === 'carnes';

    return {
      id: Crypto.randomUUID(),
      name: product.name,
      quantity: product.quantity,
      current_quantity: isInPantry ? Math.max(1, product.quantity - (productIndex % 2)) : 0,
      is_in_pantry: isInPantry,
      content_value: product.content,
      unit_of_measure: UNITS[product.unit],
      price,
      brand: product.brands[marketIndex],
      expiration_date: isInPantry && isFresh ? futureDate(5 + productIndex) : null,
      finish_date: isInPantry ? null : date,
      is_deleted: !isInPantry,
      purchase_id: purchaseId,
      category_id: getCategoryId(database, product.category),
    };
  });

  const totalPrice = Math.round(productRows.reduce((sum, product) => sum + product.price, 0) * 100) / 100;
  return {
    purchase: {
      id: purchaseId,
      title: `Compra demonstrativa - ${market.name}`,
      location: market.cep,
      market_id: market.id,
      purchase_date: date,
      total_price: totalPrice,
      total_products: productRows.length,
      is_finished: true,
      finish_date: date,
      qr_code_id: null,
      pantry_id: pantryId,
    },
    products: productRows,
  };
}

function buildDemoLists({pantryId, markets, database}) {
  return LISTS.flatMap((list, listIndex) => {
    const id = Crypto.randomUUID();
    const items = list.items.map((productIndex, itemIndex) => {
      const product = PRODUCTS[productIndex];
      return {
        id: Crypto.randomUUID(),
        name: product.name,
        quantity: product.quantity,
        content_value: product.content,
        unit_of_measure: UNITS[product.unit],
        is_taken: list.checked.includes(itemIndex),
        grocery_list_id: id,
        category_id: getCategoryId(database, product.category),
      };
    });
    const market = markets[list.marketIndex];
    return [{
      list: {
        id,
        name: list.name,
        date: futureDate(2 + listIndex * 5),
        location: market.cep,
        market_id: market.id,
        suggestion: null,
        estimated_price: null,
        pantry_id: pantryId,
        is_active: true,
      },
      items,
    }];
  });
}

async function ensureDemoData() {
  const existingAccount = await findAccountByEmail(DEMO_EMAIL);
  const existingDatabase = await readDatabase();
  const existingPantry = existingDatabase.pantries.find((pantry) => pantry.title === DEMO_PANTRY_NAME);
  if (existingAccount && existingPantry && existingDatabase.users_pantries.some((membership) =>
    membership.user_id === existingAccount.id && membership.pantry_id === existingPantry.id)) {
    return existingAccount.id;
  }

  const accountId = existingAccount?.id ?? Crypto.randomUUID();
  const pantryId = existingPantry?.id ?? Crypto.randomUUID();
  const passwordHash = existingAccount?.passwordHash ?? await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `demo-account-disabled-password:${accountId}`,
  );
  const markets = MARKETS.map((market) => {
    const existingMarket = existingDatabase.markets.find((entry) => entry.cep === market.cep &&
      entry.latitude === market.latitude && entry.longitude === market.longitude);
    return {...market, id: existingMarket?.id ?? Crypto.randomUUID()};
  });
  const today = new Date();

  await updateDatabase((database) => {
    const currentAccount = database.users.find((user) => user.id === accountId);
    const currentPantry = database.pantries.find((pantry) => pantry.id === pantryId);
    const shouldCreateHistory = !database.purchases.some((purchase) => purchase.pantry_id === pantryId);
    const history = shouldCreateHistory
      ? Array.from({length: 18}, (_, monthsAgo) => MARKETS.flatMap((market, marketIndex) => {
        const purchase = addDemoPurchase({
          database,
          pantryId,
          market: markets[marketIndex],
          marketIndex,
          monthsAgo,
          today,
          stockPurchase: monthsAgo === 0 && marketIndex === 0,
        });
        return [purchase];
      })).flat()
      : [];
    const lists = database.grocery_lists.some((list) => list.pantry_id === pantryId)
      ? []
      : buildDemoLists({pantryId, markets, database});

    return {
      ...database,
      users: currentAccount ? database.users : [...database.users, {
        id: accountId,
        name: DEMO_NAME,
        email: DEMO_EMAIL,
        password: passwordHash,
        avatar_id: getColorId(database, '#36B83F'),
        role: 1,
        is_active: true,
      }],
      pantries: currentPantry ? database.pantries : [...database.pantries, {
        id: pantryId,
        title: DEMO_PANTRY_NAME,
        location: '04046400',
        location_name: 'Estação São Judas, São Paulo - SP',
        color_id: getColorId(database, '#36B83F'),
        share_invite_id: null,
      }],
      users_pantries: database.users_pantries.some((membership) =>
        membership.user_id === accountId && membership.pantry_id === pantryId)
        ? database.users_pantries
        : [...database.users_pantries, {user_id: accountId, pantry_id: pantryId}],
      markets: [
        ...database.markets.map((market) => {
          const demoMarket = markets.find((entry) => entry.id === market.id);
          return demoMarket ? {...market, local_name: demoMarket.name} : market;
        }),
        ...markets.filter((market) => !database.markets.some((entry) => entry.id === market.id)),
      ],
      purchases: [...database.purchases, ...history.map(({purchase}) => purchase)],
      pantry_products: [...database.pantry_products, ...history.flatMap(({products}) => products)],
      grocery_lists: [...database.grocery_lists, ...lists.map(({list}) => list)],
      grocery_list_products: [...database.grocery_list_products, ...lists.flatMap(({items}) => items)],
    };
  });

  return accountId;
}

export async function startDemoSession() {
  const accountId = await ensureDemoData();
  await saveActiveAccountId(accountId);
  const account = await findAccountById(accountId);
  if (!account) throw new Error('DEMO_ACCOUNT_NOT_FOUND');
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    avatarColor: account.avatarColor,
  };
}
