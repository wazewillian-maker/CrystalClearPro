import type { Timestamp } from "firebase/firestore";

export type EmpresaStatus = "ativa" | "inativa" | "suspensa";

export type Empresa = {
  id: string;
  nome: string;
  logoUrl?: string;
  telefone?: string;
  whatsapp?: string;
  pix?: string;
  cnpj?: string;
  cidade?: string;
  endereco?: string;
  email?: string;
  status: EmpresaStatus;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
};
