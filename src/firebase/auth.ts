import { getAuth, type Auth } from "firebase/auth";

import { getFirebaseApp } from "./config";

let firebaseAuth: Auth | null = null;

export function getFirebaseAuth() {
  if (!firebaseAuth) {
    firebaseAuth = getAuth(getFirebaseApp());
  }

  return firebaseAuth;
}
