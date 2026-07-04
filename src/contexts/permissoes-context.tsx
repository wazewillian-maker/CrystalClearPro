import { createContext, useContext, useMemo, type PropsWithChildren } from "react";

import { permissoesService } from "../services/permissoes-service";
import type { Usuario, UsuarioPerfil } from "../types/usuario";

type PermissoesContextValue = {
  usuario: Usuario | null;
  podeAcessar: (recurso: string) => boolean;
  recursosDoPerfil: (perfil: UsuarioPerfil) => string[];
};

const PermissoesContext = createContext<PermissoesContextValue | null>(null);

type PermissoesProviderProps = PropsWithChildren<{
  usuario: Usuario | null;
}>;

export function PermissoesProvider({ children, usuario }: PermissoesProviderProps) {
  const value = useMemo(
    () => ({
      usuario,
      podeAcessar: (recurso: string) => permissoesService.podeAcessar(usuario, recurso),
      recursosDoPerfil: permissoesService.recursosDoPerfil,
    }),
    [usuario]
  );

  return <PermissoesContext.Provider value={value}>{children}</PermissoesContext.Provider>;
}

export function usePermissoesContext() {
  const context = useContext(PermissoesContext);

  if (!context) {
    throw new Error("usePermissoesContext deve ser usado dentro de PermissoesProvider.");
  }

  return context;
}
