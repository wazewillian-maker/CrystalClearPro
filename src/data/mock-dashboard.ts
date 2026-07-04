import colors from "../theme/colors";
import type { DashboardMetric, MaintenanceTask } from "../types/maintenance";

export const dashboardMetrics: DashboardMetric[] = [
  {
    id: "today",
    label: "Hoje",
    value: "08",
    helper: "visitas planejadas",
    tone: colors.primary,
  },
  {
    id: "done",
    label: "Concluidas",
    value: "03",
    helper: "servicos finalizados",
    tone: colors.success,
  },
  {
    id: "alerts",
    label: "Alertas",
    value: "02",
    helper: "piscinas com atencao",
    tone: colors.danger,
  },
];

export const maintenanceTasks: MaintenanceTask[] = [
  {
    id: "1",
    poolName: "Residencial Horizonte",
    address: "Alphaville - Setor Norte",
    service: "Medicao de pH, cloro e limpeza das bordas",
    time: "09:00",
    status: "scheduled",
  },
  {
    id: "2",
    poolName: "Condominio Lago Azul",
    address: "Bloco C - Area comum",
    service: "Baixo nivel de cloro, revisar bomba e filtragem",
    time: "11:30",
    status: "urgent",
  },
  {
    id: "3",
    poolName: "Casa Jardim Imperial",
    address: "Rua das Palmeiras, 248",
    service: "Aspiracao completa e reposicao de produtos",
    time: "14:00",
    status: "scheduled",
  },
  {
    id: "4",
    poolName: "Clube Vista Clara",
    address: "Piscina semiolimpica",
    service: "Tratamento concluido e relatorio enviado",
    time: "16:20",
    status: "done",
  },
];
