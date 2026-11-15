import * as Crypto from 'expo-crypto';

export const DEMO_ACCOUNT_ID = '00000000-0000-4000-8000-000000000001';
const DEMO_PASSWORD_HASH = '6a86adf0e6f95e2c2104ac1eaca69e6f268d792eadbabe5d03c136ece27c871c';
const products = [
    ['Arroz tipo 1', 'Tio João', 5, 2, 4, 29.9], ['Feijão carioca', 'Camil', 1, 2, 4, 8.49],
    ['Leite integral', 'Italac', 1, 4, 1, 5.49], ['Macarrão espaguete', 'Renata', 500, 1, 4, 5.99],
    ['Óleo de soja', 'Soya', 900, 3, 7, 7.49], ['Café torrado e moído', 'Pilão', 500, 1, 1, 21.9],
    ['Açúcar refinado', 'União', 1, 2, 7, 5.99], ['Molho de tomate', 'Quero', 300, 1, 7, 3.79],
    ['Biscoito água e sal', 'Bauducco', 400, 1, 4, 7.29], ['Detergente', 'Ypê', 500, 3, 3, 2.79],
    ['Sabão em pó', 'Omo', 800, 1, 3, 16.9], ['Papel higiênico', 'Neve', null, null, 3, 18.9],
    ['Suco de laranja', 'Del Valle', 1, 4, 1, 9.9], ['Aveia em flocos', 'Quaker', 200, 1, 4, 6.9],
    ['Manteiga', 'Aviação', 200, 1, 5, 12.9], ['Frango congelado', 'Sadia', 1, 2, 6, 19.9],
];
const id = () => Crypto.randomUUID();
const dateOnly = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function createDemoData(database, metadata, today = new Date()) {
    const pantryId = id();
    database.users.push({id: DEMO_ACCOUNT_ID, name: 'Pessoa demonstração', email: 'demo@faltaoque.app', password: DEMO_PASSWORD_HASH, avatar_id: 12, role: 1, is_active: true});
    database.pantries.push({id: pantryId, title: 'Despensa de casa', location: '04046400', location_name: 'Estação São Judas', color_id: 12, share_invite_id: null});
    database.users_pantries.push({user_id: DEMO_ACCOUNT_ID, pantry_id: pantryId});
    const markets = [
        ['Atacadão Indianópolis', '04045004', -23.614, -46.662],
        ['Carrefour Express Moema', '04077023', -23.607, -46.668],
        ['Minuto Pão de Açúcar', '04089001', -23.603, -46.668],
    ].map(([local_name, cep, latitude, longitude]) => ({id: id(), local_name, cep, latitude, longitude}));
    database.markets.push(...markets);
    let lastPurchase;
    for (let month = 7; month >= 0; month -= 1) {
        for (let trip = 0; trip < 3; trip += 1) {
            const day = month === 0 ? Math.min(today.getDate(), [5, 10, 14][trip]) : [5, 10, 14][trip];
            const date = dateOnly(new Date(today.getFullYear(), today.getMonth() - month, day));
            const market = markets[(month + trip) % markets.length];
            const purchaseId = id();
            const rows = products.map((product, index) => {
                const [name, brand, content_value, unit_of_measure, category_id, basePrice] = product;
                const quantity = 1 + (index % 4 === 0 ? 1 : 0);
                const current_quantity = month === 0 && trip === 2 && index % 5 !== 0 ? quantity : 0;
                const expiration = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (index % 3 === 0 ? 5 : 100));
                return {id: id(), name, quantity, current_quantity, is_in_pantry: current_quantity > 0, content_value, unit_of_measure,
                    price: Math.round(basePrice * quantity * (1 + (7 - month) * 0.012 + ((month + trip) % 3) * 0.035) * 100) / 100,
                    brand, expiration_date: current_quantity ? dateOnly(expiration) : null, finish_date: current_quantity ? null : date,
                    is_deleted: false, purchase_id: purchaseId, category_id};
            });
            database.pantry_products.push(...rows);
            lastPurchase = {id: purchaseId, title: 'Compra do mês', location: market.cep, market_id: market.id, purchase_date: date,
                total_price: Math.round(rows.reduce((sum, row) => sum + row.price, 0) * 100) / 100,
                total_products: rows.reduce((sum, row) => sum + row.quantity, 0), is_finished: true, finish_date: date, qr_code_id: null, pantry_id: pantryId};
            database.purchases.push(lastPurchase);
        }
    }
    const addList = (name, active, selected) => {
        const listId = id();
        database.grocery_lists.push({id: listId, name, date: null, location: active ? null : lastPurchase.location,
            market_id: active ? null : lastPurchase.market_id, suggestion: null, estimated_price: active ? null : lastPurchase.total_price,
            pantry_id: pantryId, is_active: active});
        selected.forEach(([name, , content_value, unit_of_measure, category_id]) => database.grocery_list_products.push({
            id: id(), name, quantity: 1, content_value, unit_of_measure, is_taken: !active, grocery_list_id: listId, category_id,
        }));
        if (!active) metadata.listCheckout[listId] = {purchaseId: lastPurchase.id, finishedAt: `${lastPurchase.purchase_date}T12:00:00.000Z`};
    };
    addList('Compras da semana', true, products.slice(0, 8));
    addList('Compra anterior', false, products);
    return database;
}
