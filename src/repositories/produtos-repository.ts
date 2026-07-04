import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";

import { getFirebaseFirestore } from "../firebase/firestore";
import type { ProdutoSolicitado } from "../types/produtoSolicitado";
import { mapFirestoreDocs } from "./firestore-mapper";

const collectionName = "produtosSolicitados";

export const produtosRepository = {
  async listByEmpresa(empresaId: string): Promise<ProdutoSolicitado[]> {
    const snapshot = await getDocs(query(collection(getFirebaseFirestore(), collectionName), where("empresaId", "==", empresaId)));
    return mapFirestoreDocs<ProdutoSolicitado>(snapshot);
  },

  async listByCliente(clienteId: string): Promise<ProdutoSolicitado[]> {
    const snapshot = await getDocs(query(collection(getFirebaseFirestore(), collectionName), where("clienteId", "==", clienteId)));
    return mapFirestoreDocs<ProdutoSolicitado>(snapshot);
  },

  async create(data: Omit<ProdutoSolicitado, "id" | "criadoEm" | "atualizadoEm">): Promise<string> {
    const ref = await addDoc(collection(getFirebaseFirestore(), collectionName), {
      ...data,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
    return ref.id;
  },

  async update(id: string, data: Partial<Omit<ProdutoSolicitado, "id" | "criadoEm">>): Promise<void> {
    await updateDoc(doc(getFirebaseFirestore(), collectionName, id), {
      ...data,
      atualizadoEm: serverTimestamp(),
    });
  },
};
