import type { Timestamp } from "firebase/firestore";
import type { WeekDay } from "./client";

export type PiscinaStatus = "ativa" | "inativa";
export type PlanoAtendimento = "mensal" | "quinzenal" | "semanal" | "todo_dia" | "avulso";
export type FrequenciaSemanal = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Piscina = {
  id: string;
  empresaId: string;
  clienteId: string;
  nome: string;
  tipo?: string;
  litros?: number;
  observacoes?: string;
  fotoReferenciaUrl?: string;
  planoAtendimento?: PlanoAtendimento;
  valorMensal?: number;
  diaVencimento?: number;
  frequenciaSemanal?: FrequenciaSemanal;
  diasAtendimento?: WeekDay[];
  diaMensal?: number;
  dataAvulsa?: string;
  diaMesAtendimento?: number;
  dataAtendimentoAvulso?: string;
  status: PiscinaStatus;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  criadoEm?: Timestamp;
  atualizadoEm?: Timestamp;
};

export type PiscinaFormData = {
  clienteId: string;
  nome: string;
  tipo: string;
  litros?: number;
  observacoes: string;
  fotoReferenciaUrl?: string;
  planoAtendimento: PlanoAtendimento;
  valorMensal: number;
  diaVencimento: number;
  frequenciaSemanal?: FrequenciaSemanal;
  diasAtendimento: WeekDay[];
  diaMensal?: number;
  dataAvulsa?: string;
};

export const planoAtendimentoLabels: Record<PlanoAtendimento, string> = {
  avulso: "Avulso",
  mensal: "Mensal",
  quinzenal: "Quinzenal",
  semanal: "Semanal",
  todo_dia: "Todos os dias",
};

export const frequenciaSemanalLabels: Record<FrequenciaSemanal, string> = {
  1: "1 vez na semana",
  2: "2 vezes na semana",
  3: "3 vezes na semana",
  4: "4 vezes na semana",
  5: "5 vezes na semana",
  6: "6 vezes na semana",
  7: "7 vezes na semana",
};
