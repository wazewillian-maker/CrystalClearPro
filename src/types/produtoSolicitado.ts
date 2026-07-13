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
  unidade?: "kg" | "g" | "L" | "ml" | "unidade";
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
  proximaVisitaData?: string;
  status: ProdutoSolicitadoStatus;
  itens: ProdutoSolicitadoItem[];
  visitaId?: string;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
};
