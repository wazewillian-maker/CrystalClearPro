import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { getFirebaseAuth } from "../firebase/auth";
import { getFirebaseFirestore } from "../firebase/firestore";

type FirstAccessInput = {
  companyName: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
};

type FirstAccessStep = "auth" | "empresa" | "configuracoesEmpresa" | "usuario" | "logout";

const FIRST_ACCESS_TIMEOUT_MS = 15000;
let firstAccessCreationInProgress = false;

class FirstAccessFlowError extends Error {
  code: string;
  step: FirstAccessStep;

  constructor(code: string, step: FirstAccessStep, message: string) {
    super(message);
    this.code = code;
    this.name = "FirstAccessFlowError";
    this.step = step;
  }
}

export const firstAccessService = {
  async hasConfiguredOwner() {
    const snapshot = await getDocs(
      query(collection(getFirebaseFirestore(), "usuarios"), where("perfil", "==", "dono"), limit(1))
    );

    return !snapshot.empty;
  },

  async createFirstOwner(input: FirstAccessInput) {
    const auth = getFirebaseAuth();
    const db = getFirebaseFirestore();
    let uid = "";

    firstAccessCreationInProgress = true;

    try {
      const credential = await withFirstAccessTimeout(
        createUserWithEmailAndPassword(auth, input.email.trim(), input.password),
        "auth",
      );
      uid = credential.user.uid;
      await withFirstAccessTimeout(credential.user.getIdToken(true), "auth");

      if (!uid) {
        throw new FirstAccessFlowError("auth/missing-user", "auth", "Firebase Auth nao retornou o usuario criado.");
      }

      const now = serverTimestamp();
      const empresaRef = doc(collection(db, "empresas"));
      const empresaId = empresaRef.id;

      await withFirstAccessTimeout(
        setDoc(empresaRef, {
          empresaId,
          nome: input.companyName.trim(),
          status: "ativa",
          createdAt: now,
          criadoEm: now,
          atualizadoEm: now,
        }),
        "empresa",
      );

      const empresaSnapshot = await withFirstAccessTimeout(getDoc(empresaRef), "empresa");

      if (!empresaSnapshot.exists()) {
        throw new FirstAccessFlowError("firestore/not-found", "empresa", "Empresa nao foi confirmada no Firestore.");
      }

      const configuracaoRef = doc(db, "configuracoesEmpresa", empresaId);

      await withFirstAccessTimeout(
        setDoc(configuracaoRef, {
          empresaId,
          nomeEmpresa: input.companyName.trim(),
          tema: "crystal-clear-pro",
          corPrincipal: "#1565FF",
          telefone: input.phone.trim(),
          email: input.email.trim(),
          createdAt: now,
          atualizadoEm: now,
        }),
        "configuracoesEmpresa",
      );

      const configuracaoSnapshot = await withFirstAccessTimeout(getDoc(configuracaoRef), "configuracoesEmpresa");

      if (!configuracaoSnapshot.exists()) {
        throw new FirstAccessFlowError(
          "firestore/not-found",
          "configuracoesEmpresa",
          "Configuracoes da empresa nao foram confirmadas no Firestore.",
        );
      }

      const usuarioRef = doc(db, "usuarios", uid);

      await withFirstAccessTimeout(
        setDoc(usuarioRef, {
          ativo: true,
          cargo: "Dono",
          createdAt: now,
          criadoEm: now,
          atualizadoEm: now,
          email: input.email.trim(),
          empresaId,
          nome: input.ownerName.trim(),
          perfil: "dono",
          status: "ativo",
          telefone: input.phone.trim(),
        }),
        "usuario",
      );

      const usuarioSnapshot = await withFirstAccessTimeout(getDoc(usuarioRef), "usuario");

      if (!usuarioSnapshot.exists()) {
        throw new FirstAccessFlowError("firestore/not-found", "usuario", "Usuario dono nao foi confirmado no Firestore.");
      }

      return {
        empresaId,
        uid,
      };
    } finally {
      if (auth.currentUser?.uid === uid) {
        await withFirstAccessTimeout(signOut(auth), "logout", 5000).catch((error: unknown) => {
        console.warn("Nao foi possivel finalizar a sessao temporaria do primeiro acesso.", error);
        });
      }
      firstAccessCreationInProgress = false;
    }
  },
};

export function isFirstAccessCreationInProgress() {
  return firstAccessCreationInProgress;
}

async function withFirstAccessTimeout<T>(
  operation: Promise<T>,
  step: FirstAccessStep,
  timeoutMs = FIRST_ACCESS_TIMEOUT_MS,
) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new FirstAccessFlowError(
          "timeout",
          step,
          `Tempo esgotado ao executar a etapa ${getFirstAccessStepLabel(step)}.`,
        ),
      );
    }, timeoutMs);
  });

  try {
    return await Promise.race([operation, timeout]);
  } catch (error) {
    throw normalizeFirstAccessError(error, step);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function normalizeFirstAccessError(error: unknown, step: FirstAccessStep) {
  if (error instanceof FirstAccessFlowError) {
    return error;
  }

  const code = getFirebaseErrorCode(error);

  if (code === "auth/email-already-in-use") {
    return new FirstAccessFlowError(code, step, "E-mail ja cadastrado.");
  }

  if (code === "permission-denied") {
    return new FirstAccessFlowError(
      code,
      step,
      `Permissao negada no Firestore ao gravar ${getFirstAccessStepLabel(step)}.`,
    );
  }

  const message = error instanceof Error ? error.message : `Falha na etapa ${getFirstAccessStepLabel(step)}.`;

  return new FirstAccessFlowError(code || "unknown", step, message);
}

function getFirebaseErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;

    return typeof code === "string" ? code : "";
  }

  return "";
}

function getFirstAccessStepLabel(step: FirstAccessStep) {
  const labels: Record<FirstAccessStep, string> = {
    auth: "criacao no Firebase Auth",
    configuracoesEmpresa: "configuracoesEmpresa/{empresaId}",
    empresa: "empresas/{empresaId}",
    logout: "saida do usuario temporario",
    usuario: "usuarios/{uid}",
  };

  return labels[step];
}
