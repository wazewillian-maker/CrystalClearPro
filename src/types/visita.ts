import type { Timestamp } from "firebase/firestore";

export type VisitaStatus = "pendente" | "em_atendimento" | "finalizada" | "cancelada";
export type VisitaOrigem = "automatica" | "manual";

export type Visita = {
  id: string;
  empresaId: string;
  piscinaId: string;
  clienteId: string;
  funcionarioId?: string;
  data: string;
  status: VisitaStatus;
  origem: VisitaOrigem;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
};
