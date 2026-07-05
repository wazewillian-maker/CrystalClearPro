import type { Timestamp } from "firebase/firestore";

export type ClienteStatus = "ativo" | "inativo";

export type Cliente = {
  id: string;
  empresaId: string;
  usuarioId?: string;
  nome: string;
  telefone?: string;
  email?: string;
  bairro?: string;
  cidade?: string;
  endereco?: string;
  observacoes?: string;
  status: ClienteStatus;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  criadoEm?: Timestamp;
  atualizadoEm?: Timestamp;
};
