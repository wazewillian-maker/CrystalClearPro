import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";

import { getFirebaseFirestore } from "../firebase/firestore";
import type { Notificacao } from "../types/notificacao";
import { mapFirestoreDocs } from "./firestore-mapper";

const collectionName = "notificacoes";

export const notificacoesRepository = {
  async listByUsuario(usuarioId: string): Promise<Notificacao[]> {
    const snapshot = await getDocs(query(collection(getFirebaseFirestore(), collectionName), where("usuarioId", "==", usuarioId)));
    return mapFirestoreDocs<Notificacao>(snapshot);
  },

  async create(data: Omit<Notificacao, "id" | "criadoEm">): Promise<string> {
    const ref = await addDoc(collection(getFirebaseFirestore(), collectionName), {
      ...data,
      criadoEm: serverTimestamp(),
    });
    return ref.id;
  },

  async markAsRead(id: string): Promise<void> {
    await updateDoc(doc(getFirebaseFirestore(), collectionName, id), { lida: true });
  },
};
