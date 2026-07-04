import type { Usuario, UsuarioPerfil } from "../types/usuario";

const acessoPorPerfil: Record<UsuarioPerfil, string[]> = {
  dono: ["dashboard", "clientes", "agenda", "atendimento", "historico", "financeiro", "produtos", "equipe", "configuracoes"],
  socio: ["dashboard", "clientes", "agenda", "atendimento", "historico", "produtos", "equipe"],
  funcionario: ["dashboard", "agenda", "atendimento", "historico", "produtos"],
  cliente: ["area_cliente"],
};

export const permissoesService = {
  podeAcessar(usuario: Usuario | null, recurso: string) {
    if (!usuario || usuario.status !== "ativo") {
      return false;
    }

    return acessoPorPerfil[usuario.perfil].includes(recurso);
  },

  recursosDoPerfil(perfil: UsuarioPerfil) {
    return acessoPorPerfil[perfil];
  },

  pertenceEmpresa(usuario: Usuario | null, empresaId: string) {
    return Boolean(usuario && usuario.empresaId === empresaId);
  },
};
