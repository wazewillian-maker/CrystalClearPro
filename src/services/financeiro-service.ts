import { financeiroRepository } from "../repositories/financeiro-repository";
import type { Financeiro } from "../types/financeiro";

export const financeiroService = {
  listarPorEmpresa: financeiroRepository.listByEmpresa,
  listarPorCliente: financeiroRepository.listByCliente,

  criarCobranca(data: Omit<Financeiro, "id" | "criadoEm" | "atualizadoEm">) {
    return financeiroRepository.create(data);
  },

  atualizarCobranca(id: string, data: Partial<Omit<Financeiro, "id" | "criadoEm">>) {
    return financeiroRepository.update(id, data);
  },
};
