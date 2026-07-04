import { dashboardCacheRepository } from "../repositories/dashboard-cache-repository";
import type { DashboardCache } from "../types/dashboardCache";

export const dashboardService = {
  obterResumoDiario: dashboardCacheRepository.getDailyCache,

  salvarResumoDiario(data: Omit<DashboardCache, "id" | "atualizadoEm">) {
    return dashboardCacheRepository.saveDailyCache(data);
  },
};
