import { sendPasswordResetEmail } from "firebase/auth";
import { collection, doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

import { firebaseConfig } from "../firebase/config";
import { getFirebaseAuth } from "../firebase/auth";
import { getFirebaseFirestore } from "../firebase/firestore";
import { clientesRepository } from "../repositories/clientes-repository";
import { funcionariosRepository } from "../repositories/funcionarios-repository";
import { piscinasRepository } from "../repositories/piscinas-repository";
import { usuariosRepository } from "../repositories/usuarios-repository";
import type { Funcionario } from "../types/funcionario";
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

  listarFuncionarios(empresaId: string) {
    return funcionariosRepository.listByEmpresa(empresaId);
  },

  async sincronizarFuncionarios(empresaId: string): Promise<number> {
    const [usuarios, funcionarios] = await Promise.all([
      usuariosRepository.listByEmpresa(empresaId),
      funcionariosRepository.listByEmpresa(empresaId),
    ]);
    let syncedCount = 0;

    for (const usuario of usuarios) {
      if (usuario.perfil !== "funcionario" && usuario.perfil !== "socio") {
        continue;
      }

      const funcionarioByUsuario = funcionarios.find((funcionario) => funcionario.usuarioId === usuario.id);
      const funcionarioById = usuario.funcionarioId
        ? funcionarios.find((funcionario) => funcionario.id === usuario.funcionarioId)
        : undefined;
      const existingFuncionario = funcionarioByUsuario ?? funcionarioById;

      if (existingFuncionario) {
        await Promise.all([
          funcionariosRepository.update(existingFuncionario.id, {
            cargo: usuario.cargo ?? "",
            email: usuario.email,
            empresaId: usuario.empresaId,
            funcao: usuario.perfil,
            nome: usuario.nome,
            status: isUsuarioAtivo(usuario) ? "ativo" : "inativo",
            telefone: usuario.telefone ?? "",
            usuarioId: usuario.id,
          }),
          usuario.funcionarioId === existingFuncionario.id
            ? Promise.resolve()
            : usuariosRepository.update(usuario.id, { funcionarioId: existingFuncionario.id }),
        ]);
        syncedCount += usuario.funcionarioId === existingFuncionario.id ? 0 : 1;
        continue;
      }

      const funcionarioId = usuario.funcionarioId || doc(collection(getFirebaseFirestore(), "funcionarios")).id;

      await funcionariosRepository.createWithId(funcionarioId, {
        cargo: usuario.cargo ?? "",
        email: usuario.email,
        empresaId: usuario.empresaId,
        funcao: usuario.perfil,
        nome: usuario.nome,
        status: isUsuarioAtivo(usuario) ? "ativo" : "inativo",
        telefone: usuario.telefone ?? "",
        usuarioId: usuario.id,
      });
      await usuariosRepository.update(usuario.id, { funcionarioId });
      syncedCount += 1;
    }

    return syncedCount;
  },

  async criarUsuario(input: AdminCreateUserInput): Promise<string> {
    const uid = await createAuthUserWithRestApi(input.email.trim(), input.senhaTemporaria);
    const funcionarioId =
      input.perfil === "funcionario" || input.perfil === "socio"
        ? doc(collection(getFirebaseFirestore(), "funcionarios")).id
        : undefined;
    const clienteId =
      input.perfil === "cliente"
        ? await clientesRepository.create({
            bairro: "",
            cidade: "",
            email: input.email.trim(),
            empresaId: input.empresaId,
            endereco: "",
            nome: input.nome.trim(),
            observacoes: "",
            status: "ativo",
            telefone: input.telefone?.trim() || "",
            usuarioId: uid,
          })
        : undefined;

    await setDoc(doc(getFirebaseFirestore(), "usuarios", uid), {
      ativo: true,
      cargo: input.cargo?.trim() || null,
      createdAt: serverTimestamp(),
      criadoEm: serverTimestamp(),
      email: input.email.trim(),
      empresaId: input.empresaId,
      clienteId: clienteId ?? null,
      funcionarioId: funcionarioId ?? null,
      nome: input.nome.trim(),
      perfil: input.perfil,
      status: "ativo",
      telefone: input.telefone?.trim() || null,
      atualizadoEm: serverTimestamp(),
    });

    if (clienteId) {
      await piscinasRepository.create({
        clienteId,
        diaVencimento: 1,
        empresaId: input.empresaId,
        fotoReferenciaUrl: "",
        litros: 0,
        nome: "Piscina principal",
        observacoes: "",
        planoAtendimento: "mensal",
        dataAvulsa: "",
        diaMensal: 1,
        diasAtendimento: [],
        status: "ativa",
        tipo: "",
        valorMensal: 0,
      });
    }

    if (funcionarioId && (input.perfil === "funcionario" || input.perfil === "socio")) {
      await funcionariosRepository.createWithId(funcionarioId, {
        cargo: input.cargo?.trim() || "",
        email: input.email.trim(),
        empresaId: input.empresaId,
        funcao: input.perfil,
        nome: input.nome.trim(),
        status: "ativo",
        telefone: input.telefone?.trim() || "",
        usuarioId: uid,
      });
    }

    return uid;
  },

  async atualizarUsuario(uid: string, input: AdminUpdateUserInput): Promise<void> {
    const funcionario = await getFuncionarioByUsuario(uid);

    await updateDoc(doc(getFirebaseFirestore(), "usuarios", uid), {
      ativo: input.ativo,
      cargo: input.cargo?.trim() || null,
      nome: input.nome.trim(),
      status: input.ativo ? "ativo" : "inativo",
      telefone: input.telefone?.trim() || null,
      atualizadoEm: serverTimestamp(),
    });

    if (funcionario) {
      await funcionariosRepository.update(funcionario.id, {
        cargo: input.cargo?.trim() || "",
        nome: input.nome.trim(),
        status: input.ativo ? "ativo" : "inativo",
        telefone: input.telefone?.trim() || "",
      });
    }
  },

  async desativarUsuario(uid: string): Promise<void> {
    const funcionario = await getFuncionarioByUsuario(uid);

    await updateDoc(doc(getFirebaseFirestore(), "usuarios", uid), {
      ativo: false,
      status: "inativo",
      atualizadoEm: serverTimestamp(),
    });

    if (funcionario) {
      await funcionariosRepository.update(funcionario.id, {
        status: "inativo",
      });
    }
  },

  async resetarSenha(email: string): Promise<void> {
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
  },

  usuarioEstaAtivo(usuario: Usuario) {
    return isUsuarioAtivo(usuario);
  },
};

function isUsuarioAtivo(usuario: Usuario) {
  return usuario.ativo ?? usuario.status === "ativo";
}

async function getFuncionarioByUsuario(usuarioId: string): Promise<Funcionario | null> {
  const funcionarios = await funcionariosRepository.listByUsuario(usuarioId);
  return funcionarios[0] ?? null;
}
