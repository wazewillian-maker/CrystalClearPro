import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore";

import { getFirebaseFirestore } from "../firebase/firestore";
import type { Log } from "../types/log";
import { mapFirestoreDocs } from "./firestore-mapper";

const collectionName = "logs";

export const logsRepository = {
  async listByEmpresa(empresaId: string): Promise<Log[]> {
    const snapshot = await getDocs(query(collection(getFirebaseFirestore(), collectionName), where("empresaId", "==", empresaId)));
    return mapFirestoreDocs<Log>(snapshot);
  },

  async create(data: Omit<Log, "id" | "criadoEm">): Promise<string> {
    const ref = await addDoc(collection(getFirebaseFirestore(), collectionName), {
      ...data,
      criadoEm: serverTimestamp(),
    });
    return ref.id;
  },
};
