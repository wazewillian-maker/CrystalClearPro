export type AgendaStatus = "pending" | "in-progress" | "finished";

export type AgendaItem = {
  id: string;
  clientName: string;
  neighborhood: string;
  address: string;
  status: AgendaStatus;
};

export const agendaStatusLabels: Record<AgendaStatus, string> = {
  pending: "Pendente",
  "in-progress": "Em atendimento",
  finished: "Finalizado",
};
