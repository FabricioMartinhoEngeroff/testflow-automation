import { test as base, expect } from "@playwright/test"
import { Login } from "./actions/Login"
import { Pgr } from "./actions/Pgr"
// PERMISSÕES (desativado): import { PerfilAcessoPage } from "./actions/PerfilAcesso"
// PERMISSÕES (desativado): import { credenciaisPerfil } from "../shared/env"
import { LtcatPage } from "./actions/LTCAT/LTCAT"
import { LtcatCadastroPage } from "./actions/LTCAT/LTCATCadastro"
import { LtcatReferenciasPage } from "./actions/LTCAT/LTCATReferencias"
import { LtcatConfiguracoesPage } from "./actions/LTCAT/LTCATConfiguracoes"
import { LtcatAnexosPage } from "./actions/LTCAT/LTCATAnexos"
import { LtcatAnexoModal } from "./actions/LTCAT/LTCATAnexoModal"
import { LtcatColaboradoresPage } from "./actions/LTCAT/LTCATColaboradores"
import { LtcatColaboradorModal } from "./actions/LTCAT/LTCATColaboradorModal"
import { LtcatEquipeModal } from "./actions/LTCAT/LTCATEquipeModal"
import { LtcatConclusaoPage } from "./actions/LTCAT/LTCATConclusao"
import { LtcatHistoricoRevisoesModal } from "./actions/LTCAT/LTCATHistoricoRevisoes"
import { LtcatNotificacoesModal } from "./actions/LTCAT/LTCATNotificacoes"
import { ProfissionalPage } from "./actions/Profissional"
import { Toast } from "./actions/Toast"

// PERMISSÕES (desativado):
// // segundo usuário (PGR_USUARIO_PERFIL), em contexto próprio: o `page` normal fica
// // com o usuário do .env, que edita o perfil de acesso dele
// type UsuarioPerfil = { page: Page; login: Login; ltcat: LtcatPage; toast: Toast; entrar: () => Promise<void> }
type Pages = {
  // PERMISSÕES (desativado): perfilAcessoPage: PerfilAcessoPage
  // PERMISSÕES (desativado): usuarioPerfil: UsuarioPerfil
  login: Login
  pgr: Pgr
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
  toast: Toast
}

// cada page é instanciada sob demanda, só nos testes que a pedem no argumento
export const test = base.extend<Pages>({
// PERMISSÕES (desativado):
//   perfilAcessoPage: async ({ page }, use) => {
//     await use(new PerfilAcessoPage(page))
//   },
//   usuarioPerfil: async ({ browser, baseURL, locale }, use) => {
//     const context = await browser.newContext({ baseURL, locale })
//     const page = await context.newPage()
//     const login = new Login(page)
//     await use({
//       page,
//       login,
//       ltcat: new LtcatPage(page),
//       toast: new Toast(page),
//       entrar: () => login.entrar(credenciaisPerfil()),
//     })
//     await context.close()
//   },
  login: async ({ page }, use) => {
    await use(new Login(page))
  },
  pgr: async ({ page }, use) => {
    await use(new Pgr(page))
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
    await use(new Toast(page))
  },
})

export { expect }
