import type { Timestamp } from "firebase/firestore";

export type NotificacaoTipo =
  | "limpeza_concluida"
  | "produto_pendente_aprovacao"
  | "produto_aprovado"
  | "produto_recusado"
  | "pagamento_registrado";

export type Notificacao = {
  id: string;
  empresaId: string;
  usuarioId?: string;
  clienteId?: string;
  tipo: NotificacaoTipo;
  titulo: string;
  mensagem: string;
  lida: boolean;
  criadoEm: Timestamp;
};
