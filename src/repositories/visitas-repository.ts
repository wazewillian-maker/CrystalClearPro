import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";

import { getFirebaseFirestore } from "../firebase/firestore";
import type { Visita } from "../types/visita";
import { mapFirestoreDocs } from "./firestore-mapper";

const collectionName = "visitas";

function limparUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

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
      ...limparUndefined(data as unknown as Record<string, unknown>),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  async createAutomatic(
    uniqueId: string,
    data: Omit<Visita, "id" | "createdAt" | "updatedAt" | "criadoEm" | "atualizadoEm">,
  ): Promise<string> {
    const ref = doc(getFirebaseFirestore(), collectionName, uniqueId);
    await setDoc(ref, {
      ...limparUndefined(data as unknown as Record<string, unknown>),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  async update(id: string, data: Partial<Omit<Visita, "id" | "createdAt" | "criadoEm">>): Promise<void> {
    await updateDoc(doc(getFirebaseFirestore(), collectionName, id), {
      ...limparUndefined(data as unknown as Record<string, unknown>),
      updatedAt: serverTimestamp(),
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(getFirebaseFirestore(), collectionName, id));
  },
};
