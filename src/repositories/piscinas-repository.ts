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

  async create(data: Omit<Piscina, "id" | "createdAt" | "updatedAt" | "criadoEm" | "atualizadoEm">): Promise<string> {
    const ref = await addDoc(collection(getFirebaseFirestore(), collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  async update(id: string, data: Partial<Omit<Piscina, "id" | "createdAt" | "criadoEm">>): Promise<void> {
    await updateDoc(doc(getFirebaseFirestore(), collectionName, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },
};
