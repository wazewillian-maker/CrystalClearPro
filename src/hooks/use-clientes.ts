import { useCallback, useState } from "react";

import { clientesService } from "../services/clientes-service";
import type { Cliente } from "../types/cliente";

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarClientes = useCallback(async (empresaId: string) => {
    setLoading(true);
    try {
      setClientes(await clientesService.listarPorEmpresa(empresaId));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    clientes,
    loading,
    carregarClientes,
    criarCliente: clientesService.criarCliente,
    atualizarCliente: clientesService.atualizarCliente,
  };
}
