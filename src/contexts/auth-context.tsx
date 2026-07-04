import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from "react";
import type { User } from "firebase/auth";

import { authService } from "../services/auth-service";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  registrarUsuario: (email: string, senha: string) => Promise<void>;
  resetarSenha: (email: string) => Promise<void>;
  obterUsuarioAtual: () => User | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email: string, senha: string) => {
    setLoading(true);
    try {
      const credential = await authService.login(email, senha);
      setUser(credential.user);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
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

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      logout,
      registrarUsuario,
      resetarSenha,
      obterUsuarioAtual: authService.obterUsuarioAtual,
    }),
    [loading, login, logout, registrarUsuario, resetarSenha, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext deve ser usado dentro de AuthProvider.");
  }

  return context;
}
