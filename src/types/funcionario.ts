import type { Timestamp } from "firebase/firestore";

export type FuncionarioFuncao = "dono" | "socio" | "funcionario";
export type FuncionarioStatus = "ativo" | "inativo";

export type Funcionario = {
  id: string;
  empresaId: string;
  usuarioId?: string;
  nome: string;
  telefone?: string;
  email?: string;
  funcao: FuncionarioFuncao;
  status: FuncionarioStatus;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
};
