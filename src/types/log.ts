import type { Timestamp } from "firebase/firestore";

export type LogAcao =
  | "login"
  | "cadastro"
  | "edicao"
  | "exclusao"
  | "atendimento_iniciado"
  | "atendimento_concluido"
  | "produto_aprovado"
  | "produto_recusado"
  | "pagamento_registrado";

export type LogEntidade =
  | "usuario"
  | "empresa"
  | "cliente"
  | "piscina"
  | "funcionario"
  | "visita"
  | "atendimento"
  | "produto"
  | "financeiro";

export type Log = {
  id: string;
  empresaId: string;
  usuarioId: string;
  acao: LogAcao;
  entidade: LogEntidade;
  entidadeId?: string;
  detalhes?: Record<string, unknown>;
  criadoEm: Timestamp;
};
