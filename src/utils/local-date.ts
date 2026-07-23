type FirestoreTimestampLike = {
  nanoseconds?: number;
  seconds?: number;
  toDate?: () => Date;
};

export function parseLocalDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }

  if (typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (value && typeof value === "object") {
    const timestamp = value as FirestoreTimestampLike;

    if (typeof timestamp.toDate === "function") {
      return parseLocalDate(timestamp.toDate());
    }

    if (typeof timestamp.seconds === "number") {
      return parseLocalDate(timestamp.seconds * 1000 + Math.floor((timestamp.nanoseconds ?? 0) / 1_000_000));
    }
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue.toLocaleLowerCase("pt-BR") === "hoje") {
    return new Date();
  }

  const brazilianDate = normalizedValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (brazilianDate) {
    return createValidLocalDate(
      Number(brazilianDate[3]),
      Number(brazilianDate[2]),
      Number(brazilianDate[1]),
    );
  }

  const databaseDate = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (databaseDate) {
    return createValidLocalDate(
      Number(databaseDate[1]),
      Number(databaseDate[2]),
      Number(databaseDate[3]),
    );
  }

  const parsed = new Date(normalizedValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isSameLocalDay(value: unknown, reference: unknown = new Date()) {
  const valueDate = parseLocalDate(value);
  const referenceDate = parseLocalDate(reference);

  return Boolean(
    valueDate &&
      referenceDate &&
      valueDate.getFullYear() === referenceDate.getFullYear() &&
      valueDate.getMonth() === referenceDate.getMonth() &&
      valueDate.getDate() === referenceDate.getDate(),
  );
}

export function formatLocalDateTime(value: unknown) {
  const date = parseLocalDate(value);
  return date ? date.toLocaleString("pt-BR") : "";
}

export function startOfLocalDay(value: unknown = new Date()) {
  const date = parseLocalDate(value);
  return date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : null;
}

export function addLocalDays(value: unknown, days: number) {
  const date = startOfLocalDay(value);

  if (!date) {
    return null;
  }

  date.setDate(date.getDate() + days);
  return startOfLocalDay(date);
}

export function startOfLocalWeek(value: unknown = new Date()) {
  const date = startOfLocalDay(value);

  if (!date) {
    return null;
  }

  const daysSinceMonday = (date.getDay() + 6) % 7;
  return addLocalDays(date, -daysSinceMonday);
}

export function endOfLocalWeek(value: unknown = new Date()) {
  const weekStart = startOfLocalWeek(value);
  return weekStart ? addLocalDays(weekStart, 6) : null;
}

export function isBeforeLocalDay(value: unknown, reference: unknown = new Date()) {
  const valueDay = startOfLocalDay(value);
  const referenceDay = startOfLocalDay(reference);
  return Boolean(valueDay && referenceDay && valueDay < referenceDay);
}

export function isAfterLocalDay(value: unknown, reference: unknown = new Date()) {
  const valueDay = startOfLocalDay(value);
  const referenceDay = startOfLocalDay(reference);
  return Boolean(valueDay && referenceDay && valueDay > referenceDay);
}

export function formatLocalDate(value: unknown) {
  const date = parseLocalDate(value);
  return date ? date.toLocaleDateString("pt-BR") : "";
}

function createValidLocalDate(year: number, month: number, day: number) {
  const date = new Date(year, month - 1, day);

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}
