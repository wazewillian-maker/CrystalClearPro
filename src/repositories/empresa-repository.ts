import { addDoc, collection, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";

import { getFirebaseFirestore } from "../firebase/firestore";
import type { Empresa } from "../types/empresa";

const collectionName = "empresas";

export const empresaRepository = {
  async getById(id: string): Promise<Empresa | null> {
    const snapshot = await getDoc(doc(getFirebaseFirestore(), collectionName, id));
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Empresa) : null;
  },

  async create(data: Omit<Empresa, "id" | "criadoEm" | "atualizadoEm">): Promise<string> {
    const ref = await addDoc(collection(getFirebaseFirestore(), collectionName), {
      ...data,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
    return ref.id;
  },

  async update(id: string, data: Partial<Omit<Empresa, "id" | "criadoEm">>): Promise<void> {
    await updateDoc(doc(getFirebaseFirestore(), collectionName, id), {
      ...data,
      atualizadoEm: serverTimestamp(),
    });
  },
};
