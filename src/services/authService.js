import * as Crypto from 'expo-crypto';

import {
  createAccount,
  findAccountByEmail,
  findAccountById,
  normalizeEmail,
} from '../repositories/accountRepository';
import {
  clearActiveAccountId,
  getActiveAccountId,
  saveActiveAccountId,
} from '../repositories/sessionRepository';

const HASH_ITERATIONS = 4096;

const toHex = (bytes) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

async function hashPassword(password, salt) {
  let digest = `${salt}:${password}`;

  for (let iteration = 0; iteration < HASH_ITERATIONS; iteration += 1) {
    digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${salt}:${digest}`,
    );
  }

  return digest;
}

function toPublicAccount(account) {
  if (!account) return null;

  return {
    id: account.id,
    name: account.name,
    email: account.email,
    avatarColor: account.avatarColor,
  };
}

export async function register({ name, email, avatarColor, password }) {
  const normalizedEmail = normalizeEmail(email);
  const existingAccount = await findAccountByEmail(normalizedEmail);

  if (existingAccount) {
    throw new Error('EMAIL_ALREADY_EXISTS');
  }

  const salt = toHex(await Crypto.getRandomBytesAsync(16));
  const account = {
    id: Crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    avatarColor,
    passwordSalt: salt,
    passwordHash: await hashPassword(password, salt),
    createdAt: new Date().toISOString(),
  };

  await createAccount(account);
  await saveActiveAccountId(account.id);

  return toPublicAccount(account);
}

export async function login({ email, password }) {
  const account = await findAccountByEmail(email);

  if (!account) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const passwordHash = await hashPassword(password, account.passwordSalt);

  if (passwordHash !== account.passwordHash) {
    throw new Error('INVALID_CREDENTIALS');
  }

  await saveActiveAccountId(account.id);
  return toPublicAccount(account);
}

export async function restoreSession() {
  const accountId = await getActiveAccountId();

  if (!accountId) return null;

  const account = await findAccountById(accountId);

  if (!account) {
    await clearActiveAccountId();
    return null;
  }

  return toPublicAccount(account);
}

export async function logout() {
  await clearActiveAccountId();
}

