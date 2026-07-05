import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";

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

  async listByUsuario(usuarioId: string): Promise<Funcionario[]> {
    const snapshot = await getDocs(query(collection(getFirebaseFirestore(), collectionName), where("usuarioId", "==", usuarioId)));
    return mapFirestoreDocs<Funcionario>(snapshot);
  },

  async create(data: Omit<Funcionario, "id" | "createdAt" | "updatedAt" | "criadoEm" | "atualizadoEm">): Promise<string> {
    const ref = await addDoc(collection(getFirebaseFirestore(), collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  async createWithId(id: string, data: Omit<Funcionario, "id" | "createdAt" | "updatedAt" | "criadoEm" | "atualizadoEm">): Promise<void> {
    await setDoc(doc(getFirebaseFirestore(), collectionName, id), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  async update(id: string, data: Partial<Omit<Funcionario, "id" | "createdAt" | "criadoEm">>): Promise<void> {
    await updateDoc(doc(getFirebaseFirestore(), collectionName, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },
};
