import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";

import { getFirebaseFirestore } from "../firebase/firestore";
import type { Visita } from "../types/visita";
import { mapFirestoreDocs } from "./firestore-mapper";

const collectionName = "visitas";

export const visitasRepository = {
  async listByEmpresa(empresaId: string): Promise<Visita[]> {
    const snapshot = await getDocs(
      query(collection(getFirebaseFirestore(), collectionName), where("empresaId", "==", empresaId))
    );
    return mapFirestoreDocs<Visita>(snapshot);
  },

  async listByFuncionario(empresaId: string, funcionarioId: string): Promise<Visita[]> {
    const snapshot = await getDocs(
      query(
        collection(getFirebaseFirestore(), collectionName),
        where("empresaId", "==", empresaId),
        where("funcionarioId", "==", funcionarioId)
      )
    );
    return mapFirestoreDocs<Visita>(snapshot);
  },

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

  async listByPiscina(empresaId: string, piscinaId: string): Promise<Visita[]> {
    const snapshot = await getDocs(
      query(
        collection(getFirebaseFirestore(), collectionName),
        where("empresaId", "==", empresaId),
        where("piscinaId", "==", piscinaId)
      )
    );
    return mapFirestoreDocs<Visita>(snapshot);
  },

  async create(data: Omit<Visita, "id" | "createdAt" | "updatedAt" | "criadoEm" | "atualizadoEm">): Promise<string> {
    const ref = await addDoc(collection(getFirebaseFirestore(), collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  async update(id: string, data: Partial<Omit<Visita, "id" | "createdAt" | "criadoEm">>): Promise<void> {
    await updateDoc(doc(getFirebaseFirestore(), collectionName, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(getFirebaseFirestore(), collectionName, id));
  },
};
