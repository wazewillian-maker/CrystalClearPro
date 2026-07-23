import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import type { User } from "firebase/auth";

import { authService } from "../services/auth-service";
import { usuariosRepository } from "../repositories/usuarios-repository";
import { getMissingFirebaseEnvVars, isFirebaseConfigured } from "../firebase/config";
import { isFirstAccessCreationInProgress } from "../services/first-access-service";
import type { Usuario, UsuarioPerfil } from "../types/usuario";

export type AuthenticatedUser = {
  ativo: boolean;
  cargo?: string;
  clienteId?: string;
  email: string;
  empresaId: string;
  funcionarioId?: string;
  nome: string;
  perfil: UsuarioPerfil;
  uid: string;
};

type AuthContextValue = {
  errorMessage: string | null;
  isAuthenticated: boolean;
  user: User | null;
  usuario: AuthenticatedUser | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<AuthenticatedUser>;
  logout: () => Promise<void>;
  registrarUsuario: (email: string, senha: string) => Promise<void>;
  resetarSenha: (email: string) => Promise<void>;
  obterUsuarioAtual: () => User | null;
  refreshUsuario: () => Promise<AuthenticatedUser | null>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [usuario, setUsuario] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUsuarioProfile = useCallback(async (firebaseUser: User): Promise<AuthenticatedUser> => {
    const profile = await usuariosRepository.getById(firebaseUser.uid);

    if (!profile) {
      throw new Error("Usuário autenticado, mas perfil ainda não configurado.");
    }

    const normalizedProfile = normalizeAuthenticatedUser(firebaseUser.uid, profile);

    if (!normalizedProfile.ativo) {
      throw new Error("Seu usuário está inativo. Fale com o administrador.");
    }

    setUser(firebaseUser);
    setUsuario(normalizedProfile);
    setErrorMessage(null);

    return normalizedProfile;
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setUser(null);
      setUsuario(null);
      setErrorMessage(getMissingFirebaseConfigMessage());
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = authService.observarUsuario((firebaseUser) => {
        void (async () => {
          setLoading(true);

          try {
            if (!firebaseUser) {
              setUser(null);
              setUsuario(null);
              return;
            }

            await loadUsuarioProfile(firebaseUser);
          } catch (error) {
            if (firebaseUser && isFirstAccessCreationInProgress() && isMissingUserProfileError(error)) {
              setUser(firebaseUser);
              setUsuario(null);
              setErrorMessage(null);
              return;
            }

            setUser(null);
            setUsuario(null);
            setErrorMessage(getAuthContextErrorMessage(error));
            await authService.logout().catch(() => undefined);
          } finally {
            setLoading(false);
          }
        })();
      });
    } catch (error) {
      setUser(null);
      setUsuario(null);
      setErrorMessage(getAuthContextErrorMessage(error));
      setLoading(false);
    }

    return unsubscribe;
  }, [loadUsuarioProfile]);

  const login = useCallback(async (email: string, senha: string) => {
    setLoading(true);
    try {
      const credential = await authService.login(email, senha);
      return await loadUsuarioProfile(credential.user);
    } catch (error) {
      const message = getAuthContextErrorMessage(error);
      setErrorMessage(message);
      await authService.logout().catch(() => undefined);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [loadUsuarioProfile]);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setUsuario(null);
    setErrorMessage(null);
  }, []);

  const registrarUsuario = useCallback(async (email: string, senha: string) => {
    setLoading(true);
    try {
      const credential = await authService.registrarUsuario(email, senha);
      setUser(credential.user);
    } finally {
      setLoading(false);
    }
  }, []);

  const resetarSenha = useCallback((email: string) => authService.resetarSenha(email), []);

  const refreshUsuario = useCallback(async () => {
    const currentUser = authService.obterUsuarioAtual();

    if (!currentUser) {
      setUser(null);
      setUsuario(null);
      return null;
    }

    return loadUsuarioProfile(currentUser);
  }, [loadUsuarioProfile]);

  const clearError = useCallback(() => setErrorMessage(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      clearError,
      errorMessage,
      isAuthenticated: Boolean(user && usuario),
      user,
      usuario,
      loading,
      login,
      logout,
      registrarUsuario,
      resetarSenha,
      obterUsuarioAtual: authService.obterUsuarioAtual,
      refreshUsuario,
    }),
    [clearError, errorMessage, loading, login, logout, refreshUsuario, registrarUsuario, resetarSenha, user, usuario]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function normalizeAuthenticatedUser(uid: string, usuario: Usuario): AuthenticatedUser {
  return {
    ativo: usuario.ativo ?? usuario.status === "ativo",
    cargo: usuario.cargo,
    clienteId: usuario.clienteId ?? undefined,
    email: usuario.email,
    empresaId: usuario.empresaId,
    funcionarioId: usuario.funcionarioId,
    nome: usuario.nome,
    perfil: usuario.perfil,
    uid,
  };
}

function getAuthContextErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Não foi possível autenticar.";
}

function getMissingFirebaseConfigMessage() {
  return `Firebase nao configurado para este build. Cadastre no EAS preview: ${getMissingFirebaseEnvVars().join(", ")}.`;
}

function isMissingUserProfileError(error: unknown) {
  return error instanceof Error && error.message.includes("perfil ainda");
}
export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext deve ser usado dentro de AuthProvider.");
  }

  return context;
}
