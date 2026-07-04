import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";

import { getFirebaseFirestore } from "../firebase/firestore";
import type { Funcionario } from "../types/funcionario";
import { mapFirestoreDocs } from "./firestore-mapper";

const collectionName = "funcionarios";

export const funcionariosRepository = {
  async getById(id: string): Promise<Funcionario | null> {
    const snapshot = await getDoc(doc(getFirebaseFirestore(), collectionName, id));
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Funcionario) : null;
  },

  async listByEmpresa(empresaId: string): Promise<Funcionario[]> {
    const snapshot = await getDocs(query(collection(getFirebaseFirestore(), collectionName), where("empresaId", "==", empresaId)));
    return mapFirestoreDocs<Funcionario>(snapshot);
  },

  async create(data: Omit<Funcionario, "id" | "criadoEm" | "atualizadoEm">): Promise<string> {
    const ref = await addDoc(collection(getFirebaseFirestore(), collectionName), {
      ...data,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
    return ref.id;
  },

  async update(id: string, data: Partial<Omit<Funcionario, "id" | "criadoEm">>): Promise<void> {
    await updateDoc(doc(getFirebaseFirestore(), collectionName, id), {
      ...data,
      atualizadoEm: serverTimestamp(),
    });
  },
};
