import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

import { getFirebaseFirestore } from "../firebase/firestore";
import type { DashboardCache } from "../types/dashboardCache";

const collectionName = "dashboardCache";

export const dashboardCacheRepository = {
  async getDailyCache(empresaId: string, data: string): Promise<DashboardCache | null> {
    const id = `${empresaId}_${data}`;
    const snapshot = await getDoc(doc(getFirebaseFirestore(), collectionName, id));
    return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as DashboardCache) : null;
  },

  async saveDailyCache(data: Omit<DashboardCache, "id" | "atualizadoEm">): Promise<void> {
    const id = `${data.empresaId}_${data.data}`;
    await setDoc(doc(getFirebaseFirestore(), collectionName, id), {
      ...data,
      atualizadoEm: serverTimestamp(),
    });
  },
};
