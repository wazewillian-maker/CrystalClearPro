import { useCallback, useState } from "react";

import { dashboardService } from "../services/dashboard-service";
import type { DashboardCache } from "../types/dashboardCache";

export function useDashboard() {
  const [dashboard, setDashboard] = useState<DashboardCache | null>(null);
  const [loading, setLoading] = useState(false);

  const carregarDashboard = useCallback(async (empresaId: string, data: string) => {
    setLoading(true);
    try {
      setDashboard(await dashboardService.obterResumoDiario(empresaId, data));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    dashboard,
    loading,
    carregarDashboard,
    salvarResumoDiario: dashboardService.salvarResumoDiario,
  };
}
