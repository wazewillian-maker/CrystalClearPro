import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

import { getFirebaseApp } from "./config";

export type UploadableFile = Blob | Uint8Array | ArrayBuffer;

export function getFirebaseStorage() {
  return getStorage(getFirebaseApp());
}

export async function uploadFile(path: string, file: UploadableFile) {
  const storageRef = ref(getFirebaseStorage(), path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function getFileDownloadUrl(path: string) {
  return getDownloadURL(ref(getFirebaseStorage(), path));
}

export async function removeFile(path: string) {
  await deleteObject(ref(getFirebaseStorage(), path));
}
