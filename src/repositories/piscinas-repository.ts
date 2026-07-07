import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";

import { getFirebaseFirestore } from "../firebase/firestore";
import type { Piscina } from "../types/piscina";
import { mapFirestoreDocs } from "./firestore-mapper";

const collectionName = "piscinas";

export function limparUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

function limparDadosPiscina<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const data = limparUndefined(obj) as Record<string, unknown>;
  const planoAtendimento = data.planoAtendimento;
  const hasPlanoAtendimento = typeof planoAtendimento === "string";
  const usesWeekDays =
    planoAtendimento === "mensal" ||
    planoAtendimento === "semanal" ||
    planoAtendimento === "quinzenal" ||
    planoAtendimento === "todo_dia";

  if (hasPlanoAtendimento && planoAtendimento !== "avulso") {
    data.dataAvulsa = null;
    data.dataAtendimentoAvulso = null;
    data.dataAtendimentoAvulsa = null;
  } else if (data.dataAvulsa === "") {
    data.dataAvulsa = null;
  }

  if (hasPlanoAtendimento) {
    data.diaMensal = null;
    data.diaMesAtendimento = null;
  } else if (data.diaMensal === "") {
    data.diaMensal = null;
  }

  if (hasPlanoAtendimento && !usesWeekDays) {
    data.frequenciaSemanal = null;
    data.diasAtendimento = [];
  }

  if ("nome" in data && data.nome === "") {
    data.nome = "Piscina principal";
  }

  return limparUndefined(data as T);
}

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
      ...limparDadosPiscina(data as unknown as Record<string, unknown>),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  async update(id: string, data: Partial<Omit<Piscina, "id" | "createdAt" | "criadoEm">>): Promise<void> {
    await updateDoc(doc(getFirebaseFirestore(), collectionName, id), {
      ...limparDadosPiscina(data as unknown as Record<string, unknown>),
      updatedAt: serverTimestamp(),
    });
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(getFirebaseFirestore(), collectionName, id));
  },
};
