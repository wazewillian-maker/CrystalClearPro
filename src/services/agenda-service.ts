import { visitasRepository } from "../repositories/visitas-repository";
import type { Visita } from "../types/visita";

export const agendaService = {
  listarVisitasDoDia(empresaId: string, data: string) {
    return visitasRepository.listByEmpresaAndDate(empresaId, data);
  },

  listarVisitasDoFuncionario(empresaId: string, funcionarioId: string, data: string) {
    return visitasRepository.listByFuncionarioAndDate(empresaId, funcionarioId, data);
  },

  criarVisita(data: Omit<Visita, "id" | "criadoEm" | "atualizadoEm">) {
    return visitasRepository.create(data);
  },

  atualizarVisita(id: string, data: Partial<Omit<Visita, "id" | "criadoEm">>) {
    return visitasRepository.update(id, data);
  },
};
