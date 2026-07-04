import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";

import { getFirebaseFirestore } from "../firebase/firestore";
import type { Cliente } from "../types/cliente";
import { mapFirestoreDocs } from "./firestore-mapper";

const collectionName = "clientes";

export const clientesRepository = {
  async getById(id: string): Promise<Cliente | null> {
    const snapshot = await getDoc(doc(getFirebaseFirestore(), collectionName, id));
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Cliente) : null;
  },

  async listByEmpresa(empresaId: string): Promise<Cliente[]> {
    const snapshot = await getDocs(query(collection(getFirebaseFirestore(), collectionName), where("empresaId", "==", empresaId)));
    return mapFirestoreDocs<Cliente>(snapshot);
  },

  async create(data: Omit<Cliente, "id" | "criadoEm" | "atualizadoEm">): Promise<string> {
    const ref = await addDoc(collection(getFirebaseFirestore(), collectionName), {
      ...data,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
    return ref.id;
  },

  async update(id: string, data: Partial<Omit<Cliente, "id" | "criadoEm">>): Promise<void> {
    await updateDoc(doc(getFirebaseFirestore(), collectionName, id), {
      ...data,
      atualizadoEm: serverTimestamp(),
    });
  },
};
