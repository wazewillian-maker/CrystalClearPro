import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";

import { getFirebaseAuth } from "../firebase/auth";

export const authService = {
  async login(email: string, senha: string) {
    return signInWithEmailAndPassword(getFirebaseAuth(), email, senha);
  },

  async logout() {
    await signOut(getFirebaseAuth());
  },

  async registrarUsuario(email: string, senha: string) {
    return createUserWithEmailAndPassword(getFirebaseAuth(), email, senha);
  },

  async resetarSenha(email: string) {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  },

  obterUsuarioAtual(): User | null {
    return getFirebaseAuth().currentUser;
  },

  observarUsuario(callback: (user: User | null) => void) {
    return onAuthStateChanged(getFirebaseAuth(), callback);
  },
};
