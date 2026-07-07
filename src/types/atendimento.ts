import type { Timestamp } from "firebase/firestore";

export type AtendimentoChecklist = {
  aspiracao: boolean;
  escovacaoBordas: boolean;
  limpezaPreFiltro: boolean;
  medicaoPh: boolean;
  medicaoCloro: boolean;
  aplicacaoProduto: boolean;
  lavagemFiltro: boolean;
};

export type ProdutoFaltandoAtendimento = {
  produto: string;
  quantidade: string;
  observacao?: string;
};

export type Atendimento = {
  id: string;
  empresaId: string;
  piscinaId: string;
  clienteId: string;
  visitaId?: string;
  funcionarioId?: string;
  atendidoPor?: string;
  data: string;
  checklist: AtendimentoChecklist;
  ph?: string;
  cloro?: string;
  produtosUtilizados?: string;
  observacoes?: string;
  fotoAntesUrl?: string;
  fotoDepoisUrl?: string;
  produtosFaltando?: ProdutoFaltandoAtendimento[];
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
};
