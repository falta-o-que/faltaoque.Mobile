import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { translate } from '../localization';
import { listPantries } from './pantryService';
import { listProductOccurrences, listProducts } from './productService';

const CHANNEL_ID = 'pantry-alerts';
const PREFERENCES_KEY = '@faltaoque/app-preferences:v1';
const operationTails = new Map();
let deviceTail = Promise.resolve();
let notificationAccountId = null;
let sessionGeneration = 0;

function enqueueDeviceOperation(operation) {
  const result = deviceTail.then(operation);
  deviceTail = result.catch(() => {});
  return result;
}

export function setNotificationSession(accountId) {
  const previousAccount = notificationAccountId;
  notificationAccountId = accountId || null;
  sessionGeneration += 1;
  if (notificationAccountId) return;
  enqueueDeviceOperation(async () => {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const request of scheduled) {
      if (belongsToThisFeature(request) && (!previousAccount || belongsToAccount(request, previousAccount))) {
        await Notifications.cancelScheduledNotificationAsync(request.identifier);
      }
    }
    const presented = await Notifications.getPresentedNotificationsAsync();
    for (const entry of presented) {
      if (belongsToThisFeature(entry.request) && (!previousAccount || belongsToAccount(entry.request, previousAccount))) {
        await Notifications.dismissNotificationAsync(entry.request.identifier);
      }
    }
  }).catch(() => {});
}
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

function formatDate(expirationDate, language) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(expirationDate);
  if (!match) return expirationDate;
  return new Intl.DateTimeFormat(language, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))));
}

function defaultMetadata() {
  return { readIds: [], handledById: {}, dismissedIds: [], announcedIds: [], createdAtById: {} };
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
      createdAtById: parsed?.createdAtById && typeof parsed.createdAtById === 'object'
        ? parsed.createdAtById
        : {},
    };
  } catch {
    return defaultMetadata();
  }
}

async function preferredLanguage() {
  try {
    const rawValue = await AsyncStorage.getItem(PREFERENCES_KEY);
    const language = rawValue ? JSON.parse(rawValue)?.language : null;
    return ['pt-BR', 'en', 'es'].includes(language) ? language : 'pt-BR';
  } catch {
    return 'pt-BR';
  }
}

async function updateMetadata(accountId, update) {
  const key = metadataKey(accountId);
  const current = await readMetadata(accountId);
  const next = update(current);
  await AsyncStorage.setItem(key, JSON.stringify(next));
  return next;
}

function buildExpirationNotification(pantry, product, language) {
  const expirationDate = String(product.expirationDate ?? '').slice(0, 10);
  return {
    id: `expiration:${pantry.id}:${product.id}:${expirationDate}`,
    type: 'expiration',
    pantryId: pantry.id,
    pantryName: pantry.name,
    product,
    expirationDate,
    title: translate(language, 'notifications.productExpiredTitle', { product: product.name }),
  };
}

function depletedProductName(product) {
  return product.groupedBrands ? product.baseName || product.name : product.name || product.baseName;
}

function buildDepletedNotification(pantry, product, language) {
  return {
    id: `depleted:${pantry.id}:${product.id}`,
    type: 'depleted',
    pantryId: pantry.id,
    pantryName: pantry.name,
    product,
    title: translate(language, 'notifications.productDepletedTitle', { product: depletedProductName(product) }),
  };
}

async function loadNotificationState(accountId) {
  const [pantries, metadata, language] = await Promise.all([
    listPantries(accountId),
    readMetadata(accountId),
    preferredLanguage(),
  ]);
  const today = localDateKey();
  const byPantry = await Promise.all(pantries.map(async (pantry) => {
    const [occurrences, products] = await Promise.all([
      listProductOccurrences(accountId, pantry.id),
      listProducts(accountId, pantry.id),
    ]);
    const eligibleOccurrences = occurrences
      .filter((product) => Number(product.quantity) > 0 && product.expirationDate)
      .map((product) => buildExpirationNotification(pantry, product, language));
    const depleted = products
      .filter((product) => Number(product.quantity) === 0)
      .map((product) => buildDepletedNotification(pantry, product, language));
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
    createdAtById: Object.fromEntries(Object.entries(metadata.createdAtById)
      .filter(([id]) => allIds.has(id))),
  };
  const notificationTime = new Date().toISOString();
  current.forEach((notification) => {
    if (!nextMetadata.createdAtById[notification.id]) {
      nextMetadata.createdAtById[notification.id] = notification.type === 'expiration'
        ? `${notification.expirationDate}T00:00:00.000Z`
        : notificationTime;
    }
  });
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
      createdAt: nextMetadata.createdAtById[notification.id],
      isRead: nextMetadata.readIds.includes(notification.id),
      handled: nextMetadata.handledById[notification.id] ?? null,
    }))
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt));

  return { notifications, upcoming, metadata: nextMetadata, allIds, language };
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
  const language = await preferredLanguage();
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: translate(language, 'notifications.channelName'),
    description: translate(language, 'notifications.channelDescription'),
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

function notificationContent(accountId, notification, language) {
  const productName = notification.type === 'depleted'
    ? depletedProductName(notification.product)
    : notification.product.baseName || notification.product.name;
  return {
    title: notification.type === 'expiration'
      ? translate(language, 'notifications.expirationTitle')
      : translate(language, 'notifications.depletedTitle'),
    body: notification.type === 'expiration'
      ? translate(language, 'notifications.expirationBody', { product: notification.product.name, date: formatDate(notification.expirationDate, language), pantry: notification.pantryName })
      : translate(language, 'notifications.depletedBody', { product: productName, pantry: notification.pantryName }),
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

async function reconcileDeviceNotifications(accountId, { requestPermission = false } = {}, isCurrent = () => true) {
  const state = await loadNotificationState(accountId);
  if (!isCurrent()) return { permissionGranted: false, unreadCount: 0 };
  const unreadCount = state.notifications.filter((notification) => !notification.isRead).length;
  const permission = await getNotificationPermission(requestPermission);
  if (!isCurrent()) return { permissionGranted: false, unreadCount: 0 };
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
    if (!isCurrent()) return { permissionGranted: false, unreadCount: 0 };
    if (!belongsToThisFeature(request)) continue;
    const notificationId = notificationIdFromRequest(request);
    const desired = candidatesById.get(notificationId);
    const expectedContent = desired ? notificationContent(accountId, desired, state.language) : null;
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
    if (!isCurrent()) return { permissionGranted: false, unreadCount: 0 };
    const request = entry.request;
    if (!belongsToThisFeature(request)) continue;
    const notificationId = notificationIdFromRequest(request);
    const desired = candidatesById.get(notificationId);
    const expectedContent = desired ? notificationContent(accountId, desired, state.language) : null;
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
    if (!isCurrent()) return { permissionGranted: false, unreadCount: 0 };
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
      content: notificationContent(accountId, notification, state.language),
      trigger,
    });
    announcedIds.add(notification.id);
  }

  if (!isCurrent()) return { permissionGranted: false, unreadCount: 0 };
  await updateMetadata(accountId, (current) => ({
    ...current,
    announcedIds: [...announcedIds].filter((id) => state.allIds.has(id)),
  }));
  return { permissionGranted: true, unreadCount };
}

export function syncDeviceNotifications(accountId, options) {
  const generation = sessionGeneration;
  const isCurrent = () => notificationAccountId === accountId && generation === sessionGeneration;
  return enqueueDeviceOperation(() => isCurrent()
    ? withNotificationLock(accountId, () => isCurrent()
      ? reconcileDeviceNotifications(accountId, options, isCurrent)
      : { permissionGranted: false, unreadCount: 0 })
    : { permissionGranted: false, unreadCount: 0 });
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

export function markAllNotificationsRead(accountId) {
  return withNotificationLock(accountId, async () => {
    const state = await loadNotificationState(accountId);
    const ids = state.notifications
      .filter((notification) => !notification.isRead)
      .map((notification) => notification.id);

    if (ids.length === 0) return { ids, deviceCleared: true };

    await updateMetadata(accountId, (current) => ({
      ...current,
      readIds: [...new Set([...current.readIds, ...ids])],
    }));

    try {
      await removeDeviceNotifications(accountId, ids);
      return { ids, deviceCleared: true };
    } catch {
      return { ids, deviceCleared: false };
    }
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
