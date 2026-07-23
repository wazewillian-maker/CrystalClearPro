export type AgendaStatus = "pending" | "in-progress" | "finished";

export type AgendaItem = {
  id: string;
  clientId?: string;
  piscinaId?: string;
  clientName: string;
  neighborhood: string;
  address: string;
  visitDate?: string;
  data?: string;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  funcionarioId?: string;
  origem?: "Automatica" | "Manual" | "Agenda Inteligente";
  poolName?: string;
  status: AgendaStatus;
  virtual?: boolean;
};

export const agendaStatusLabels: Record<AgendaStatus, string> = {
  pending: "Pendente",
  "in-progress": "Em atendimento",
  finished: "Finalizado",
};
