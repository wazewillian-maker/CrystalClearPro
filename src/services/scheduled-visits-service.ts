import type { AgendaItem } from "../types/agenda";
import type { Client, WeekDay } from "../types/client";
import type { Employee } from "../types/employee";
import type { Piscina } from "../types/piscina";
import { getAgendaItemsForDateSection } from "../utils/daily-agenda";
import {
  addLocalDays,
  formatLocalDate,
  isSameLocalDay,
  parseLocalDate,
  startOfLocalDay,
  startOfLocalWeek,
} from "../utils/local-date";
import { normalizePersistedPool } from "../utils/pool-schedule";

type ScheduledVisitsInput = {
  clients: Client[];
  date: Date;
  employees: Employee[];
  persistedVisits: AgendaItem[];
  pools: Piscina[];
  logDetails?: boolean;
};

type ScheduledAgendaInput = Omit<ScheduledVisitsInput, "date"> & {
  daysAhead?: number;
  referenceDate?: Date;
};

export function getScheduledVisitsForDate({
  clients,
  date,
  employees,
  logDetails = true,
  persistedVisits,
  pools,
}: ScheduledVisitsInput) {
  const targetDate = startOfLocalDay(date);

  if (!targetDate) {
    return [];
  }

  const validClientsById = new Map(clients.map((client) => [client.id, client]));
  const normalizedPools = pools.map(normalizePersistedPool);
  const activePools = normalizedPools.filter(
    (pool) =>
      pool.status !== "inativa" &&
      Boolean(pool.id && pool.clienteId && validClientsById.has(pool.clienteId)),
  );
  const activePoolsById = new Map(activePools.map((pool) => [pool.id, pool]));
  const existingForDate = persistedVisits.filter((visit) => {
    const pool = activePoolsById.get(visit.piscinaId ?? "");
    return Boolean(
      pool &&
        visit.clientId === pool.clienteId &&
        isSameLocalDay(visit.data ?? visit.visitDate, targetDate),
    );
  });
  const selectedExistingByPool = selectExistingVisitsByPool(existingForDate);
  const results = [...selectedExistingByPool.values()];

  for (const pool of activePools) {
    const client = validClientsById.get(pool.clienteId);
    const existingVisit = selectedExistingByPool.get(pool.id);
    const scheduleDecision = getPoolScheduleDecision(pool, targetDate, persistedVisits);

    if (logDetails) {
      console.info("[Agenda Derivada] piscina analisada", {
        data: formatLocalDate(targetDate),
        diasProgramados: pool.diasAtendimento ?? [],
        frequenciaSemanal: pool.frequenciaSemanal ?? null,
        incluida: Boolean(existingVisit || scheduleDecision.scheduled),
        motivo: existingVisit
          ? "Visita persistida existente."
          : scheduleDecision.reason,
        piscinaId: pool.id,
        plano: pool.planoAtendimento ?? "nao informado",
      });
    }

    if (existingVisit || !scheduleDecision.scheduled || !client) {
      continue;
    }

    const responsibleId = getPoolResponsibleId(pool, persistedVisits);
    const employee = employees.find((currentEmployee) => currentEmployee.id === responsibleId);
    const dateLabel = formatLocalDate(targetDate);

    results.push({
      address: client.address,
      assignedEmployeeId: responsibleId,
      assignedEmployeeName: employee?.name,
      clientId: client.id,
      clientName: client.name,
      data: dateLabel,
      funcionarioId: responsibleId,
      id: `virtual:${pool.id}:${getLocalDateKey(targetDate)}`,
      neighborhood: client.neighborhood,
      origem: "Agenda Inteligente",
      piscinaId: pool.id,
      poolName: pool.nome,
      status: "pending",
      virtual: true,
      visitDate: dateLabel,
    });
  }

  return deduplicateVisits(results);
}

export function getScheduledAgendaItems({
  clients,
  daysAhead = 30,
  employees,
  persistedVisits,
  pools,
  referenceDate = new Date(),
}: ScheduledAgendaInput) {
  const today = startOfLocalDay(referenceDate) ?? new Date();
  const scheduledVisits: AgendaItem[] = [];

  for (let dayOffset = 0; dayOffset < daysAhead; dayOffset += 1) {
    const date = addLocalDays(today, dayOffset);

    if (date) {
      scheduledVisits.push(
        ...getScheduledVisitsForDate({
          clients,
          date,
          employees,
          logDetails: dayOffset <= 1,
          persistedVisits,
          pools,
        }),
      );
    }
  }

  const result = deduplicateVisits([...persistedVisits, ...scheduledVisits]);
  const tomorrow = addLocalDays(today, 1);
  const currentWeekStart = startOfLocalWeek(today);
  const normalizedPools = pools.map(normalizePersistedPool);

  console.info("[Agenda Derivada] resumo", {
    atrasadas: getAgendaItemsForDateSection(result, "late", today).length,
    dataAmanha: tomorrow ? formatLocalDate(tomorrow) : "invalida",
    dataAtual: formatLocalDate(today),
    piscinasAtivas: normalizedPools.filter((pool) => pool.status !== "inativa").length,
    semanaAtual: currentWeekStart ? formatLocalDate(currentWeekStart) : "invalida",
    visitasAmanha: tomorrow
      ? result.filter((visit) => isSameLocalDay(visit.data ?? visit.visitDate, tomorrow)).length
      : 0,
    visitasHoje: result.filter((visit) => isSameLocalDay(visit.data ?? visit.visitDate, today)).length,
    visitasSemana: getAgendaItemsForDateSection(result, "week", today).length,
  });

  return result;
}

export function getNextValidAgendaItem(items: AgendaItem[], referenceDate: Date = new Date()) {
  const pendingItems = items
    .filter((item) => item.status !== "finished")
    .sort((left, right) => {
      const leftTime = parseLocalDate(left.data ?? left.visitDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const rightTime = parseLocalDate(right.data ?? right.visitDate)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return leftTime - rightTime;
    });
  const todayItem = pendingItems.find((item) =>
    isSameLocalDay(item.data ?? item.visitDate, referenceDate),
  );

  if (todayItem) {
    return todayItem;
  }

  return pendingItems.find((item) => {
    const visitDay = startOfLocalDay(item.data ?? item.visitDate);
    const referenceDay = startOfLocalDay(referenceDate);
    return Boolean(visitDay && referenceDay && visitDay > referenceDay);
  });
}

function getPoolScheduleDecision(pool: Piscina, date: Date, persistedVisits: AgendaItem[]) {
  if (pool.status === "inativa") {
    return { reason: "Piscina inativa.", scheduled: false };
  }

  if (pool.planoAtendimento === "todo_dia") {
    return { reason: "Plano configurado para todos os dias.", scheduled: true };
  }

  if (pool.planoAtendimento === "avulso") {
    const scheduled = isSameLocalDay(pool.dataAvulsa ?? pool.dataAtendimentoAvulso, date);
    return {
      reason: scheduled ? "Data avulsa corresponde ao dia." : "Data avulsa diferente do dia.",
      scheduled,
    };
  }

  if (
    pool.planoAtendimento === "mensal" &&
    typeof pool.diaMensal === "number" &&
    pool.diaMensal >= 1 &&
    pool.diaMensal <= 31
  ) {
    const scheduled = date.getDate() === pool.diaMensal;
    return {
      reason: scheduled ? "Dia mensal corresponde ao dia." : "Dia mensal diferente do dia.",
      scheduled,
    };
  }

  const weekDay = weekDaysByIndex[date.getDay()];
  const configuredWeekDays =
    pool.frequenciaSemanal === 7 ? allWeekDays : pool.diasAtendimento ?? [];

  if (!configuredWeekDays.includes(weekDay)) {
    return { reason: `Dia ${weekDay} nao esta programado.`, scheduled: false };
  }

  if (pool.planoAtendimento !== "quinzenal") {
    return { reason: `Dia ${weekDay} programado.`, scheduled: true };
  }

  const anchor = getBiweeklyAnchor(pool, persistedVisits);

  if (!anchor) {
    return {
      reason: "Sem data inicial quinzenal; dia da semana configurado foi considerado.",
      scheduled: true,
    };
  }

  const anchorWeek = startOfLocalWeek(anchor);
  const targetWeek = startOfLocalWeek(date);

  if (!anchorWeek || !targetWeek) {
    return { reason: "Data quinzenal invalida.", scheduled: false };
  }

  const weekDistance = Math.floor((targetWeek.getTime() - anchorWeek.getTime()) / 604_800_000);
  const scheduled = Math.abs(weekDistance) % 2 === 0;
  return {
    reason: scheduled ? "Semana quinzenal programada." : "Semana alternada fora da recorrencia.",
    scheduled,
  };
}

function getBiweeklyAnchor(pool: Piscina, persistedVisits: AgendaItem[]) {
  const explicitAnchor = parseLocalDate(pool.dataInicio ?? pool.dataInicial);

  if (explicitAnchor) {
    return explicitAnchor;
  }

  const createdAnchor = parseLocalDate(pool.createdAt ?? pool.criadoEm);

  if (createdAnchor) {
    return createdAnchor;
  }

  return persistedVisits
    .filter((visit) => visit.piscinaId === pool.id)
    .map((visit) => parseLocalDate(visit.data ?? visit.visitDate))
    .filter((date): date is Date => Boolean(date))
    .sort((left, right) => left.getTime() - right.getTime())[0] ?? null;
}

function getPoolResponsibleId(pool: Piscina, persistedVisits: AgendaItem[]) {
  if (pool.funcionarioId) {
    return pool.funcionarioId;
  }

  return persistedVisits
    .filter((visit) => visit.piscinaId === pool.id && Boolean(visit.funcionarioId))
    .sort((left, right) => {
      const leftDate = parseLocalDate(left.data ?? left.visitDate)?.getTime() ?? 0;
      const rightDate = parseLocalDate(right.data ?? right.visitDate)?.getTime() ?? 0;
      return rightDate - leftDate;
    })[0]?.funcionarioId;
}

function selectExistingVisitsByPool(visits: AgendaItem[]) {
  const selected = new Map<string, AgendaItem>();

  for (const visit of visits) {
    const poolId = visit.piscinaId;

    if (!poolId) {
      continue;
    }

    const current = selected.get(poolId);

    if (!current || getStatusPriority(visit) > getStatusPriority(current)) {
      selected.set(poolId, { ...visit, virtual: false });
    }
  }

  return selected;
}

function deduplicateVisits(visits: AgendaItem[]) {
  const selected = new Map<string, AgendaItem>();

  for (const visit of visits) {
    const date = parseLocalDate(visit.data ?? visit.visitDate);

    if (!visit.piscinaId || !date) {
      continue;
    }

    const key = `${visit.piscinaId}:${getLocalDateKey(date)}`;
    const current = selected.get(key);

    if (!current || getStatusPriority(visit) > getStatusPriority(current)) {
      selected.set(key, visit);
    }
  }

  return [...selected.values()];
}

function getStatusPriority(visit: AgendaItem) {
  if (visit.status === "finished") return 3;
  if (visit.status === "in-progress") return 2;
  return visit.origem === "Manual" ? 1 : 0;
}

function getLocalDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

const allWeekDays: WeekDay[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const weekDaysByIndex: Record<number, WeekDay> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};
