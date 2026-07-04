import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";

import { getFirebaseFirestore } from "../firebase/firestore";
import type { Usuario } from "../types/usuario";
import { mapFirestoreDocs } from "./firestore-mapper";

const collectionName = "usuarios";

export const usuariosRepository = {
  async getById(id: string): Promise<Usuario | null> {
    const snapshot = await getDoc(doc(getFirebaseFirestore(), collectionName, id));
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Usuario) : null;
  },

  async listByEmpresa(empresaId: string): Promise<Usuario[]> {
    const snapshot = await getDocs(query(collection(getFirebaseFirestore(), collectionName), where("empresaId", "==", empresaId)));
    return mapFirestoreDocs<Usuario>(snapshot);
  },

  async save(id: string, data: Omit<Usuario, "id" | "criadoEm" | "atualizadoEm">): Promise<void> {
    await setDoc(doc(getFirebaseFirestore(), collectionName, id), {
      ...data,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
  },

  async update(id: string, data: Partial<Omit<Usuario, "id" | "criadoEm">>): Promise<void> {
    await updateDoc(doc(getFirebaseFirestore(), collectionName, id), {
      ...data,
      atualizadoEm: serverTimestamp(),
    });
  },
};
