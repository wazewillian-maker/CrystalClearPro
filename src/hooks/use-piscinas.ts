import { useCallback, useState } from "react";

import { piscinasService } from "../services/piscinas-service";
import type { Piscina } from "../types/piscina";

export function usePiscinas() {
  const [piscinas, setPiscinas] = useState<Piscina[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarPiscinas = useCallback(async (empresaId: string) => {
    setLoading(true);
    try {
      setPiscinas(await piscinasService.listarPorEmpresa(empresaId));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    piscinas,
    loading,
    carregarPiscinas,
    criarPiscina: piscinasService.criarPiscina,
    atualizarPiscina: piscinasService.atualizarPiscina,
  };
}
