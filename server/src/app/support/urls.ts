// caminhos relativos ao baseURL (PGR_URL) definido no playwright.config.ts
export const URLS = {
  login: "/apollus/login",
  // PERMISSÕES (desativado): perfilAcessoCadastro: "/apollus/perfis_acesso/perfil/cadastro",
  pgr: "/apollus/seguranca/programas-laudos/pgr",
  ltcat: "/apollus/seguranca/programas-laudos/ltcat",
  ltcatCadastro: "/apollus/seguranca/programas-laudos/ltcat/cadastro",
  profissional: "/apollus/seguranca/gro/cadastros/profissional",
} as const
