import { sendPasswordResetEmail } from "firebase/auth";
import { doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

import { firebaseConfig } from "../firebase/config";
import { getFirebaseAuth } from "../firebase/auth";
import { getFirebaseFirestore } from "../firebase/firestore";
import { usuariosRepository } from "../repositories/usuarios-repository";
import type { Usuario, UsuarioPerfil } from "../types/usuario";

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

type FirebaseSignUpResponse = {
  localId?: string;
  error?: {
    message?: string;
  };
};

async function createAuthUserWithRestApi(email: string, password: string) {
  if (!firebaseConfig.apiKey) {
    throw new Error("Firebase API key nao configurada.");
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`,
    {
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: false,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    }
  );
  const data = (await response.json()) as FirebaseSignUpResponse;

  if (!response.ok || !data.localId) {
    throw new Error(data.error?.message ?? "Nao foi possivel criar usuario no Firebase Authentication.");
  }

  return data.localId;
}

export const adminService = {
  listarUsuarios(empresaId: string) {
    return usuariosRepository.listByEmpresa(empresaId);
  },

  async criarUsuario(input: AdminCreateUserInput): Promise<string> {
    const uid = await createAuthUserWithRestApi(input.email.trim(), input.senhaTemporaria);

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
