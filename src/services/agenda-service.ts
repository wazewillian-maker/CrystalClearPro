import { visitasRepository } from "../repositories/visitas-repository";
import type { WeekDay } from "../types/client";
import type { Piscina } from "../types/piscina";
import type { Visita } from "../types/visita";
import { parseLocalDate } from "../utils/local-date";

const SMART_AGENDA_DAYS_AHEAD = 28;
const allWeekDays: WeekDay[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export type AgendaRefreshResult = {
  createdCount: number;
  ignoredReasons: string[];
  removedCount: number;
};

type AgendaSyncInput = {
  empresaId: string;
  existingVisits: Visita[];
  pools: Piscina[];
  validClientIds: Set<string>;
};

export const agendaService = {
  listarVisitasDoDia(empresaId: string, data: string) {
    return visitasRepository.listByEmpresaAndDate(empresaId, data);
  },

  listarVisitasDoFuncionario(empresaId: string, funcionarioId: string, data: string) {
    return visitasRepository.listByFuncionarioAndDate(empresaId, funcionarioId, data);
  },

  criarVisita(data: Omit<Visita, "id" | "criadoEm" | "atualizadoEm">) {
    return visitasRepository.create(data);
  },

  atualizarVisita(id: string, data: Partial<Omit<Visita, "id" | "criadoEm">>) {
    return visitasRepository.update(id, data);
  },

  async syncFutureVisits({
    empresaId,
    existingVisits,
    pools,
    validClientIds,
  }: AgendaSyncInput): Promise<AgendaRefreshResult> {
    const traceId = createSmartAgendaTraceId();
    const existingKeys = new Set(
      existingVisits.map((visit) =>
        getVisitDedupKey(visit.empresaId, visit.piscinaId, visit.data),
      ),
    );
    const manualVisits = existingVisits.filter((visit) => visit.origem === "manual");
    const automaticVisits = existingVisits.filter((visit) => visit.origem !== "manual");
    let createdCount = 0;
    const ignoredReasons: string[] = [];

    console.info("[Agenda Automatica] sincronizacao iniciada", {
      dataAtualLocal: formatDateLabel(startOfDate(new Date())),
      janelaDias: SMART_AGENDA_DAYS_AHEAD,
      piscinasEncontradas: pools.length,
      traceId,
      visitasAutomaticasExistentes: automaticVisits.length,
      visitasManuaisExistentes: manualVisits.length,
    });

    for (const originalPool of pools) {
      const pool = normalizePoolForSmartAgenda(originalPool);
      const reasons = getPoolIgnoredReasons(pool);

      if (!validClientIds.has(pool.clienteId)) {
        reasons.push("Cliente vinculado nao existe na lista ativa.");
      }

      if (reasons.length > 0) {
        ignoredReasons.push(...reasons.map((reason) => `${pool.id}: ${reason}`));
        console.info("[Agenda Automatica] piscina ignorada", {
          diasAtendimento: pool.diasAtendimento ?? [],
          motivos: reasons,
          piscinaId: pool.id,
          traceId,
        });
        continue;
      }

      const dates = generateSmartVisitDates(pool);
      const poolVisits = existingVisits.filter((visit) => visit.piscinaId === pool.id);
      const funcionarioId = getPoolResponsibleId(pool, poolVisits);

      console.info("[Agenda Automatica] piscina analisada", {
        datasCalculadas: dates,
        diasAtendimento: pool.diasAtendimento ?? [],
        piscinaId: pool.id,
        plano: pool.planoAtendimento,
        traceId,
      });

      for (const data of dates) {
        const dedupKey = getVisitDedupKey(empresaId, pool.id, data);

        if (existingKeys.has(dedupKey)) {
          console.info("[Agenda Automatica] piscina ignorada", {
            data,
            motivo: "Ja existe visita manual ou automatica para piscina + data.",
            piscinaId: pool.id,
            traceId,
          });
          continue;
        }

        await visitasRepository.createAutomatic(getAutomaticVisitId(pool.id, data), {
          clienteId: pool.clienteId,
          data,
          empresaId,
          funcionarioId: funcionarioId ?? null,
          origem: "agenda-inteligente",
          piscinaId: pool.id,
          responsavelNome: funcionarioId ? null : "Sem responsavel",
          status: "pendente",
        });
        existingKeys.add(dedupKey);
        createdCount += 1;
        console.info("[Agenda Automatica] nova visita criada", {
          data,
          piscinaId: pool.id,
          traceId,
        });
      }
    }

    console.info("[Agenda Automatica] sincronizacao concluida", {
      novasVisitasCriadas: createdCount,
      piscinasIgnoradas: ignoredReasons.length,
      traceId,
    });

    return { createdCount, ignoredReasons, removedCount: 0 };
  },

  async refreshFutureVisitsForPool(empresaId: string, pool: Piscina): Promise<AgendaRefreshResult> {
    const traceId = createSmartAgendaTraceId();
    console.info("[Agenda Inteligente] piscina criada/editada", getPoolDiagnostic(pool, traceId));

    try {
      const existingVisits = await visitasRepository.listByPiscina(empresaId, pool.id);
      return agendaService.syncFutureVisits({
        empresaId,
        existingVisits,
        pools: [pool],
        validClientIds: new Set([pool.clienteId]),
      });
    } catch (error) {
      console.error("[Agenda Inteligente] erro ao atualizar visitas futuras", {
        error,
        piscinaId: pool.id,
        traceId,
      });
      throw error;
    } finally {
      console.info("[Agenda Inteligente] finalizou atualizacao automatica", { piscinaId: pool.id, traceId });
    }
  },

  async removeFuturePendingVisitsForPool(empresaId: string, piscinaId: string): Promise<AgendaRefreshResult> {
    const traceId = createSmartAgendaTraceId();

    try {
      const existingVisits = await visitasRepository.listByPiscina(empresaId, piscinaId);
      const removal = await removeFuturePendingVisits(existingVisits, empresaId, piscinaId, traceId);

      return {
        createdCount: 0,
        ignoredReasons: [],
        removedCount: removal.removedCount,
      };
    } catch (error) {
      console.error("[Agenda Inteligente] erro ao remover visitas futuras da piscina excluida", {
        error,
        piscinaId,
        traceId,
      });
      throw error;
    } finally {
      console.info("[Agenda Inteligente] limpeza de exclusao finalizada", { piscinaId, traceId });
    }
  },

  async removeAllFutureOpenVisitsForPool(empresaId: string, piscinaId: string): Promise<number> {
    const existingVisits = await visitasRepository.listByPiscina(empresaId, piscinaId);
    const today = startOfDate(new Date());
    const visitsToRemove = existingVisits.filter((visit) => {
      const visitDate = parseDateLabel(visit.data);

      return Boolean(
        visit.empresaId === empresaId &&
          visit.piscinaId === piscinaId &&
          visit.status !== "concluida" &&
          visitDate &&
          visitDate >= today,
      );
    });

    for (const visit of visitsToRemove) {
      await visitasRepository.delete(visit.id);
    }

    return visitsToRemove.length;
  },
};

async function removeFuturePendingVisits(
  existingVisits: Visita[],
  empresaId: string,
  piscinaId: string,
  traceId: string,
) {
  const today = startOfDate(new Date());
  const end = addDaysToDate(today, SMART_AGENDA_DAYS_AHEAD - 1);
  const visitsToRemove = existingVisits.filter((visit) => {
    const visitDate = parseDateLabel(visit.data);

    return Boolean(
      visit.empresaId === empresaId &&
        visit.piscinaId === piscinaId &&
        visit.status === "pendente" &&
        visitDate &&
        visitDate >= today &&
        visitDate <= end,
    );
  });
  const removedVisitIds = new Set<string>();

  for (const visit of visitsToRemove) {
    await visitasRepository.delete(visit.id);
    removedVisitIds.add(visit.id);
  }

  console.info("[Agenda Inteligente] visitas futuras removidas", {
    fimJanela: formatDateLabel(end),
    inicioJanela: formatDateLabel(today),
    piscinaId,
    removidas: removedVisitIds.size,
    traceId,
  });

  return {
    removedCount: removedVisitIds.size,
    removedVisitIds,
  };
}

async function createFutureVisitsForPool(
  empresaId: string,
  pool: Piscina,
  existingVisits: Visita[],
  traceId: string,
) {
  const normalizedPool = normalizePoolForSmartAgenda(pool);
  const ignoredReasons = getPoolIgnoredReasons(normalizedPool);
  const existingKeys = new Set(existingVisits.map((visit) => getVisitDedupKey(visit.empresaId, visit.piscinaId, visit.data)));
  let createdCount = 0;

  if (ignoredReasons.length > 0) {
    console.info("[Agenda Inteligente] motivos se nenhuma visita foi criada", {
      motivos: ignoredReasons,
      piscina: getPoolDiagnostic(normalizedPool, traceId),
      traceId,
    });
    return { createdCount, ignoredReasons };
  }

  const dates = generateSmartVisitDates(normalizedPool);

  if (dates.length === 0) {
    const reason = getNoDatesReason(normalizedPool);
    console.info("[Agenda Inteligente] motivos se nenhuma visita foi criada", {
      motivo: reason,
      piscina: getPoolDiagnostic(normalizedPool, traceId),
      traceId,
    });
    return { createdCount, ignoredReasons: [reason] };
  }

  const funcionarioId = getPoolResponsibleId(normalizedPool, existingVisits);

  for (const data of dates) {
    const dedupKey = getVisitDedupKey(empresaId, normalizedPool.id, data);

    if (existingKeys.has(dedupKey)) {
      console.info("[Agenda Inteligente] visita duplicada ignorada", {
        data,
        dedupKey,
        piscinaId: normalizedPool.id,
        traceId,
      });
      continue;
    }

    await visitasRepository.create({
      clienteId: normalizedPool.clienteId,
      data,
      empresaId,
      funcionarioId: funcionarioId ?? null,
      origem: "agenda-inteligente",
      piscinaId: normalizedPool.id,
      responsavelNome: funcionarioId ? null : "Sem responsavel",
      status: "pendente",
    });
    existingKeys.add(dedupKey);
    createdCount += 1;
  }

  console.info("[Agenda Inteligente] visitas criadas", {
    criadas: createdCount,
    datas: dates,
    piscinaId: normalizedPool.id,
    traceId,
  });

  if (createdCount === 0) {
    console.info("[Agenda Inteligente] motivos se nenhuma visita foi criada", {
      motivo: "Todas as datas calculadas ja existiam para esta piscina.",
      piscinaId: normalizedPool.id,
      traceId,
    });
  }

  return { createdCount, ignoredReasons };
}

function generateSmartVisitDates(pool: Piscina, startDate = new Date(), daysAhead = SMART_AGENDA_DAYS_AHEAD) {
  const start = startOfDate(startDate);
  const end = addDaysToDate(start, daysAhead - 1);
  const dates: Date[] = [];

  if (pool.planoAtendimento === "todo_dia") {
    for (let index = 0; index < daysAhead; index += 1) {
      dates.push(addDaysToDate(start, index));
    }
  }

  if (pool.planoAtendimento === "mensal" || pool.planoAtendimento === "semanal") {
    dates.push(...generateWeeklyDates(start, end, getServiceWeekDays(pool), 7));
  }

  if (pool.planoAtendimento === "quinzenal") {
    dates.push(...generateWeeklyDates(start, end, getServiceWeekDays(pool), 14));
  }

  if (pool.planoAtendimento === "avulso") {
    const avulsoDate = parseDateLabel(pool.dataAvulsa ?? pool.dataAtendimentoAvulso);

    if (avulsoDate && avulsoDate >= start && avulsoDate <= end) {
      dates.push(avulsoDate);
    }
  }

  return Array.from(new Set(dates.map(formatDateLabel))).sort(sortDateLabels);
}

function getServiceWeekDays(pool: Piscina) {
  if (pool.frequenciaSemanal === 7) {
    return allWeekDays;
  }

  return pool.diasAtendimento ?? [];
}

function getPoolIgnoredReasons(pool: Piscina) {
  const reasons: string[] = [];

  if (!isSmartAgendaPoolActive(pool)) {
    reasons.push("Piscina inativa.");
  }

  if (!pool.id) {
    reasons.push("Piscina sem piscinaId.");
  }

  if (!pool.empresaId) {
    reasons.push("Piscina sem empresaId.");
  }

  if (!pool.clienteId) {
    reasons.push("Piscina sem clienteId.");
  }

  if (!pool.planoAtendimento) {
    reasons.push("Plano de atendimento nao informado ou nao reconhecido.");
  }

  if (
    (pool.planoAtendimento === "mensal" || pool.planoAtendimento === "semanal" || pool.planoAtendimento === "quinzenal") &&
    getServiceWeekDays(pool).length === 0
  ) {
    reasons.push("Selecione os dias de atendimento.");
  }

  return reasons;
}

function normalizePoolForSmartAgenda(pool: Piscina): Piscina {
  const rawPool = pool as unknown as Record<string, unknown>;

  return {
    ...pool,
    clienteId: safeText(rawPool.clienteId),
    dataAtendimentoAvulso: safeOptionalText(rawPool.dataAtendimentoAvulso),
    dataAvulsa: safeOptionalText(rawPool.dataAvulsa),
    diasAtendimento: normalizeWeekDays(rawPool.diasAtendimento),
    empresaId: safeText(rawPool.empresaId),
    frequenciaSemanal: normalizeWeeklyFrequency(rawPool.frequenciaSemanal),
    funcionarioId: safeOptionalText(rawPool.funcionarioId) ?? null,
    id: safeText(rawPool.id),
    nome: safeText(rawPool.nome, "Piscina nao encontrada"),
    planoAtendimento: normalizePlanoAtendimento(rawPool.planoAtendimento),
    status: isSmartAgendaPoolActive(pool) ? "ativa" : "inativa",
  };
}

function normalizePlanoAtendimento(value: unknown): Piscina["planoAtendimento"] {
  const aliases: Record<string, Piscina["planoAtendimento"]> = {
    avulso: "avulso",
    biweekly: "quinzenal",
    daily: "todo_dia",
    mensal: "mensal",
    monthly: "mensal",
    onetime: "avulso",
    one_time: "avulso",
    quinzenal: "quinzenal",
    semanal: "semanal",
    semana: "semanal",
    semanalmente: "semanal",
    todo_dia: "todo_dia",
    tododia: "todo_dia",
    todos_os_dias: "todo_dia",
    todososdias: "todo_dia",
    weekly: "semanal",
  };

  return aliases[normalizeTextToken(value)];
}

function normalizeWeeklyFrequency(value: unknown): Piscina["frequenciaSemanal"] {
  const numberValue = typeof value === "number" ? value : Number(String(value ?? "").trim());
  return Number.isInteger(numberValue) && numberValue >= 1 && numberValue <= 7
    ? (numberValue as Piscina["frequenciaSemanal"])
    : undefined;
}

function normalizeWeekDays(value: unknown): WeekDay[] {
  const rawItems = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,/;|]+|\s+\+\s+|\s+e\s+/i)
      : [];
  const weekDays = rawItems
    .map((item) => normalizeWeekDay(item))
    .filter((item): item is WeekDay => Boolean(item));

  return Array.from(new Set(weekDays));
}

function normalizeWeekDay(value: unknown): WeekDay | null {
  const aliases: Record<string, WeekDay> = {
    dom: "sunday",
    domingo: "sunday",
    friday: "friday",
    fri: "friday",
    monday: "monday",
    mon: "monday",
    quarta: "wednesday",
    quartafeira: "wednesday",
    quarta_feira: "wednesday",
    quinta: "thursday",
    quintafeira: "thursday",
    quinta_feira: "thursday",
    sab: "saturday",
    sabado: "saturday",
    saturday: "saturday",
    sat: "saturday",
    segunda: "monday",
    segundafeira: "monday",
    segunda_feira: "monday",
    sexta: "friday",
    sextafeira: "friday",
    sexta_feira: "friday",
    sunday: "sunday",
    terca: "tuesday",
    tercafeira: "tuesday",
    terca_feira: "tuesday",
    thursday: "thursday",
    thu: "thursday",
    tuesday: "tuesday",
    tue: "tuesday",
    wednesday: "wednesday",
    wed: "wednesday",
  };

  return aliases[normalizeTextToken(value)] ?? null;
}

function isSmartAgendaPoolActive(pool: Piscina) {
  const rawStatus = normalizeTextToken((pool as unknown as { status?: unknown }).status);
  return !rawStatus || rawStatus === "ativa" || rawStatus === "ativo";
}

function getNoDatesReason(pool: Piscina) {
  if (pool.planoAtendimento === "avulso") {
    return "Plano avulso sem dataAvulsa valida nos proximos 30 dias.";
  }

  return "Nenhuma data encontrada nos proximos 30 dias.";
}

function generateWeeklyDates(start: Date, end: Date, weekDays: WeekDay[], intervalDays: 7 | 14) {
  return weekDays.flatMap((weekDay) => {
    const dates: Date[] = [];
    let currentDate = getNextDateForWeekDay(start, weekDay);

    while (currentDate <= end) {
      dates.push(currentDate);
      currentDate = addDaysToDate(currentDate, intervalDays);
    }

    return dates;
  });
}

function getNextDateForWeekDay(start: Date, weekDay: WeekDay) {
  const targetDay = weekDayIndexes[weekDay];
  const distance = (targetDay - start.getDay() + 7) % 7;
  return addDaysToDate(start, distance);
}

function getPoolResponsibleId(pool: Piscina, existingVisits: Visita[]) {
  if (pool.funcionarioId) {
    return pool.funcionarioId;
  }

  return existingVisits
    .filter((visit) => visit.piscinaId === pool.id && Boolean(visit.funcionarioId))
    .sort((left, right) => sortDateLabels(right.data, left.data))[0]?.funcionarioId;
}

function getVisitDedupKey(empresaId: string, piscinaId: string, data: string) {
  const localDate = parseDateLabel(data);
  return `${empresaId}__${piscinaId}__${localDate ? formatDateLabel(localDate) : data.trim()}`;
}

function getAutomaticVisitId(piscinaId: string, data: string) {
  const localDate = parseDateLabel(data);
  const dateKey = localDate
    ? `${localDate.getFullYear()}${String(localDate.getMonth() + 1).padStart(2, "0")}${String(localDate.getDate()).padStart(2, "0")}`
    : data.replace(/\D/g, "");
  return `auto_${piscinaId}_${dateKey}`;
}

function getPoolDiagnostic(pool: Piscina, traceId: string) {
  return {
    clienteId: safeText(pool.clienteId, "nao informado"),
    dataAvulsa: safeOptionalText(pool.dataAvulsa ?? pool.dataAtendimentoAvulso) ?? null,
    diasAtendimento: Array.isArray(pool.diasAtendimento) ? pool.diasAtendimento : [],
    empresaId: safeText(pool.empresaId, "nao informado"),
    frequencia: pool.frequenciaSemanal ?? null,
    nome: safeText(pool.nome, "Piscina nao encontrada"),
    piscinaId: safeText(pool.id, "nao informado"),
    plano: pool.planoAtendimento ?? "nao informado",
    status: safeText((pool as unknown as { status?: unknown }).status, "nao informado"),
    traceId,
  };
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("pt-BR");
}

function parseDateLabel(value?: string | null) {
  const parsed = parseLocalDate(value);
  return parsed ? startOfDate(parsed) : null;
}

function sortDateLabels(left: string, right: string) {
  const leftDate = parseDateLabel(left)?.getTime() ?? 0;
  const rightDate = parseDateLabel(right)?.getTime() ?? 0;
  return leftDate - rightDate;
}

function startOfDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDaysToDate(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return startOfDate(nextDate);
}

function safeText(value: unknown, fallback = "") {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    return value.trim() || fallback;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
}

function safeOptionalText(value: unknown) {
  const text = safeText(value);
  return text || undefined;
}

function normalizeTextToken(value: unknown) {
  return safeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function createSmartAgendaTraceId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const weekDayIndexes: Record<WeekDay, number> = {
  friday: 5,
  monday: 1,
  saturday: 6,
  sunday: 0,
  thursday: 4,
  tuesday: 2,
  wednesday: 3,
};
