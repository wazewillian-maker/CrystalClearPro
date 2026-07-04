import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore";

import { getFirebaseFirestore } from "../firebase/firestore";
import type { Atendimento } from "../types/atendimento";
import { mapFirestoreDocs } from "./firestore-mapper";

const collectionName = "atendimentos";

export const atendimentosRepository = {
  async listByPiscina(piscinaId: string): Promise<Atendimento[]> {
    const snapshot = await getDocs(query(collection(getFirebaseFirestore(), collectionName), where("piscinaId", "==", piscinaId)));
    return mapFirestoreDocs<Atendimento>(snapshot);
  },

  async listByEmpresa(empresaId: string): Promise<Atendimento[]> {
    const snapshot = await getDocs(query(collection(getFirebaseFirestore(), collectionName), where("empresaId", "==", empresaId)));
    return mapFirestoreDocs<Atendimento>(snapshot);
  },

  async create(data: Omit<Atendimento, "id" | "criadoEm" | "atualizadoEm">): Promise<string> {
    const ref = await addDoc(collection(getFirebaseFirestore(), collectionName), {
      ...data,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
    return ref.id;
  },
};
