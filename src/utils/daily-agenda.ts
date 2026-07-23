import type { AgendaItem } from "../types/agenda";
import {
  addLocalDays,
  endOfLocalWeek,
  isSameLocalDay,
  parseLocalDate,
  startOfLocalDay,
  startOfLocalWeek,
} from "./local-date";

export type AgendaDateSection = "today" | "tomorrow" | "week" | "late";

export function getAgendaItemsForLocalDay(items: AgendaItem[], reference: Date = new Date()) {
  const seenPoolKeys = new Set<string>();

  return items.filter((item) => {
    if (!isSameLocalDay(item.data ?? item.visitDate, reference)) {
      return false;
    }

    const poolKey = item.piscinaId
      ? `pool:${item.piscinaId}`
      : `pool-fallback:${safeText(item.clientId ?? item.clientName)}:${safeText(item.poolName)}`;

    if (seenPoolKeys.has(poolKey)) {
      return false;
    }

    seenPoolKeys.add(poolKey);
    return true;
  });
}

export function getAgendaItemsForDateSection(
  items: AgendaItem[],
  section: AgendaDateSection,
  reference: Date = new Date(),
) {
  const today = startOfLocalDay(reference) ?? new Date();
  const tomorrow = addLocalDays(today, 1) ?? today;
  const weekStart = startOfLocalWeek(today) ?? today;
  const weekEnd = endOfLocalWeek(today) ?? today;

  if (section === "today") {
    return getAgendaItemsForLocalDay(items, today);
  }

  if (section === "tomorrow") {
    return getAgendaItemsForLocalDay(items, tomorrow);
  }

  const matchingItems = items.filter((item) => {
    const visitDate = parseLocalDate(item.data ?? item.visitDate);

    if (!visitDate) {
      return false;
    }

    const localVisitDay = startOfLocalDay(visitDate);

    if (!localVisitDay) {
      return false;
    }

    if (section === "late") {
      return localVisitDay < today && item.status !== "finished";
    }

    return localVisitDay >= weekStart && localVisitDay <= weekEnd;
  });

  return deduplicatePoolVisitsByDay(matchingItems);
}

function deduplicatePoolVisitsByDay(items: AgendaItem[]) {
  const seenVisitKeys = new Set<string>();

  return items.filter((item) => {
    const visitDate = parseLocalDate(item.data ?? item.visitDate);
    const poolKey = item.piscinaId
      ? `pool:${item.piscinaId}`
      : `pool-fallback:${safeText(item.clientId ?? item.clientName)}:${safeText(item.poolName)}`;
    const visitKey = `${poolKey}:${visitDate ? getLocalDayKey(visitDate) : "invalid-date"}`;

    if (seenVisitKeys.has(visitKey)) {
      return false;
    }

    seenVisitKeys.add(visitKey);
    return true;
  });
}

function getLocalDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function safeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
