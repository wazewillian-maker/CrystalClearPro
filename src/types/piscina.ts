import type { Timestamp } from "firebase/firestore";

export type PiscinaStatus = "ativa" | "inativa";
export type PlanoAtendimento = "mensal" | "quinzenal" | "semanal" | "todo_dia" | "avulso";

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
  status: PiscinaStatus;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  criadoEm?: Timestamp;
  atualizadoEm?: Timestamp;
};
