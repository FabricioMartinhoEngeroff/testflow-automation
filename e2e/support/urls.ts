// caminhos relativos ao baseURL (PGR_URL) definido no playwright.config.ts
export const URLS = {
  login: "/apollus/login",
  perfilAcesso: "/apollus/perfis_acesso/perfil",
  perfilAcessoCadastro: "/apollus/perfis_acesso/perfil/cadastro",
  pgr: "/apollus/seguranca/programas-laudos/pgr",
  ltcat: "/apollus/seguranca/programas-laudos/ltcat",
  ltcatCadastro: "/apollus/seguranca/programas-laudos/ltcat/cadastro",
  profissional: "/apollus/seguranca/gro/cadastros/profissional",
  modeloDocumento: "/apollus/cadastro/gerais/modelo-documento",
  modeloDocumentoCadastro: "/apollus/cadastro/gerais/modelo-documento/cadastro",
  grupoEmail: "/apollus/cadastro/gerais/grupo-email",
} as const
