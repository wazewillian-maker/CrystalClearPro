import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from "react";

import { empresaService } from "../services/empresa-service";
import type { Empresa } from "../types/empresa";

type EmpresaContextValue = {
  empresa: Empresa | null;
  loading: boolean;
  carregarEmpresa: (empresaId: string) => Promise<void>;
  limparEmpresa: () => void;
};

const EmpresaContext = createContext<EmpresaContextValue | null>(null);

export function EmpresaProvider({ children }: PropsWithChildren) {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(false);

  const carregarEmpresa = useCallback(async (empresaId: string) => {
    setLoading(true);
    try {
      setEmpresa(await empresaService.obterEmpresa(empresaId));
    } finally {
      setLoading(false);
    }
  }, []);

  const limparEmpresa = useCallback(() => setEmpresa(null), []);

  const value = useMemo(
    () => ({
      empresa,
      loading,
      carregarEmpresa,
      limparEmpresa,
    }),
    [carregarEmpresa, empresa, limparEmpresa, loading]
  );

  return <EmpresaContext.Provider value={value}>{children}</EmpresaContext.Provider>;
}

export function useEmpresaContext() {
  const context = useContext(EmpresaContext);

  if (!context) {
    throw new Error("useEmpresaContext deve ser usado dentro de EmpresaProvider.");
  }

  return context;
}
