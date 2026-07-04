import type { Timestamp } from "firebase/firestore";

export type FinanceiroStatus = "pendente" | "pago" | "cancelado";

export type Financeiro = {
  id: string;
  empresaId: string;
  clienteId: string;
  piscinaId?: string;
  valorMensal?: number;
  diaVencimento?: number;
  mesReferencia: string;
  status: FinanceiroStatus;
  pagoEm?: Timestamp;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
};
