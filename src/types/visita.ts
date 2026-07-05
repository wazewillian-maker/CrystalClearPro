import type { Timestamp } from "firebase/firestore";

export type VisitaStatus = "pendente" | "em andamento" | "concluida";
export type VisitaOrigem = "manual" | "agenda";

export type Visita = {
  id: string;
  empresaId: string;
  piscinaId: string;
  clienteId: string;
  funcionarioId?: string;
  data: string;
  status: VisitaStatus;
  origem: VisitaOrigem;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  criadoEm?: Timestamp;
  atualizadoEm?: Timestamp;
};
