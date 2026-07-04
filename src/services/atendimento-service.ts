import { atendimentosRepository } from "../repositories/atendimentos-repository";
import { produtosRepository } from "../repositories/produtos-repository";
import type { Atendimento } from "../types/atendimento";
import type { ProdutoSolicitado } from "../types/produtoSolicitado";

export const atendimentoService = {
  listarPorEmpresa: atendimentosRepository.listByEmpresa,
  listarPorPiscina: atendimentosRepository.listByPiscina,

  criarAtendimento(data: Omit<Atendimento, "id" | "criadoEm" | "atualizadoEm">) {
    return atendimentosRepository.create(data);
  },

  criarSolicitacaoProdutos(data: Omit<ProdutoSolicitado, "id" | "criadoEm" | "atualizadoEm">) {
    return produtosRepository.create(data);
  },
};
