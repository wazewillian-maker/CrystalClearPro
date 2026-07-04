import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";

import { getFirebaseFirestore } from "../firebase/firestore";
import type { Financeiro } from "../types/financeiro";
import { mapFirestoreDocs } from "./firestore-mapper";

const collectionName = "financeiro";

export const financeiroRepository = {
  async listByEmpresa(empresaId: string, mesReferencia: string): Promise<Financeiro[]> {
    const snapshot = await getDocs(
      query(collection(getFirebaseFirestore(), collectionName), where("empresaId", "==", empresaId), where("mesReferencia", "==", mesReferencia))
    );
    return mapFirestoreDocs<Financeiro>(snapshot);
  },

  async listByCliente(clienteId: string): Promise<Financeiro[]> {
    const snapshot = await getDocs(query(collection(getFirebaseFirestore(), collectionName), where("clienteId", "==", clienteId)));
    return mapFirestoreDocs<Financeiro>(snapshot);
  },

  async create(data: Omit<Financeiro, "id" | "criadoEm" | "atualizadoEm">): Promise<string> {
    const ref = await addDoc(collection(getFirebaseFirestore(), collectionName), {
      ...data,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
    return ref.id;
  },

  async update(id: string, data: Partial<Omit<Financeiro, "id" | "criadoEm">>): Promise<void> {
    await updateDoc(doc(getFirebaseFirestore(), collectionName, id), {
      ...data,
      atualizadoEm: serverTimestamp(),
    });
  },
};
