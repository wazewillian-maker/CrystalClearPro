import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore";

import { getFirebaseFirestore } from "../firebase/firestore";
import type { Atendimento } from "../types/atendimento";
import { mapFirestoreDocs } from "./firestore-mapper";

const collectionName = "atendimentos";

function limparUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

export const atendimentosRepository = {
  async listByPiscina(piscinaId: string, empresaId?: string): Promise<Atendimento[]> {
    const constraints = empresaId
      ? [where("empresaId", "==", empresaId), where("piscinaId", "==", piscinaId)]
      : [where("piscinaId", "==", piscinaId)];
    const snapshot = await getDocs(query(collection(getFirebaseFirestore(), collectionName), ...constraints));
    return mapFirestoreDocs<Atendimento>(snapshot);
  },

  async listByEmpresa(empresaId: string): Promise<Atendimento[]> {
    const snapshot = await getDocs(query(collection(getFirebaseFirestore(), collectionName), where("empresaId", "==", empresaId)));
    return mapFirestoreDocs<Atendimento>(snapshot);
  },

  async create(data: Omit<Atendimento, "id" | "criadoEm" | "atualizadoEm">): Promise<string> {
    const ref = await addDoc(collection(getFirebaseFirestore(), collectionName), {
      ...limparUndefined(data as unknown as Record<string, unknown>),
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
    return ref.id;
  },
};
