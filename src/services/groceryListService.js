// Local API simulator. The service contract stays independent from the storage
// adapter so it can later call the hosted grocery-list endpoints.
import * as Crypto from 'expo-crypto';
import { isWithinThreeMonthDateRange, normalizeDateOnly } from '../domain/dateValidation';
import { getCategoryId, readDatabase, updateDatabase } from '../storage/localDatabase';
import { estimateGroceryListPrices } from './groceryPriceEstimateService';

const scopeKey = (accountId, pantryId) => {
  if (!accountId || !pantryId) throw new Error('Conta e despensa são obrigatórias.');
  return { accountId, pantryId };
};

const copy = (value) => JSON.parse(JSON.stringify(value));
const makeId = () => Crypto.randomUUID();

function normalizePlannedDate(value) {
  if (!value) return null;
  const normalized = normalizeDateOnly(value);
  if (!normalized || !isWithinThreeMonthDateRange(normalized)) {
    throw new Error('A data planejada deve ser real e estar nos últimos 3 meses ou no futuro.');
  }
  return normalized;
}

function readScope(database, accountId, pantryId) {
  const member = database.users_pantries.some((row) => row.user_id === accountId && row.pantry_id === pantryId);
  if (!member) return [];
  const lists = database.grocery_lists.filter((list) => list.pantry_id === pantryId);
  return lists.map((list) => {
    const view = {
      id: list.id, accountId, pantryId, name: list.name, plannedDate: list.date,
      location: list.location, estimatedPrice: list.estimated_price,
      status: list.is_finished ? 'finished' : 'active',
      items: database.grocery_list_products.filter((item) => item.grocery_list_id === list.id).map((item) => ({
      id: item.id, name: item.name, category: database.categories.find((category) => category.id === item.category_id)?.name ?? 'outros', quantity: item.quantity ?? 1,
      weight: item.content_value, unit: ({ 1: 'g', 2: 'kg', 3: 'ml', 4: 'L' })[item.unit_of_measure] ?? null,
      checked: item.is_taken,
      })),
    };
    const estimate = view.status === 'active'
      ? estimateGroceryListPrices(database, view)
      : { estimatedPrice: view.estimatedPrice, matchedItems: 0, totalItems: view.items.length };
    return { ...view, ...estimate };
  });
}

function writeScope(database, pantryId, lists) {
  const previousListIds = new Set(database.grocery_lists
    .filter((list) => list.pantry_id === pantryId)
    .map((list) => list.id));
  const keptLists = database.grocery_lists.filter((list) => !previousListIds.has(list.id));
  const keptItems = database.grocery_list_products.filter((item) => !previousListIds.has(item.grocery_list_id));
  const listRows = [];
  const itemRows = [];
  lists.forEach((list) => {
    const { items = [], ...values } = list;
    const estimate = values.status === 'finished'
      ? { estimatedPrice: values.estimatedPrice ?? null }
      : estimateGroceryListPrices(database, { ...list, pantryId });
    listRows.push({
      id: values.id, name: values.name, date: values.plannedDate || null, location: values.location || null,
      suggestion: null, estimated_price: estimate.estimatedPrice, pantry_id: pantryId,
      is_finished: values.status === 'finished',
    });
    items.forEach((item) => itemRows.push({
      id: item.id, name: item.name, quantity: item.quantity ?? null, content_value: item.weight ?? null,
      unit_of_measure: ({ g: 1, kg: 2, ml: 3, L: 4 })[item.unit] ?? null,
      is_taken: Boolean(item.checked), grocery_list_id: list.id,
      category_id: getCategoryId(database, item.category),
    }));
  });
  return { ...database, grocery_lists: [...keptLists, ...listRows], grocery_list_products: [...keptItems, ...itemRows] };
}

async function mutateScope(accountId, pantryId, mutate) {
  const scope = scopeKey(accountId, pantryId);
  let result;
  await updateDatabase((database) => {
    if (!database.users_pantries.some((row) => row.user_id === scope.accountId && row.pantry_id === scope.pantryId)) {
      throw new Error('Esta despensa não está disponível para sua conta.');
    }
    const current = readScope(database, scope.accountId, scope.pantryId);
    const mutation = mutate(current);
    result = mutation.result;
    return writeScope(database, scope.pantryId, mutation.lists);
  });
  return result === undefined ? undefined : copy(result);
}

export async function listGroceryLists(accountId, pantryId) {
  const scope = scopeKey(accountId, pantryId);
  await updateDatabase((database) => {
    if (!database.users_pantries.some((row) => row.user_id === scope.accountId && row.pantry_id === scope.pantryId)) return database;
    const views = readScope(database, scope.accountId, scope.pantryId);
    const estimates = new Map(views
      .filter((list) => list.status === 'active')
      .map((list) => [list.id, estimateGroceryListPrices(database, list).estimatedPrice]));
    if ([...estimates].every(([id, price]) => database.grocery_lists.find((list) => list.id === id)?.estimated_price === price)) return database;
    return {
      ...database,
      grocery_lists: database.grocery_lists.map((list) => estimates.has(list.id)
        ? { ...list, estimated_price: estimates.get(list.id) } : list),
    };
  });
  const database = await readDatabase();
  return copy(readScope(database, scope.accountId, scope.pantryId));
}

export async function createGroceryList({ accountId, pantryId, name, plannedDate }) {
  const cleanName = name?.trim();
  if (!cleanName || cleanName.length > 100) throw new Error('Informe um nome de lista com até 100 caracteres.');
  const list = { id: makeId(), accountId, pantryId, name: cleanName, plannedDate: normalizePlannedDate(plannedDate), status: 'active', items: [], createdAt: new Date().toISOString() };
  await mutateScope(accountId, pantryId, (lists) => ({ lists: [...lists, list], result: list }));
  return copy(list);
}

export async function updateGroceryList({ accountId, pantryId, listId, name, plannedDate }) {
  const cleanName = name?.trim();
  if (!cleanName || cleanName.length > 100) throw new Error('Informe um nome de lista com até 100 caracteres.');
  const normalizedPlannedDate = normalizePlannedDate(plannedDate);
  return mutateScope(accountId, pantryId, (lists) => {
    let updated;
    const next = lists.map((list) => {
      if (list.id !== listId) return list;
      if (list.status !== 'active') throw new Error('Lista concluída não pode ser editada.');
      updated = { ...list, name: cleanName, plannedDate: normalizedPlannedDate };
      return updated;
    });
    if (!updated) throw new Error('Lista não encontrada.');
    return { lists: next, result: updated };
  });
}

export async function addGroceryItem({ accountId, pantryId, listId, name, category, quantity, weight, unit }) {
  const cleanName = name?.trim();
  const parsedQuantity = Number(quantity);
  if (!cleanName || cleanName.length > 100 || !Number.isInteger(parsedQuantity) || parsedQuantity < 1) throw new Error('Informe nome com até 100 caracteres e quantidade válida.');
  const cleanWeight = String(weight ?? '').trim();
  const normalizedWeight = cleanWeight.replace(',', '.');
  if (cleanWeight && (!/^\d+(\.\d+)?$/.test(normalizedWeight) || Number(normalizedWeight) <= 0 || !['g', 'kg', 'ml', 'L'].includes(unit))) {
    throw new Error('Informe peso ou volume positivo e selecione a unidade.');
  }
  return mutateScope(accountId, pantryId, (lists) => {
    let added;
    const next = lists.map((list) => {
      if (list.id !== listId) return list;
      if (list.status !== 'active') throw new Error('Lista concluída não pode ser editada.');
      // Each occurrence has its own identifier, even when names are equal.
      added = { id: makeId(), name: cleanName, category: category || 'outros', quantity: parsedQuantity,
        weight: cleanWeight ? Number(normalizedWeight) : null, unit: cleanWeight ? unit : null, checked: false };
      return { ...list, items: [...list.items, added] };
    });
    if (!added) throw new Error('Lista não encontrada.');
    return { lists: next, result: added };
  });
}

export async function updateGroceryItem({ accountId, pantryId, listId, itemId, name, category, quantity, weight, unit }) {
  const cleanName = name?.trim();
  const parsedQuantity = Number(quantity);
  if (!cleanName || cleanName.length > 100 || !Number.isInteger(parsedQuantity) || parsedQuantity < 1) throw new Error('Informe nome com até 100 caracteres e quantidade válida.');
  const cleanWeight = String(weight ?? '').trim();
  const normalizedWeight = cleanWeight.replace(',', '.');
  if (cleanWeight && (!/^\d+(\.\d+)?$/.test(normalizedWeight) || Number(normalizedWeight) <= 0 || !['g', 'kg', 'ml', 'L'].includes(unit))) {
    throw new Error('Informe peso ou volume positivo e selecione a unidade.');
  }
  await mutateScope(accountId, pantryId, (lists) => {
    let changed = false;
    const next = lists.map((list) => {
      if (list.id !== listId) return list;
      if (list.status !== 'active') throw new Error('Lista concluída não pode ser editada.');
      return { ...list, items: list.items.map((item) => {
        if (item.id !== itemId) return item;
        changed = true;
        return { ...item, name: cleanName, category: category || 'outros', quantity: parsedQuantity,
          weight: cleanWeight ? Number(normalizedWeight) : null, unit: cleanWeight ? unit : null };
      }) };
    });
    if (!changed) throw new Error('Item não encontrado.');
    return { lists: next };
  });
}

export async function setGroceryItemChecked({ accountId, pantryId, listId, itemId, checked }) {
  await mutateScope(accountId, pantryId, (lists) => {
    let changed = false;
    const next = lists.map((list) => {
      if (list.id !== listId) return list;
      if (list.status !== 'active') throw new Error('Lista concluída não pode ser editada.');
      return { ...list, items: list.items.map((item) => {
        if (item.id !== itemId) return item;
        changed = true;
        return { ...item, checked: Boolean(checked) };
      }) };
    });
    if (!changed) throw new Error('Item não encontrado.');
    return { lists: next };
  });
}

export async function removeCheckedGroceryItems({ accountId, pantryId, listId }) {
  await mutateScope(accountId, pantryId, (lists) => {
    let found = false;
    const next = lists.map((list) => {
      if (list.id !== listId) return list;
      found = true;
      if (list.status !== 'active') throw new Error('Lista concluída não pode ser editada.');
      return { ...list, items: list.items.filter((item) => !item.checked) };
    });
    if (!found) throw new Error('Lista não encontrada.');
    return { lists: next };
  });
}

export async function removeGroceryItems({ accountId, pantryId, listId, itemIds }) {
  const selected = new Set(itemIds);
  if (!selected.size) throw new Error('Selecione os produtos que deseja remover.');
  await mutateScope(accountId, pantryId, (lists) => {
    let found = false;
    const next = lists.map((list) => {
      if (list.id !== listId) return list;
      found = true;
      if (list.status !== 'active') throw new Error('Lista concluída não pode ser editada.');
      if (list.items.filter((item) => selected.has(item.id)).length !== selected.size) throw new Error('Um dos produtos selecionados não está nesta lista.');
      return { ...list, items: list.items.filter((item) => !selected.has(item.id)) };
    });
    if (!found) throw new Error('Lista não encontrada.');
    return { lists: next };
  });
}

export async function finishGroceryList({ accountId, pantryId, listId }) {
  await mutateScope(accountId, pantryId, (lists) => {
    let found = false;
    const next = lists.map((list) => {
      if (list.id !== listId) return list;
      found = true;
      if (list.status !== 'active') throw new Error('Lista já concluída.');
      return { ...list, status: 'finished', finishedAt: new Date().toISOString() };
    });
    if (!found) throw new Error('Lista não encontrada.');
    return { lists: next };
  });
}

export async function repeatGroceryList({ accountId, pantryId, listId, name, plannedDate }) {
  if (!plannedDate) throw new Error('Informe uma nova data para esta compra.');
  const normalizedPlannedDate = normalizePlannedDate(plannedDate);
  return mutateScope(accountId, pantryId, (lists) => {
    const source = lists.find((list) => list.id === listId);
    if (!source) throw new Error('Lista não encontrada.');
    if (source.status !== 'finished') throw new Error('Conclua a lista antes de repeti-la.');
    const cleanName = name?.trim() || source.name;
    if (cleanName.length > 100) throw new Error('O nome da lista deve ter até 100 caracteres.');
    const repeated = { ...source, id: makeId(), name: cleanName, plannedDate: normalizedPlannedDate,
      status: 'active', createdAt: new Date().toISOString(), finishedAt: undefined,
      items: source.items.map((item) => ({ ...item, id: makeId(), checked: false })) };
    return { lists: [...lists, repeated], result: repeated };
  });
}

export async function deleteGroceryList({ accountId, pantryId, listId }) {
  await mutateScope(accountId, pantryId, (lists) => {
    const target = lists.find((list) => list.id === listId);
    if (!target) throw new Error('Lista não encontrada.');
    if (target.status === 'finished') throw new Error('Listas concluídas permanecem no histórico.');
    return { lists: lists.filter((list) => list.id !== listId) };
  });
}
