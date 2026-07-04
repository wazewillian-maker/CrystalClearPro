import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";

import { getFirebaseFirestore } from "../firebase/firestore";
import type { Visita } from "../types/visita";
import { mapFirestoreDocs } from "./firestore-mapper";

const collectionName = "visitas";

export const visitasRepository = {
  async listByEmpresaAndDate(empresaId: string, data: string): Promise<Visita[]> {
    const snapshot = await getDocs(
      query(collection(getFirebaseFirestore(), collectionName), where("empresaId", "==", empresaId), where("data", "==", data))
    );
    return mapFirestoreDocs<Visita>(snapshot);
  },

  async listByFuncionarioAndDate(empresaId: string, funcionarioId: string, data: string): Promise<Visita[]> {
    const snapshot = await getDocs(
      query(
        collection(getFirebaseFirestore(), collectionName),
        where("empresaId", "==", empresaId),
        where("funcionarioId", "==", funcionarioId),
        where("data", "==", data)
      )
    );
    return mapFirestoreDocs<Visita>(snapshot);
  },

  async create(data: Omit<Visita, "id" | "criadoEm" | "atualizadoEm">): Promise<string> {
    const ref = await addDoc(collection(getFirebaseFirestore(), collectionName), {
      ...data,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
    return ref.id;
  },

  async update(id: string, data: Partial<Omit<Visita, "id" | "criadoEm">>): Promise<void> {
    await updateDoc(doc(getFirebaseFirestore(), collectionName, id), {
      ...data,
      atualizadoEm: serverTimestamp(),
    });
  },
};
