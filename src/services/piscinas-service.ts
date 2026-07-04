import { piscinasRepository } from "../repositories/piscinas-repository";
import type { Piscina } from "../types/piscina";

export const piscinasService = {
  obterPiscina: piscinasRepository.getById,
  listarPorCliente: piscinasRepository.listByCliente,
  listarPorEmpresa: piscinasRepository.listByEmpresa,

  criarPiscina(data: Omit<Piscina, "id" | "criadoEm" | "atualizadoEm">) {
    return piscinasRepository.create(data);
  },

  atualizarPiscina(id: string, data: Partial<Omit<Piscina, "id" | "criadoEm">>) {
    return piscinasRepository.update(id, data);
  },
};
