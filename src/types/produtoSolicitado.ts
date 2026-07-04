import type { Timestamp } from "firebase/firestore";

export type ProdutoSolicitadoStatus =
  | "pendente_aprovacao"
  | "parcialmente_aprovado"
  | "aprovado"
  | "recusado"
  | "entregue";

export type ProdutoSolicitadoItemStatus = "pendente" | "aprovado" | "recusado" | "entregue";

export type ProdutoSolicitadoItem = {
  id: string;
  produto: string;
  quantidade: string;
  observacao?: string;
  status: ProdutoSolicitadoItemStatus;
  aprovadoEm?: Timestamp;
  recusadoEm?: Timestamp;
  entregueEm?: Timestamp;
  fotoEntregaUrl?: string;
};

export type ProdutoSolicitado = {
  id: string;
  empresaId: string;
  clienteId: string;
  piscinaId: string;
  atendimentoId?: string;
  status: ProdutoSolicitadoStatus;
  itens: ProdutoSolicitadoItem[];
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
};
