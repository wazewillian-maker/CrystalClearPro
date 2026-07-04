import { empresaRepository } from "../repositories/empresa-repository";

export const empresaService = {
  obterEmpresa: empresaRepository.getById,
  criarEmpresa: empresaRepository.create,
  atualizarEmpresa: empresaRepository.update,
};
