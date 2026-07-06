import type { Timestamp } from "firebase/firestore";

export type VisitaStatus = "pendente" | "em andamento" | "concluida";
export type VisitaOrigem = "manual" | "agenda" | "agenda-inteligente";

export type Visita = {
  id: string;
  empresaId: string;
  piscinaId: string;
  clienteId: string;
  funcionarioId?: string | null;
  responsavelNome?: string | null;
  data: string;
  status: VisitaStatus;
  origem: VisitaOrigem;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  criadoEm?: Timestamp;
  atualizadoEm?: Timestamp;
};
