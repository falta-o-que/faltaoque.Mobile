import { readDatabase, updateDatabase } from '../storage/localDatabase';

export function normalizeEmail(email) {
  return email.trim().toLocaleLowerCase('pt-BR');
}

export async function findAccountByEmail(email) {
  const database = await readDatabase();
  const normalizedEmail = normalizeEmail(email);

  return database.accounts.find((account) => account.email === normalizedEmail) ?? null;
}

export async function findAccountById(accountId) {
  const database = await readDatabase();
  return database.accounts.find((account) => account.id === accountId) ?? null;
}

export async function createAccount(account) {
  await updateDatabase((database) => {
    if (database.accounts.some((item) => item.email === account.email)) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }
    return { ...database, accounts: [...database.accounts, account] };
  });

  return account;
}

