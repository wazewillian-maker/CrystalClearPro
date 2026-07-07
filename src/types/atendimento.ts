import type { Timestamp } from "firebase/firestore";

export type AtendimentoChecklist = {
  aspiracao: boolean;
  completarNivelAgua: boolean;
  conferirEquipamentos: boolean;
  escovarParedes: boolean;
  limparBorda: boolean;
  limparCestos: boolean;
  medicaoPh: boolean;
  medicaoCloro: boolean;
  retrolavarFiltro: boolean;
  verificarCasaMaquinas: boolean;
  verificarVazamentos: boolean;
};

export type ProdutoAtendimento = {
  produto: string;
  quantidade: string;
  unidade?: string;
};

export type ProdutoNecessarioAtendimento = {
  produto: string;
  quantidade: string;
  observacao?: string;
};

export type ParametrosAguaAtendimento = {
  alcalinidade?: string;
  cloro?: string;
  ph?: string;
  temperatura?: string;
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
  parametrosAgua?: ParametrosAguaAtendimento;
  produtosUtilizados?: string;
  produtosUtilizadosLista?: ProdutoAtendimento[];
  observacoes?: string;
  fotoAntesUrl?: string;
  fotoDepoisUrl?: string;
  fotoAntesPlaceholder?: string;
  fotoDepoisPlaceholder?: string;
  produtosFaltando?: ProdutoNecessarioAtendimento[];
  produtosNecessarios?: ProdutoNecessarioAtendimento[];
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
};
