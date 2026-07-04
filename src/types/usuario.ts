import type { Timestamp } from "firebase/firestore";

export type UsuarioPerfil = "dono" | "socio" | "funcionario" | "cliente";
export type UsuarioStatus = "ativo" | "inativo" | "pendente";

export type Usuario = {
  id: string;
  empresaId: string;
  nome: string;
  email: string;
  telefone?: string;
  perfil: UsuarioPerfil;
  status: UsuarioStatus;
  clienteId?: string;
  funcionarioId?: string;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
  ultimoLoginEm?: Timestamp;
};
