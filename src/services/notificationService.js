import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { listPantries } from './pantryService';
import { listProductOccurrences, listProducts } from './productService';

const CHANNEL_ID = 'pantry-alerts';
const operationTails = new Map();
const metadataKey = (accountId) => {
  if (!accountId) throw new Error('Entre na sua conta para consultar notificações.');
  return `@faltaoque/notifications/${encodeURIComponent(accountId)}`;
};

async function withNotificationLock(accountId, operation) {
  if (!accountId) throw new Error('Entre na sua conta para consultar notificações.');
  const previous = operationTails.get(accountId) ?? Promise.resolve();
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const tail = previous.catch(() => {}).then(() => gate);
  operationTails.set(accountId, tail);
  await previous.catch(() => {});
  try {
    return await operation();
  } finally {
    release();
    if (operationTails.get(accountId) === tail) operationTails.delete(accountId);
  }
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(expirationDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(expirationDate);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : expirationDate;
}

function defaultMetadata() {
  return { readIds: [], handledById: {}, dismissedIds: [], announcedIds: [] };
}

async function readMetadata(accountId) {
  try {
    const value = await AsyncStorage.getItem(metadataKey(accountId));
    const parsed = value ? JSON.parse(value) : {};
    return {
      readIds: Array.isArray(parsed?.readIds) ? parsed.readIds : [],
      handledById: parsed?.handledById && typeof parsed.handledById === 'object'
        ? parsed.handledById
        : {},
      dismissedIds: Array.isArray(parsed?.dismissedIds) ? parsed.dismissedIds : [],
      announcedIds: Array.isArray(parsed?.announcedIds) ? parsed.announcedIds : [],
    };
  } catch {
    return defaultMetadata();
  }
}

async function updateMetadata(accountId, update) {
  const key = metadataKey(accountId);
  const current = await readMetadata(accountId);
  const next = update(current);
  await AsyncStorage.setItem(key, JSON.stringify(next));
  return next;
}

function buildExpirationNotification(pantry, product) {
  const expirationDate = String(product.expirationDate ?? '').slice(0, 10);
  return {
    id: `expiration:${pantry.id}:${product.id}:${expirationDate}`,
    type: 'expiration',
    pantryId: pantry.id,
    pantryName: pantry.name,
    product,
    expirationDate,
    title: `${product.name} venceu`,
  };
}

function buildDepletedNotification(pantry, product) {
  const productName = product.baseName || product.name;
  return {
    id: `depleted:${pantry.id}:${product.id}`,
    type: 'depleted',
    pantryId: pantry.id,
    pantryName: pantry.name,
    product,
    title: `${productName} acabou na despensa`,
  };
}

async function loadNotificationState(accountId) {
  const [pantries, metadata] = await Promise.all([
    listPantries(accountId),
    readMetadata(accountId),
  ]);
  const today = localDateKey();
  const byPantry = await Promise.all(pantries.map(async (pantry) => {
    const [occurrences, products] = await Promise.all([
      listProductOccurrences(accountId, pantry.id),
      listProducts(accountId, pantry.id),
    ]);
    const eligibleOccurrences = occurrences
      .filter((product) => Number(product.quantity) > 0 && product.expirationDate)
      .map((product) => buildExpirationNotification(pantry, product));
    const depleted = products
      .filter((product) => Number(product.quantity) === 0)
      .map((product) => buildDepletedNotification(pantry, product));
    return {
      expired: eligibleOccurrences.filter((item) => item.expirationDate <= today),
      upcoming: eligibleOccurrences.filter((item) => item.expirationDate > today),
      depleted,
    };
  }));

  const current = byPantry.flatMap(({ expired, depleted }) => [...depleted, ...expired]);
  const upcoming = byPantry.flatMap(({ upcoming: items }) => items);
  const allIds = new Set([...current, ...upcoming].map((notification) => notification.id));
  const nextMetadata = {
    ...metadata,
    readIds: metadata.readIds.filter((id) => allIds.has(id)),
    handledById: Object.fromEntries(Object.entries(metadata.handledById)
      .filter(([id]) => allIds.has(id))),
    dismissedIds: metadata.dismissedIds.filter((id) => allIds.has(id)),
    announcedIds: metadata.announcedIds.filter((id) => allIds.has(id)),
  };
  if (JSON.stringify(nextMetadata) !== JSON.stringify(metadata)) {
    try {
      await AsyncStorage.setItem(metadataKey(accountId), JSON.stringify(nextMetadata));
    } catch {
      // The current screen can still display the state if local metadata cannot be pruned.
    }
  }

  const dismissed = new Set(nextMetadata.dismissedIds);
  const notifications = current
    .filter((notification) => !dismissed.has(notification.id))
    .map((notification) => ({
      ...notification,
      isRead: nextMetadata.readIds.includes(notification.id),
      handled: nextMetadata.handledById[notification.id] ?? null,
    }));

  return { notifications, upcoming, metadata: nextMetadata, allIds };
}

export async function listNotifications(accountId) {
  return withNotificationLock(accountId, async () => {
    const state = await loadNotificationState(accountId);
    return state.notifications;
  });
}

function isPermissionGranted(status) {
  return status?.granted || status?.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Avisos da despensa',
    description: 'Validade dos produtos e itens que acabaram na despensa.',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#00DD00',
    showBadge: false,
  });
}

async function getNotificationPermission(requestPermission) {
  await ensureChannel();
  let status = await Notifications.getPermissionsAsync();
  if (isPermissionGranted(status)) return status;

  const canAsk = status.canAskAgain !== false && status.ios?.status !== Notifications.IosAuthorizationStatus.DENIED;
  if (requestPermission && canAsk) {
    status = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: true },
    });
  }
  return status;
}

function expirationTriggerDate(expirationDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(expirationDate);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 9, 0, 0, 0);
}

function notificationContent(accountId, notification) {
  const productName = notification.product.baseName || notification.product.name;
  return {
    title: notification.type === 'expiration' ? 'Produto venceu' : 'Produto acabou',
    body: notification.type === 'expiration'
      ? `A validade de ${notification.product.name} chegou em ${formatDate(notification.expirationDate)} na despensa ${notification.pantryName}.`
      : `${productName} chegou a zero na despensa ${notification.pantryName}.`,
    data: {
      accountId,
      notificationId: notification.id,
      pantryId: notification.pantryId,
      type: notification.type,
    },
  };
}

function notificationIdFromRequest(request) {
  const data = request?.content?.data;
  return typeof data?.notificationId === 'string' ? data.notificationId : null;
}

function belongsToThisFeature(request) {
  const id = notificationIdFromRequest(request);
  return id?.startsWith('expiration:') || id?.startsWith('depleted:');
}

function belongsToAccount(request, accountId) {
  return request?.content?.data?.accountId === accountId;
}

async function reconcileDeviceNotifications(accountId, { requestPermission = false } = {}) {
  const state = await loadNotificationState(accountId);
  const unreadCount = state.notifications.filter((notification) => !notification.isRead).length;
  const permission = await getNotificationPermission(requestPermission);
  if (!isPermissionGranted(permission)) return { permissionGranted: false, unreadCount };

  const visibleIds = new Set(state.notifications.map((notification) => notification.id));
  const dismissedIds = new Set(state.metadata.dismissedIds);
  const candidates = [...state.notifications, ...state.upcoming]
    .filter((notification) => !dismissedIds.has(notification.id));
  const desiredIds = new Set(candidates.map((notification) => notification.id));
  const candidatesById = new Map(candidates.map((notification) => [notification.id, notification]));
  const staleIds = new Set();
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const scheduledIds = new Set();
  for (const request of scheduled) {
    if (!belongsToThisFeature(request)) continue;
    const notificationId = notificationIdFromRequest(request);
    const desired = candidatesById.get(notificationId);
    const expectedContent = desired ? notificationContent(accountId, desired) : null;
    const matchesContent = expectedContent &&
      request.content.title === expectedContent.title &&
      request.content.body === expectedContent.body;
    if (!belongsToAccount(request, accountId) || !desiredIds.has(notificationId) || !matchesContent) {
      await Notifications.cancelScheduledNotificationAsync(request.identifier);
      if (belongsToAccount(request, accountId) && desired) staleIds.add(notificationId);
    } else {
      scheduledIds.add(notificationId);
    }
  }

  const presented = await Notifications.getPresentedNotificationsAsync();
  const presentedIds = new Set();
  for (const entry of presented) {
    const request = entry.request;
    if (!belongsToThisFeature(request)) continue;
    const notificationId = notificationIdFromRequest(request);
    const desired = candidatesById.get(notificationId);
    const expectedContent = desired ? notificationContent(accountId, desired) : null;
    const matchesContent = expectedContent &&
      request.content.title === expectedContent.title &&
      request.content.body === expectedContent.body;
    if (!belongsToAccount(request, accountId) || !visibleIds.has(notificationId) || !matchesContent) {
      await Notifications.dismissNotificationAsync(request.identifier);
      if (belongsToAccount(request, accountId) && desired) staleIds.add(notificationId);
    } else {
      presentedIds.add(notificationId);
    }
  }

  const announcedIds = new Set(state.metadata.announcedIds);
  for (const id of staleIds) announcedIds.delete(id);
  for (const id of [...scheduledIds, ...presentedIds]) announcedIds.add(id);
  const today = localDateKey();
  for (const notification of candidates) {
    if (announcedIds.has(notification.id)) continue;
    const expirationDate = notification.type === 'expiration' && notification.expirationDate > today
      ? expirationTriggerDate(notification.expirationDate)
      : null;
    const trigger = expirationDate && expirationDate.getTime() > Date.now()
      ? {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, Math.ceil((expirationDate.getTime() - Date.now()) / 1000)),
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      }
      : Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null;
    await Notifications.scheduleNotificationAsync({
      content: notificationContent(accountId, notification),
      trigger,
    });
    announcedIds.add(notification.id);
  }

  await updateMetadata(accountId, (current) => ({
    ...current,
    announcedIds: [...announcedIds].filter((id) => state.allIds.has(id)),
  }));
  return { permissionGranted: true, unreadCount };
}

export function syncDeviceNotifications(accountId, options) {
  return withNotificationLock(accountId, () => reconcileDeviceNotifications(accountId, options));
}

async function removeDeviceNotifications(accountId, notificationIds) {
  const targets = new Set(notificationIds);
  if (targets.size === 0) return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled
    .filter((request) => belongsToAccount(request, accountId) && targets.has(notificationIdFromRequest(request)))
    .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)));
  const presented = await Notifications.getPresentedNotificationsAsync();
  await Promise.all(presented
    .filter((entry) => belongsToAccount(entry.request, accountId) && targets.has(notificationIdFromRequest(entry.request)))
    .map((entry) => Notifications.dismissNotificationAsync(entry.request.identifier)));
}

export function clearNotifications(accountId) {
  return withNotificationLock(accountId, async () => {
    const state = await loadNotificationState(accountId);
    const ids = state.notifications.map((notification) => notification.id);
    await updateMetadata(accountId, (current) => ({
      ...current,
      dismissedIds: [...new Set([...current.dismissedIds, ...ids])],
    }));
    try {
      await removeDeviceNotifications(accountId, ids);
      return { ids, deviceCleared: true };
    } catch {
      return { ids, deviceCleared: false };
    }
  });
}

export function markNotificationRead(accountId, notificationId) {
  return withNotificationLock(accountId, async () => {
    await updateMetadata(accountId, (current) => ({
      ...current,
      readIds: current.readIds.includes(notificationId)
        ? current.readIds
        : [...current.readIds, notificationId],
    }));
    await removeDeviceNotifications(accountId, [notificationId]);
  });
}

export function recordNotificationAddedToList(accountId, notificationId, list) {
  return withNotificationLock(accountId, async () => {
    await updateMetadata(accountId, (current) => ({
      ...current,
      readIds: current.readIds.includes(notificationId)
        ? current.readIds
        : [...current.readIds, notificationId],
      handledById: {
        ...current.handledById,
        [notificationId]: {
          action: 'added-to-list',
          listId: list.id,
          listName: list.name,
          handledAt: new Date().toISOString(),
        },
      },
    }));
    await removeDeviceNotifications(accountId, [notificationId]);
  });
}
