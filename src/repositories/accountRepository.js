import { getColorId, readDatabase, resolveColor, updateDatabase } from '../storage/localDatabase';

export function normalizeEmail(email) {
  return email.trim().toLocaleLowerCase('pt-BR');
}

export async function findAccountByEmail(email) {
  const database = await readDatabase();
  const normalizedEmail = normalizeEmail(email);

  const user = database.users.find((account) => account.email === normalizedEmail);
  return user?.is_active ? { ...user, passwordHash: user.password, passwordSalt: user.id,
    avatarColor: resolveColor(database, user.avatar_id)?.hex_code } : null;
}

export async function findAccountById(accountId) {
  const database = await readDatabase();
  const user = database.users.find((account) => account.id === accountId);
  return user?.is_active ? { ...user, passwordHash: user.password, passwordSalt: user.id,
    avatarColor: resolveColor(database, user.avatar_id)?.hex_code } : null;
}

export async function createAccount(account) {
  await updateDatabase((database) => {
    if (database.users.some((item) => item.email === account.email)) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }
    return { ...database, users: [...database.users, {
      id: account.id, name: account.name, email: account.email, password: account.passwordHash,
      avatar_id: getColorId(database, account.avatarColor), role: 1, is_active: true,
    }] };
  });

  return account;
}

