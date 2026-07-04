import { collection, getDocs, limit, query } from "firebase/firestore";
import { getMetadata, ref } from "firebase/storage";

import { getFirebaseAuth } from "../firebase/auth";
import { getFirebaseApp, getMissingFirebaseEnvVars, isFirebaseConfigured } from "../firebase/config";
import { getFirebaseFirestore } from "../firebase/firestore";
import { getFirebaseStorage } from "../firebase/storage";

export type FirebaseDiagnosticStatus = "success" | "error";

export type FirebaseDiagnosticItem = {
  label: string;
  message: string;
  status: FirebaseDiagnosticStatus;
};

export type FirebaseDiagnosticsResult = {
  checkedAt: string;
  items: FirebaseDiagnosticItem[];
};

function success(label: string, message: string): FirebaseDiagnosticItem {
  return { label, message, status: "success" };
}

function failure(label: string, error: unknown): FirebaseDiagnosticItem {
  const message = error instanceof Error ? error.message : String(error);
  return { label, message, status: "error" };
}

function getErrorCode(error: unknown) {
  return typeof error === "object" && error && "code" in error ? String(error.code) : "";
}

export const firebaseDiagnosticsService = {
  async run(): Promise<FirebaseDiagnosticsResult> {
    const items: FirebaseDiagnosticItem[] = [];
    const missingEnvVars = getMissingFirebaseEnvVars();

    if (missingEnvVars.length > 0 || !isFirebaseConfigured()) {
      const message = `Variaveis ausentes: ${missingEnvVars.join(", ")}`;
      return {
        checkedAt: new Date().toLocaleString("pt-BR"),
        items: [
          { label: "Firebase", message, status: "error" },
          { label: "Authentication", message: "Aguardando credenciais Firebase.", status: "error" },
          { label: "Firestore", message: "Aguardando credenciais Firebase.", status: "error" },
          { label: "Storage", message: "Aguardando credenciais Firebase.", status: "error" },
        ],
      };
    }

    try {
      const app = getFirebaseApp();
      items.push(success("Firebase", `App inicializado: ${app.name}`));
    } catch (error) {
      items.push(failure("Firebase", error));
    }

    try {
      const auth = getFirebaseAuth();
      items.push(success("Authentication", `Auth conectado ao projeto ${auth.app.options.projectId ?? "Firebase"}.`));
    } catch (error) {
      items.push(failure("Authentication", error));
    }

    try {
      const firestore = getFirebaseFirestore();
      await getDocs(query(collection(firestore, "diagnostics"), limit(1)));
      items.push(success("Firestore", "Consulta de diagnostico executada com sucesso."));
    } catch (error) {
      if (getErrorCode(error) === "permission-denied") {
        items.push(success("Firestore", "Firestore conectado. As regras bloquearam leitura sem usuario autenticado."));
      } else {
        items.push(failure("Firestore", error));
      }
    }

    try {
      const storage = getFirebaseStorage();
      const diagnosticRef = ref(storage, "diagnostics/connection-check.txt");
      await getMetadata(diagnosticRef);
      items.push(success("Storage", `Storage conectado: ${storage.app.options.storageBucket ?? "bucket configurado"}.`));
    } catch (error) {
      const errorCode = getErrorCode(error);

      if (errorCode === "storage/object-not-found") {
        items.push(success("Storage", "Storage conectado. Arquivo de diagnostico nao existe, mas o bucket respondeu."));
      } else if (errorCode === "storage/unauthorized") {
        items.push(success("Storage", "Storage conectado. As regras bloquearam leitura sem usuario autenticado."));
      } else {
        items.push(failure("Storage", error));
      }
    }

    return {
      checkedAt: new Date().toLocaleString("pt-BR"),
      items,
    };
  },
};
