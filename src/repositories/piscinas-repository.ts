import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";

import { getFirebaseFirestore } from "../firebase/firestore";
import type { Piscina } from "../types/piscina";
import { mapFirestoreDocs } from "./firestore-mapper";

const collectionName = "piscinas";

export const piscinasRepository = {
  async getById(id: string): Promise<Piscina | null> {
    const snapshot = await getDoc(doc(getFirebaseFirestore(), collectionName, id));
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Piscina) : null;
  },

  async listByCliente(clienteId: string): Promise<Piscina[]> {
    const snapshot = await getDocs(query(collection(getFirebaseFirestore(), collectionName), where("clienteId", "==", clienteId)));
    return mapFirestoreDocs<Piscina>(snapshot);
  },

  async listByEmpresa(empresaId: string): Promise<Piscina[]> {
    const snapshot = await getDocs(query(collection(getFirebaseFirestore(), collectionName), where("empresaId", "==", empresaId)));
    return mapFirestoreDocs<Piscina>(snapshot);
  },

  async create(data: Omit<Piscina, "id" | "criadoEm" | "atualizadoEm">): Promise<string> {
    const ref = await addDoc(collection(getFirebaseFirestore(), collectionName), {
      ...data,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
    return ref.id;
  },

  async update(id: string, data: Partial<Omit<Piscina, "id" | "criadoEm">>): Promise<void> {
    await updateDoc(doc(getFirebaseFirestore(), collectionName, id), {
      ...data,
      atualizadoEm: serverTimestamp(),
    });
  },
};
