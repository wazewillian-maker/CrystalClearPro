import { deleteApp, getApp, initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signOut } from "firebase/auth";
import { doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

import { firebaseConfig } from "../firebase/config";
import { getFirebaseAuth } from "../firebase/auth";
import { getFirebaseFirestore } from "../firebase/firestore";
import { usuariosRepository } from "../repositories/usuarios-repository";
import type { Usuario, UsuarioPerfil } from "../types/usuario";

const secondaryAppName = "crystal-clear-admin-user-creation";

export type AdminCreateUserInput = {
  cargo?: string;
  email: string;
  empresaId: string;
  nome: string;
  perfil: Extract<UsuarioPerfil, "funcionario" | "socio" | "cliente">;
  senhaTemporaria: string;
  telefone?: string;
};

export type AdminUpdateUserInput = {
  ativo: boolean;
  cargo?: string;
  nome: string;
  telefone?: string;
};

function getSecondaryAuth() {
  try {
    return getAuth(getApp(secondaryAppName));
  } catch {
    return getAuth(initializeApp(firebaseConfig, secondaryAppName));
  }
}

export const adminService = {
  listarUsuarios(empresaId: string) {
    return usuariosRepository.listByEmpresa(empresaId);
  },

  async criarUsuario(input: AdminCreateUserInput): Promise<string> {
    const secondaryAuth = getSecondaryAuth();
    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      input.email.trim(),
      input.senhaTemporaria
    );
    const uid = credential.user.uid;

    await setDoc(doc(getFirebaseFirestore(), "usuarios", uid), {
      ativo: true,
      cargo: input.cargo?.trim() || null,
      createdAt: serverTimestamp(),
      criadoEm: serverTimestamp(),
      email: input.email.trim(),
      empresaId: input.empresaId,
      nome: input.nome.trim(),
      perfil: input.perfil,
      status: "ativo",
      telefone: input.telefone?.trim() || null,
      atualizadoEm: serverTimestamp(),
    });

    await signOut(secondaryAuth);
    await deleteApp(secondaryAuth.app).catch(() => undefined);

    return uid;
  },

  async atualizarUsuario(uid: string, input: AdminUpdateUserInput): Promise<void> {
    await updateDoc(doc(getFirebaseFirestore(), "usuarios", uid), {
      ativo: input.ativo,
      cargo: input.cargo?.trim() || null,
      nome: input.nome.trim(),
      status: input.ativo ? "ativo" : "inativo",
      telefone: input.telefone?.trim() || null,
      atualizadoEm: serverTimestamp(),
    });
  },

  async desativarUsuario(uid: string): Promise<void> {
    await updateDoc(doc(getFirebaseFirestore(), "usuarios", uid), {
      ativo: false,
      status: "inativo",
      atualizadoEm: serverTimestamp(),
    });
  },

  async resetarSenha(email: string): Promise<void> {
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
  },

  usuarioEstaAtivo(usuario: Usuario) {
    return usuario.ativo ?? usuario.status === "ativo";
  },
};
