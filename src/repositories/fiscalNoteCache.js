import AsyncStorage from '@react-native-async-storage/async-storage';

const keyFor = (accountId, qrCodeId) => `@faltaoque:fiscal-note:v1:${encodeURIComponent(accountId)}:${qrCodeId}`;
const validId = (accountId, qrCodeId) => Boolean(accountId) && /^\d{44}$/.test(qrCodeId || '');

export async function readFiscalNoteCache(accountId, qrCodeId) {
  if (!validId(accountId, qrCodeId)) return { purchase: null, writable: false };
  try {
    const raw = await AsyncStorage.getItem(keyFor(accountId, qrCodeId));
    if (raw === null) return { purchase: null, writable: true };
    const entry = JSON.parse(raw);
    const note = entry?.purchase;
    if (entry?.version !== 1 || note?.qrCodeId !== qrCodeId || !note.merchantName ||
        !note.purchasedAt || !Number.isFinite(note.totalAmount) || !Array.isArray(note.items) || !note.items.length ||
        note.items.some((item) => !item.sourceDescription || !(item.quantity > 0) || !Number.isFinite(item.unitPrice) || !Number.isFinite(item.totalPrice))) {
      return { purchase: null, writable: false };
    }
    return { purchase: note, writable: false };
  } catch {
    return { purchase: null, writable: false };
  }
}

export async function writeFiscalNoteCache(accountId, purchase) {
  if (!validId(accountId, purchase?.qrCodeId)) return;
  try {
    await AsyncStorage.setItem(keyFor(accountId, purchase.qrCodeId), JSON.stringify({ version: 1, purchase }));
  } catch {
    // A cache failure must not prevent the user from reviewing the note.
  }
}
