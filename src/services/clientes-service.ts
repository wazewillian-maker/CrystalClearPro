import { clientesRepository } from "../repositories/clientes-repository";
import type { Cliente } from "../types/cliente";

export const clientesService = {
  obterCliente: clientesRepository.getById,
  listarPorEmpresa: clientesRepository.listByEmpresa,

  criarCliente(data: Omit<Cliente, "id" | "criadoEm" | "atualizadoEm">) {
    return clientesRepository.create(data);
  },

  atualizarCliente(id: string, data: Partial<Omit<Cliente, "id" | "criadoEm">>) {
    return clientesRepository.update(id, data);
  },
};
