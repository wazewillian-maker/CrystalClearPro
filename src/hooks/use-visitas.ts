import { useCallback, useState } from "react";

import { agendaService } from "../services/agenda-service";
import type { Visita } from "../types/visita";

export function useVisitas() {
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarVisitasDoDia = useCallback(async (empresaId: string, data: string) => {
    setLoading(true);
    try {
      setVisitas(await agendaService.listarVisitasDoDia(empresaId, data));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    visitas,
    loading,
    carregarVisitasDoDia,
    criarVisita: agendaService.criarVisita,
    atualizarVisita: agendaService.atualizarVisita,
  };
}
