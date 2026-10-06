// Temporary session adapter. Replace this boundary with the hosted grocery-list API.
// No shopping-list data is written to device storage.
const listsByScope = new Map();

const scopeKey = (accountId, pantryId) => {
  if (!accountId || !pantryId) throw new Error('Conta e despensa são obrigatórias.');
  return `${accountId}:${pantryId}`;
};

const copy = (value) => JSON.parse(JSON.stringify(value));
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

const readScope = (accountId, pantryId) => listsByScope.get(scopeKey(accountId, pantryId)) ?? [];
const writeScope = (accountId, pantryId, lists) => listsByScope.set(scopeKey(accountId, pantryId), lists);

export async function listGroceryLists(accountId, pantryId) {
  return copy(readScope(accountId, pantryId));
}

export async function createGroceryList({ accountId, pantryId, name, plannedDate }) {
  const cleanName = name?.trim();
  if (!cleanName) throw new Error('Informe o nome da lista.');
  const list = { id: makeId(), accountId, pantryId, name: cleanName, plannedDate: plannedDate || null, status: 'active', items: [], createdAt: new Date().toISOString() };
  writeScope(accountId, pantryId, [...readScope(accountId, pantryId), list]);
  return copy(list);
}

export async function updateGroceryList({ accountId, pantryId, listId, name, plannedDate }) {
  const cleanName = name?.trim();
  if (!cleanName) throw new Error('Informe o nome da lista.');
  let updated;
  const lists = readScope(accountId, pantryId).map((list) => {
    if (list.id !== listId) return list;
    if (list.status !== 'active') throw new Error('Lista concluída não pode ser editada.');
    updated = { ...list, name: cleanName, plannedDate: plannedDate || null };
    return updated;
  });
  if (!updated) throw new Error('Lista não encontrada.');
  writeScope(accountId, pantryId, lists);
  return copy(updated);
}

export async function addGroceryItem({ accountId, pantryId, listId, name, category, quantity, weight, unit }) {
  const cleanName = name?.trim();
  const parsedQuantity = Number(quantity);
  if (!cleanName || !Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
    throw new Error('Informe nome e quantidade válida.');
  }
  const cleanWeight = String(weight ?? '').trim();
  const normalizedWeight = cleanWeight.replace(',', '.');
  if (cleanWeight && (!/^\d+(\.\d+)?$/.test(normalizedWeight) || Number(normalizedWeight) <= 0 || !['g', 'kg', 'ml', 'L'].includes(unit))) {
    throw new Error('Informe peso ou volume positivo e selecione a unidade.');
  }
  let added;
  const lists = readScope(accountId, pantryId).map((list) => {
    if (list.id !== listId) return list;
    if (list.status !== 'active') throw new Error('Lista concluída não pode ser editada.');
    // Every occurrence has its own id, including the same product in another list.
    added = { id: makeId(), name: cleanName, category: category || 'outros', quantity: parsedQuantity,
      weight: cleanWeight ? Number(normalizedWeight) : null, unit: cleanWeight ? unit : null, checked: false };
    return { ...list, items: [...list.items, added] };
  });
  if (!added) throw new Error('Lista não encontrada.');
  writeScope(accountId, pantryId, lists);
  return copy(added);
}

export async function setGroceryItemChecked({ accountId, pantryId, listId, itemId, checked }) {
  let changed = false;
  const lists = readScope(accountId, pantryId).map((list) => {
    if (list.id !== listId) return list;
    if (list.status !== 'active') throw new Error('Lista concluída não pode ser editada.');
    return { ...list, items: list.items.map((item) => {
      if (item.id !== itemId) return item;
      changed = true;
      return { ...item, checked: Boolean(checked) };
    }) };
  });
  if (!changed) throw new Error('Item não encontrado.');
  writeScope(accountId, pantryId, lists);
}

export async function removeCheckedGroceryItems({ accountId, pantryId, listId }) {
  let found = false;
  const lists = readScope(accountId, pantryId).map((list) => {
    if (list.id !== listId) return list;
    found = true;
    if (list.status !== 'active') throw new Error('Lista concluída não pode ser editada.');
    return { ...list, items: list.items.filter((item) => !item.checked) };
  });
  if (!found) throw new Error('Lista não encontrada.');
  writeScope(accountId, pantryId, lists);
}

export async function removeGroceryItems({ accountId, pantryId, listId, itemIds }) {
  const selected = new Set(itemIds);
  if (!selected.size) throw new Error('Selecione os produtos que deseja remover.');
  let found = false;
  const lists = readScope(accountId, pantryId).map((list) => {
    if (list.id !== listId) return list;
    found = true;
    if (list.status !== 'active') throw new Error('Lista concluída não pode ser editada.');
    if (list.items.filter((item) => selected.has(item.id)).length !== selected.size) {
      throw new Error('Um dos produtos selecionados não está nesta lista.');
    }
    return { ...list, items: list.items.filter((item) => !selected.has(item.id)) };
  });
  if (!found) throw new Error('Lista não encontrada.');
  writeScope(accountId, pantryId, lists);
}

export async function finishGroceryList({ accountId, pantryId, listId }) {
  let found = false;
  const lists = readScope(accountId, pantryId).map((list) => {
    if (list.id !== listId) return list;
    found = true;
    if (list.status !== 'active') throw new Error('Lista já concluída.');
    return { ...list, status: 'finished', finishedAt: new Date().toISOString() };
  });
  if (!found) throw new Error('Lista não encontrada.');
  writeScope(accountId, pantryId, lists);
}

export async function repeatGroceryList({ accountId, pantryId, listId }) {
  const source = readScope(accountId, pantryId).find((list) => list.id === listId);
  if (!source) throw new Error('Lista não encontrada.');
  if (source.status !== 'finished') throw new Error('Conclua a lista antes de repeti-la.');
  const repeated = { ...source, id: makeId(), name: source.name, status: 'active', createdAt: new Date().toISOString(), finishedAt: undefined,
    items: source.items.map((item) => ({ ...item, id: makeId(), checked: false })) };
  writeScope(accountId, pantryId, [...readScope(accountId, pantryId), repeated]);
  return copy(repeated);
}

export async function deleteGroceryList({ accountId, pantryId, listId }) {
  const lists = readScope(accountId, pantryId);
  const target = lists.find((list) => list.id === listId);
  if (!target) throw new Error('Lista não encontrada.');
  if (target.status === 'finished') throw new Error('Listas concluídas permanecem no histórico.');
  writeScope(accountId, pantryId, lists.filter((list) => list.id !== listId));
}

