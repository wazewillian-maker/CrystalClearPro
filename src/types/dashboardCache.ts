import type { Timestamp } from "firebase/firestore";

export type DashboardPorFuncionario = {
  funcionarioId: string;
  nome: string;
  totalPiscinas: number;
  pendentes: number;
  concluidas: number;
};

export type DashboardResumoDiario = {
  piscinasDoDia: number;
  atendimentosConcluidos: number;
  produtosPendentes: number;
  financeiroPendente: number;
  fotosRegistradas: number;
};

export type DashboardCache = {
  id: string;
  empresaId: string;
  data: string;
  resumo: DashboardResumoDiario;
  porFuncionario: DashboardPorFuncionario[];
  atualizadoEm: Timestamp;
};
