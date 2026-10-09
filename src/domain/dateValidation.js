function daysInMonth(year, month) {
  if (month === 2) {
    const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return isLeapYear ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function normalizeDateOnly(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  const brMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!isoMatch && !brMatch) return null;

  const year = Number(isoMatch?.[1] ?? brMatch?.[3]);
  const month = Number(isoMatch?.[2] ?? brMatch?.[2]);
  const day = Number(isoMatch?.[3] ?? brMatch?.[1]);
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function isTodayOrFutureDate(value, now = new Date()) {
  const normalized = normalizeDateOnly(value);
  if (!normalized) return false;

  const today = `${String(now.getFullYear()).padStart(4, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return normalized >= today;
}
