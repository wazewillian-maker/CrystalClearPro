import type { WeekDay } from "../types/client";
import type { Piscina } from "../types/piscina";

export function normalizePersistedPool(pool: Piscina): Piscina {
  const raw = pool as unknown as Record<string, unknown>;
  const days = normalizeWeekDays(
    firstDefined(
      raw.diasAtendimento,
      raw.diasSemana,
      raw.diasDaSemana,
      raw.dias_atendimento,
      raw.weekDays,
      raw.weekdays,
      raw.diaSemana,
    ),
  );
  const plan = normalizePoolPlan(
    firstDefined(raw.planoAtendimento, raw.plano, raw.plan, raw.tipoPlano),
  ) ?? (days.length > 0 ? "semanal" : undefined);
  const frequency = normalizeWeeklyFrequency(
    firstDefined(raw.frequenciaSemanal, raw.frequencia, raw.frequency),
    days.length,
  );

  return {
    ...pool,
    clienteId: safeText(firstDefined(raw.clienteId, raw.clientId)),
    dataAtendimentoAvulso: safeOptionalText(
      firstDefined(raw.dataAtendimentoAvulso, raw.dataAtendimentoAvulsa),
    ),
    dataAvulsa: safeOptionalText(
      firstDefined(raw.dataAvulsa, raw.dataAtendimentoAvulso, raw.dataAtendimentoAvulsa),
    ),
    dataInicio: safeOptionalText(firstDefined(raw.dataInicio, raw.dataInicial, raw.startDate)),
    dataInicial: safeOptionalText(firstDefined(raw.dataInicial, raw.dataInicio, raw.startDate)),
    diasAtendimento: frequency === 7 ? allWeekDays : days,
    empresaId: safeText(firstDefined(raw.empresaId, raw.companyId)),
    frequenciaSemanal: frequency,
    funcionarioId: safeOptionalText(firstDefined(raw.funcionarioId, raw.employeeId)) ?? null,
    nome: safeText(firstDefined(raw.nome, raw.name), "Piscina"),
    planoAtendimento: plan,
    status: normalizePoolStatus(raw.status),
  };
}

export function normalizeWeekDays(value: unknown): WeekDay[] {
  const rawItems = getRawDayItems(value);
  const normalizedDays = rawItems
    .map(normalizeWeekDay)
    .filter((day): day is WeekDay => Boolean(day));

  return Array.from(new Set(normalizedDays));
}

function getRawDayItems(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return value.split(/[,/;|]+|\s+\+\s+|\s+e\s+/i);
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, enabled]) => enabled === true || enabled === 1 || enabled === "true")
      .map(([day]) => day);
  }

  return [];
}

function normalizeWeekDay(value: unknown): WeekDay | null {
  if (value && typeof value === "object") {
    const dayObject = value as Record<string, unknown>;
    return normalizeWeekDay(
      firstDefined(dayObject.value, dayObject.id, dayObject.day, dayObject.dia, dayObject.label),
    );
  }

  if (typeof value === "number" && Number.isInteger(value)) {
    return weekDaysByNumericIndex[value] ?? null;
  }

  const rawText = safeText(value);

  if (/^[0-7]$/.test(rawText)) {
    return weekDaysByNumericIndex[Number(rawText)] ?? null;
  }

  const aliases: Record<string, WeekDay> = {
    dom: "sunday",
    domingo: "sunday",
    friday: "friday",
    fri: "friday",
    monday: "monday",
    mon: "monday",
    qua: "wednesday",
    quarta: "wednesday",
    quarta_feira: "wednesday",
    qui: "thursday",
    quinta: "thursday",
    quinta_feira: "thursday",
    sab: "saturday",
    sabado: "saturday",
    saturday: "saturday",
    sat: "saturday",
    seg: "monday",
    segunda: "monday",
    segunda_feira: "monday",
    sex: "friday",
    sexta: "friday",
    sexta_feira: "friday",
    sunday: "sunday",
    ter: "tuesday",
    terca: "tuesday",
    terca_feira: "tuesday",
    thursday: "thursday",
    thu: "thursday",
    tuesday: "tuesday",
    tue: "tuesday",
    wednesday: "wednesday",
    wed: "wednesday",
  };

  return aliases[normalizeToken(rawText)] ?? null;
}

function normalizePoolPlan(value: unknown): Piscina["planoAtendimento"] {
  const aliases: Record<string, Piscina["planoAtendimento"]> = {
    avulso: "avulso",
    biweekly: "quinzenal",
    daily: "todo_dia",
    mensal: "mensal",
    monthly: "mensal",
    one_time: "avulso",
    onetime: "avulso",
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

  return aliases[normalizeToken(value)];
}

function normalizeWeeklyFrequency(
  value: unknown,
  configuredDayCount: number,
): Piscina["frequenciaSemanal"] {
  const aliases: Record<string, number> = {
    custom: configuredDayCount,
    daily: 7,
    once: 1,
    three_times: 3,
    thrice: 3,
    twice: 2,
  };
  const token = normalizeToken(value);
  const numericValue = typeof value === "number" ? value : Number(safeText(value));
  const frequency = Number.isInteger(numericValue)
    ? numericValue
    : aliases[token] ?? configuredDayCount;

  return frequency >= 1 && frequency <= 7
    ? (frequency as Piscina["frequenciaSemanal"])
    : undefined;
}

function normalizePoolStatus(value: unknown): Piscina["status"] {
  const token = normalizeToken(value);
  return token === "inativa" || token === "inativo" || token === "inactive"
    ? "inativa"
    : "ativa";
}

function firstDefined(...values: unknown[]) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function safeOptionalText(value: unknown) {
  const text = safeText(value);
  return text || undefined;
}

function safeText(value: unknown, fallback = "") {
  if (typeof value === "string") {
    return value.trim() || fallback;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return fallback;
}

function normalizeToken(value: unknown) {
  return safeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
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

const weekDaysByNumericIndex: Record<number, WeekDay> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
  7: "sunday",
};
