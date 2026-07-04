import type { DocumentData, QueryDocumentSnapshot, QuerySnapshot } from "firebase/firestore";

export function mapFirestoreDoc<T extends { id: string }>(document: QueryDocumentSnapshot<DocumentData>): T {
  return {
    id: document.id,
    ...document.data(),
  } as T;
}

export function mapFirestoreDocs<T extends { id: string }>(snapshot: QuerySnapshot<DocumentData>): T[] {
  return snapshot.docs.map((document) => mapFirestoreDoc<T>(document));
}
