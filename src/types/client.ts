export type ClientPlan = "monthly" | "biweekly";

export type ClientFrequency = "once" | "twice" | "three-times" | "daily" | "custom";

export type WeekDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type Client = {
  id: string;
  name: string;
  phone: string;
  city: string;
  neighborhood: string;
  address: string;
  poolType?: string;
  liters?: number;
  notes: string;
  plan: ClientPlan;
  frequency: ClientFrequency;
  weekDays: WeekDay[];
  valorMensal: number;
  diaVencimento: number;
};

export type ClientFormData = Omit<Client, "id">;

export const clientPlanLabels: Record<ClientPlan, string> = {
  monthly: "Mensal",
  biweekly: "Quinzenal",
};

export const clientFrequencyLabels: Record<ClientFrequency, string> = {
  once: "1 vez por semana",
  twice: "2 vezes por semana",
  "three-times": "3 vezes por semana",
  daily: "Todos os dias",
  custom: "Personalizado",
};

export const weekDayLabels: Record<WeekDay, string> = {
  monday: "Segunda",
  tuesday: "Terca",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sabado",
  sunday: "Domingo",
};
