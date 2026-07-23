import type { Timestamp } from "firebase/firestore";

export type UsuarioPerfil = "dono" | "socio" | "funcionario" | "cliente";
export type UsuarioStatus = "ativo" | "inativo" | "pendente";

export type Usuario = {
  id: string;
  empresaId: string;
  nome: string;
  email: string;
  telefone?: string;
  cargo?: string;
  perfil: UsuarioPerfil;
  status: UsuarioStatus;
  ativo?: boolean;
  clienteId?: string | null;
  funcionarioId?: string;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
  createdAt?: Timestamp;
  ultimoLoginEm?: Timestamp;
};
