import { test as base, expect } from "@playwright/test"
import { LoginPage } from "./actions/Login"
import { PgrPage } from "./actions/seguranca/programas-e-laudos/pgr/Pgr"
import { PerfilAcessoPage } from "./actions/perfis-de-acesso/gerenciar-perfis/PerfilAcesso"
// PERMISSÕES (desativado): import { credenciaisPerfil } from "@shared/env"
import { LtcatPage } from "./actions/seguranca/programas-e-laudos/ltcat/LTCAT"
import { LtcatCadastroPage } from "./actions/seguranca/programas-e-laudos/ltcat/LTCATCadastro"
import { LtcatReferenciasPage } from "./actions/seguranca/programas-e-laudos/ltcat/LTCATReferencias"
import { LtcatConfiguracoesPage } from "./actions/seguranca/programas-e-laudos/ltcat/LTCATConfiguracoes"
import { LtcatAnexosPage } from "./actions/seguranca/programas-e-laudos/ltcat/LTCATAnexos"
import { LtcatAnexoModal } from "./actions/seguranca/programas-e-laudos/ltcat/LTCATAnexoModal"
import { LtcatColaboradoresPage } from "./actions/seguranca/programas-e-laudos/ltcat/LTCATColaboradores"
import { LtcatColaboradorModal } from "./actions/seguranca/programas-e-laudos/ltcat/LTCATColaboradorModal"
import { LtcatEquipeModal } from "./actions/seguranca/programas-e-laudos/ltcat/LTCATEquipeModal"
import { LtcatConclusaoPage } from "./actions/seguranca/programas-e-laudos/ltcat/LTCATConclusao"
import { LtcatHistoricoRevisoesModal } from "./actions/seguranca/programas-e-laudos/ltcat/LTCATHistoricoRevisoes"
import { LtcatNotificacoesModal } from "./actions/seguranca/programas-e-laudos/ltcat/LTCATNotificacoes"
import { ProfissionalPage } from "./actions/seguranca/gro/profissional/Profissional"
import { ConfigGheAbaGeraisPage } from "./actions/seguranca/gro/configuracoes/ConfigGheAbaGerais"
import { ToastPage } from "./actions/Toast"
import { MenuLateralPage } from "./actions/MenuLateral"
import { IdiomaPage } from "./actions/Idioma"
import { RevisorPage } from "./actions/Revisor"
import { RelatoriosPage } from "./actions/Relatorios"
import { ConfiguracaoGeralPage } from "./actions/seguranca/programas-e-laudos/ConfiguracaoGeral"
import { ModeloDocumentoPage } from "./actions/cadastros-auxiliares/gerais/modelos-de-documento/ModeloDocumento"

// PERMISSÕES (desativado):
// // segundo usuário (PGR_USUARIO_PERFIL), em contexto próprio: o `page` normal fica
// // com o usuário do .env, que edita o perfil de acesso dele
// type UsuarioPerfil = { page: Page; login: LoginPage; ltcat: LtcatPage; toast: ToastPage; entrar: () => Promise<void> }
type Pages = {
  perfilAcessoPage: PerfilAcessoPage
  // PERMISSÕES (desativado): usuarioPerfil: UsuarioPerfil
  login: LoginPage
  pgr: PgrPage
  profissionalPage: ProfissionalPage
  ltcatPage: LtcatPage
  ltcatCadastroPage: LtcatCadastroPage
  ltcatReferenciasPage: LtcatReferenciasPage
  ltcatConfiguracoesPage: LtcatConfiguracoesPage
  ltcatAnexosPage: LtcatAnexosPage
  ltcatAnexoModal: LtcatAnexoModal
  ltcatColaboradoresPage: LtcatColaboradoresPage
  ltcatColaboradorModal: LtcatColaboradorModal
  ltcatEquipeModal: LtcatEquipeModal
  ltcatConclusaoPage: LtcatConclusaoPage
  ltcatHistoricoRevisoesModal: LtcatHistoricoRevisoesModal
  ltcatNotificacoesModal: LtcatNotificacoesModal
  toast: ToastPage
  menuLateral: MenuLateralPage
  idioma: IdiomaPage
  revisor: RevisorPage
  relatorios: RelatoriosPage
  modeloDocumentoPage: ModeloDocumentoPage
  configuracaoGeralPage: ConfiguracaoGeralPage
  configGheAbaGeraisPage: ConfigGheAbaGeraisPage
}

// cada page é instanciada sob demanda, só nos testes que a pedem no argumento
export const test = base.extend<Pages>({
  perfilAcessoPage: async ({ page }, use) => {
    await use(new PerfilAcessoPage(page))
  },
// PERMISSÕES (desativado):
//   usuarioPerfil: async ({ browser, baseURL, locale }, use) => {
//     const context = await browser.newContext({ baseURL, locale })
//     const page = await context.newPage()
//     const login = new LoginPage(page)
//     await use({
//       page,
//       login,
//       ltcat: new LtcatPage(page),
//       toast: new ToastPage(page),
//       entrar: () => login.entrar(credenciaisPerfil()),
//     })
//     await context.close()
//   },
  login: async ({ page }, use) => {
    await use(new LoginPage(page))
  },
  pgr: async ({ page }, use) => {
    await use(new PgrPage(page))
  },
  profissionalPage: async ({ page }, use) => {
    await use(new ProfissionalPage(page))
  },
  ltcatPage: async ({ page }, use) => {
    await use(new LtcatPage(page))
  },
  ltcatCadastroPage: async ({ page }, use) => {
    await use(new LtcatCadastroPage(page))
  },
  ltcatReferenciasPage: async ({ page }, use) => {
    await use(new LtcatReferenciasPage(page))
  },
  ltcatConfiguracoesPage: async ({ page }, use) => {
    await use(new LtcatConfiguracoesPage(page))
  },
  ltcatAnexosPage: async ({ page }, use) => {
    await use(new LtcatAnexosPage(page))
  },
  ltcatAnexoModal: async ({ page }, use) => {
    await use(new LtcatAnexoModal(page))
  },
  ltcatColaboradoresPage: async ({ page }, use) => {
    await use(new LtcatColaboradoresPage(page))
  },
  ltcatColaboradorModal: async ({ page }, use) => {
    await use(new LtcatColaboradorModal(page))
  },
  ltcatEquipeModal: async ({ page }, use) => {
    await use(new LtcatEquipeModal(page))
  },
  ltcatConclusaoPage: async ({ page }, use) => {
    await use(new LtcatConclusaoPage(page))
  },
  ltcatHistoricoRevisoesModal: async ({ page }, use) => {
    await use(new LtcatHistoricoRevisoesModal(page))
  },
  ltcatNotificacoesModal: async ({ page }, use) => {
    await use(new LtcatNotificacoesModal(page))
  },
  toast: async ({ page }, use) => {
    await use(new ToastPage(page))
  },
  menuLateral: async ({ page }, use) => {
    await use(new MenuLateralPage(page))
  },
  // volta a conta para português depois do teste, mesmo se ele falhar
  idioma: async ({ page }, use) => {
    const idioma = new IdiomaPage(page)
    await use(idioma)
    await idioma.restaurar()
  },
  revisor: async ({ page }, use) => {
    await use(new RevisorPage(page))
  },
  relatorios: async ({ page }, use) => {
    await use(new RelatoriosPage(page))
  },
  modeloDocumentoPage: async ({ page }, use) => {
    await use(new ModeloDocumentoPage(page))
  },
  configuracaoGeralPage: async ({ page }, use) => {
    await use(new ConfiguracaoGeralPage(page, new MenuLateralPage(page)))
  },
  configGheAbaGeraisPage: async ({ page }, use) => {
    await use(new ConfigGheAbaGeraisPage(page, new MenuLateralPage(page)))
  },
})

export { expect }
